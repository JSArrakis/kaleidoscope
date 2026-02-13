import { getDB } from "../db/sqlite.js";

export class ShowRepository {
  private get db() {
    return getDB();
  }

  /**
   * Create a new show with episodes
   */
  create(show: Show): Show {
    const transaction = this.db.transaction(() => {
      const showStmt = this.db.prepare(`
        INSERT INTO shows (title, mediaItemId, alias, imdb, durationLimit, firstEpisodeOverDuration, episodeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const showResult = showStmt.run(
        show.title,
        show.mediaItemId,
        show.alias || null,
        show.imdb || null,
        show.durationLimit || null,
        show.firstEpisodeOverDuration ? 1 : 0,
        show.episodeCount,
      );

      const showId = showResult.lastInsertRowid as number;

      // Insert show tags
      this.insertShowTags(show.mediaItemId, show.tags);

      // Insert episodes
      if (show.episodes && show.episodes.length > 0) {
        const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const episode of show.episodes) {
          episodeStmt.run(
            showId,
            episode.season,
            episode.episode,
            episode.episodeNumber,
            episode.path,
            episode.title,
            episode.mediaItemId,
            episode.showItemId,
            episode.duration || null,
            episode.durationLimit || null,
            episode.overDuration ? 1 : 0,
            7, // MediaType.Episode
          );

          this.insertEpisodeTags(episode.mediaItemId, episode.tags);
        }
      }

      // Compute and insert secondary tags from episodes
      this.syncSecondaryTagsForShow(show.mediaItemId);
    });

    transaction();
    return this.findByMediaItemId(show.mediaItemId)!;
  }

  /**
   * Find show by mediaItemId
   */
  findByMediaItemId(mediaItemId: string): Show | null {
    const showStmt = this.db.prepare(
      `SELECT * FROM shows WHERE mediaItemId = ?`,
    );
    const showRow = showStmt.get(mediaItemId) as any;
    if (!showRow) return null;

    const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
    const episodeRows = episodesStmt.all(showRow.id) as any[];

    return this.mapRowToShow(showRow, episodeRows);
  }

  /**
   * Find all shows
   */
  findAll(): Show[] {
    const showsStmt = this.db.prepare(`SELECT * FROM shows ORDER BY title`);
    const showRows = showsStmt.all() as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  /**
   * Find a random show
   */
  findRandomShow(): Show | null {
    const stmt = this.db.prepare(
      `SELECT * FROM shows ORDER BY RANDOM() LIMIT 1`,
    );
    const showRow = stmt.get() as any;
    if (!showRow) return null;

    const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
    const episodeRows = episodesStmt.all(showRow.id) as any[];

    return this.mapRowToShow(showRow, episodeRows);
  }

  findAllShowsUnderDuration(
    maxDuration: number,
    ageGroups: Tag[] = [],
  ): Show[] {
    const ageGroupIds = ageGroups.map((ageGroup) => ageGroup.tagId);

    let query = `SELECT * FROM shows WHERE durationLimit <= :maxDuration`;
    const params: any = { maxDuration };

    if (ageGroupIds.length > 0) {
      // Build dynamic named parameters for age group IDs
      const ageGroupPlaceholders = ageGroupIds
        .map((_, index) => `:ageGroupId_${index}`)
        .join(",");

      query += `
        AND mediaItemId IN (
          SELECT mediaItemId FROM show_tags 
          WHERE tagId IN (${ageGroupPlaceholders})
          GROUP BY mediaItemId 
          HAVING COUNT(DISTINCT tagId) = :ageGroupsCount
        )
      `;

      // Add each age group ID to params
      ageGroupIds.forEach((id, index) => {
        params[`ageGroupId_${index}`] = id;
      });
      params.ageGroupsCount = ageGroupIds.length;
    }

    query += ` ORDER BY title`;

    const stmt = this.db.prepare(query);
    const showRows = stmt.all(params) as any[];
    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }
    return shows;
  }

  /**
   * Find a random show under duration
   */
  findRandomShowUnderDuration(maxDuration: number): Show | null {
    const stmt = this.db.prepare(`
      SELECT * FROM shows 
      WHERE durationLimit <= ?
      ORDER BY RANDOM() LIMIT 1
    `);
    const showRow = stmt.get(maxDuration) as any;
    if (!showRow) return null;

    const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
    const episodeRows = episodesStmt.all(showRow.id) as any[];
    return this.mapRowToShow(showRow, episodeRows);
  }

  /**
   * Find shows by tag
   */
  findByTag(tagId: string): Show[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
    const showRows = stmt.all(tagId) as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  /**
   * Find shows by tag with episodes under duration
   */
  findByTagAndUnderDuration(tagId: string, maxDuration: number): Show[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
    const showRows = stmt.all(tagId) as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? AND duration <= ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id, maxDuration) as any[];
      if (episodeRows.length > 0) {
        const show = this.mapRowToShow(showRow, episodeRows);
        shows.push(show);
      }
    }

    return shows;
  }

  /**
   * Find shows with multiple tags (AND condition) where durationLimit is under max duration
   * Useful for facet-based selection where genre + aesthetic must both exist on the show
   * Optionally filter by age groups
   */
  findByTagsAndDurationLimit(
    tagIds: string[],
    maxDurationLimit: number,
    ageGroups: Tag[] = [],
  ): Show[] {
    if (tagIds.length === 0) return [];

    const ageGroupIds = ageGroups.map((ageGroup) => ageGroup.tagId);
    const placeholders = tagIds.map(() => "?").join(",");

    let query = `
      SELECT s.* FROM shows s
      WHERE s.durationLimit <= ?
      AND s.mediaItemId IN (
        SELECT mediaItemId FROM show_tags 
        WHERE tagId IN (${placeholders})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
    `;

    const params: any[] = [maxDurationLimit, ...tagIds, tagIds.length];

    if (ageGroupIds.length > 0) {
      query += `
        AND s.mediaItemId IN (
          SELECT mediaItemId FROM show_tags 
          WHERE tagId IN (${ageGroupIds.map(() => "?").join(",")})
          GROUP BY mediaItemId 
          HAVING COUNT(DISTINCT tagId) = ?
        )
      `;
      params.push(...ageGroupIds, ageGroupIds.length);
    }

    query += ` ORDER BY s.title`;

    const stmt = this.db.prepare(query);
    const showRows = stmt.all(...params) as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  /**
   * Find shows with multiple tags (AND condition) where durationLimit is under max duration
   * Optionally filter by age groups if provided
   */
  findByTagsAndAgeGroupsUnderDuration(
    tags: Tag[],
    ageGroups: Tag[] = [],
    maxDurationLimit: number,
  ): Show[] {
    if (tags.length === 0) return [];

    const tagIds = tags.map((tag) => tag.tagId);
    const ageGroupIds = ageGroups.map((ageGroup) => ageGroup.tagId);
    const placeholders = tagIds.map(() => "?").join(",");

    let query = `
      SELECT s.* FROM shows s
      WHERE s.durationLimit <= ?
      AND s.mediaItemId IN (
        SELECT mediaItemId FROM show_tags 
        WHERE tagId IN (${placeholders})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
    `;

    const params: any[] = [maxDurationLimit, ...tagIds, tagIds.length];

    if (ageGroupIds.length > 0) {
      query += `
        AND s.mediaItemId IN (
          SELECT mediaItemId FROM show_tags 
          WHERE tagId IN (${ageGroupIds.map(() => "?").join(",")})
          GROUP BY mediaItemId 
          HAVING COUNT(DISTINCT tagId) = ?
        )
      `;
      params.push(...ageGroupIds, ageGroupIds.length);
    }

    query += ` ORDER BY s.title`;

    const stmt = this.db.prepare(query);
    const showRows = stmt.all(...params) as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  /**
   * Update show
   */
  update(mediaItemId: string, show: Show): Show | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE shows 
        SET title = ?, alias = ?, imdb = ?, durationLimit = ?, firstEpisodeOverDuration = ?, 
            episodeCount = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        show.title,
        show.alias || null,
        show.imdb || null,
        show.durationLimit || null,
        show.firstEpisodeOverDuration ? 1 : 0,
        show.episodeCount,
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Delete and re-insert tags
      this.db
        .prepare("DELETE FROM show_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertShowTags(mediaItemId, show.tags);

      // Recompute and sync secondary tags from episodes
      this.syncSecondaryTagsForShow(mediaItemId);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  /**
   * Delete show
   */
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM shows WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  /**
   * Count total shows
   */
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shows`);
    const result = stmt.get() as any;
    return result.count;
  }

  /**
   * Get total minutes of holiday episodes from shows
   * Searches for episodes tagged with the holiday tag
   * Duration in database is stored in seconds, converts to minutes
   * @param holidayTagId The holiday tag ID
   * @returns Total minutes of all episodes with this holiday tag
   */
  getTotalMinutesByHolidayTag(holidayTagId: string): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(e.duration), 0) as totalSeconds
      FROM episodes e
      INNER JOIN episode_tags et ON e.mediaItemId = et.mediaItemId
      WHERE et.tagId = ?
    `);

    const result = stmt.get(holidayTagId) as any;
    const totalSeconds = result.totalSeconds || 0;
    return Math.floor(totalSeconds / 60); // Convert seconds to minutes
  }

  /**
   * Get episode by mediaItemId
   */
  getEpisode(episodeMediaItemId: string): Episode | null {
    const stmt = this.db.prepare(
      `SELECT * FROM episodes WHERE mediaItemId = ?`,
    );
    const row = stmt.get(episodeMediaItemId) as any;
    if (!row) return null;
    return this.mapRowToEpisode(row);
  }

  /**
   * Insert tags for a show
   */
  private insertShowTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO show_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);

    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId, tag.type);
    }
  }

  /**
   * Insert secondary tags for a show
   * Secondary tags are computed from episode tags, not manually inserted
   * This is a helper for bulk insertion only
   */
  private insertShowSecondaryTags(mediaItemId: string, tagIds: string[]): void {
    if (tagIds.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO show_secondary_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tagId of tagIds) {
      stmt.run(mediaItemId, tagId);
    }
  }

  /**
   * Synchronize secondary tags for a show based on its episodes
   * Secondary tags = episode tags that are NOT in the show's primary tags
   * This maintains a computed/derived relationship for performance optimization
   *
   * @param mediaItemId The show's mediaItemId
   */
  private syncSecondaryTagsForShow(mediaItemId: string): void {
    // Get all primary show tags
    const primaryTagsStmt = this.db.prepare(`
      SELECT DISTINCT tagId FROM show_tags WHERE mediaItemId = ?
    `);
    const primaryTagRows = primaryTagsStmt.all(mediaItemId) as any[];
    const primaryTagIds = new Set(primaryTagRows.map((r) => r.tagId));

    // Get all episode tags for episodes of this show
    const episodeTagsStmt = this.db.prepare(`
      SELECT DISTINCT et.tagId FROM episode_tags et
      JOIN episodes e ON et.mediaItemId = e.mediaItemId
      JOIN shows s ON e.showId = s.id
      WHERE s.mediaItemId = ?
    `);
    const episodeTagRows = episodeTagsStmt.all(mediaItemId) as any[];
    const episodeTagIds = new Set(episodeTagRows.map((r) => r.tagId));

    // Compute secondary tags (episode tags NOT in primary tags)
    const secondaryTagIds = Array.from(episodeTagIds).filter(
      (tagId) => !primaryTagIds.has(tagId),
    );

    // Clear existing secondary tags for this show
    const deleteStmt = this.db.prepare(`
      DELETE FROM show_secondary_tags WHERE mediaItemId = ?
    `);
    deleteStmt.run(mediaItemId);

    // Insert new secondary tags
    this.insertShowSecondaryTags(mediaItemId, secondaryTagIds);
  }

  /**
   * Insert tags for an episode
   */
  private insertEpisodeTags(episodeMediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO episode_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tag of tags) {
      stmt.run(episodeMediaItemId, tag.tagId);
    }
  }

  /**
   * Map database row to Episode object
   */
  private mapRowToEpisode(row: any): Episode {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN episode_tags et ON t.tagId = et.tagId
      WHERE et.mediaItemId = ?
      ORDER BY t.name
    `);

    const tagRows = tagsStmt.all(row.mediaItemId) as any[];
    const tags = tagRows.map((tagRow) => ({
      tagId: tagRow.tagId,
      name: tagRow.name,
      type: tagRow.type,
      seasonStartDate: tagRow.seasonStartDate,
      seasonEndDate: tagRow.seasonEndDate,
      sequence: tagRow.sequence,
    }));

    return {
      mediaItemId: row.mediaItemId,
      showItemId: row.showItemId,
      season: row.season,
      episode: row.episode,
      episodeNumber: row.episodeNumber,
      title: row.title,
      path: row.path,
      duration: row.duration,
      durationLimit: row.durationLimit,
      overDuration: row.overDuration === 1,
      type: MediaType.Episode,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Map database rows to Show object
   */
  private mapRowToShow(showRow: any, episodeRows: any[]): Show {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN show_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
      ORDER BY t.name
    `);

    const tagRows = tagsStmt.all(showRow.mediaItemId) as any[];
    const tags = tagRows.map((tagRow) => ({
      tagId: tagRow.tagId,
      name: tagRow.name,
      type: tagRow.type,
      seasonStartDate: tagRow.seasonStartDate,
      seasonEndDate: tagRow.seasonEndDate,
      sequence: tagRow.sequence,
    }));

    const secondaryTagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN show_secondary_tags sst ON t.tagId = sst.tagId
      WHERE sst.mediaItemId = ?
      ORDER BY t.name
    `);

    const secondaryTagRows = secondaryTagsStmt.all(
      showRow.mediaItemId,
    ) as any[];
    const secondaryTags = secondaryTagRows.map((tagRow) => ({
      tagId: tagRow.tagId,
      name: tagRow.name,
      type: tagRow.type,
      seasonStartDate: tagRow.seasonStartDate,
      seasonEndDate: tagRow.seasonEndDate,
      sequence: tagRow.sequence,
    }));

    const episodes = episodeRows.map((row) => this.mapRowToEpisode(row));

    return {
      mediaItemId: showRow.mediaItemId,
      title: showRow.title,
      alias: showRow.alias,
      imdb: showRow.imdb,
      durationLimit: showRow.durationLimit,
      firstEpisodeOverDuration: showRow.firstEpisodeOverDuration === 1,
      episodeCount: showRow.episodeCount,
      type: MediaType.Show,
      tags,
      secondaryTags,
      episodes,
      createdAt: showRow.createdAt,
      updatedAt: showRow.updatedAt,
    };
  }

  /**
   * Find shows that have episodes tagged with any of the given tag IDs
   */
  findByEpisodeTags(tagIds: string[]): Show[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => "?").join(",");
    const showStmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      WHERE s.id IN (
        SELECT DISTINCT e.showId FROM episodes e
        WHERE e.mediaItemId IN (
          SELECT mediaItemId FROM episode_tags 
          WHERE tagId IN (${placeholders})
        )
      )
      ORDER BY s.title
    `);

    const showRows = showStmt.all(...tagIds) as any[];

    return showRows.map((showRow) => {
      const episodeStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ?
      `);
      const episodeRows = episodeStmt.all(showRow.id) as any[];
      return this.mapRowToShow(showRow, episodeRows);
    });
  }

  /**
   * Find shows by tags and duration that match temporal progression tracking
   * Used when we already have shows in the temp episode progression dictionary
   * Filters shows to only those in the provided list and checks if their next episode fits duration
   *
   * For shows with overDuration episodes, queries the episode table to verify the next episode fits
   * For shows without overDuration, just checks durationLimit <= availableDuration
   *
   * @param showIds Array of show media item IDs to check
   * @param tempProgressions Map of show progressions during stream construction (key: showId-streamType)
   * @param streamType The stream type being constructed
   * @param availableDuration The available duration in seconds
   * @returns Array of shows where the next episode will fit in the available duration
   */
  findByIdsWithProgressionCheck(
    showIds: string[],
    tempProgressions: Map<string, number>,
    streamType: string,
    availableDuration: number,
  ): Show[] {
    if (showIds.length === 0) return [];

    // Get all shows first
    const placeholders = showIds.map(() => "?").join(",");
    const showStmt = this.db.prepare(`
      SELECT * FROM shows WHERE mediaItemId IN (${placeholders})
    `);

    const showRows = showStmt.all(...showIds) as any[];

    const validShows: Show[] = [];

    for (const showRow of showRows) {
      const episodeStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ?
      `);
      const episodeRows = episodeStmt.all(showRow.id) as any[];
      const show = this.mapRowToShow(showRow, episodeRows);

      // Get next episode number from temp progression
      const progressionKey = `${show.mediaItemId}-${streamType}`;
      const nextEpisodeNumber = tempProgressions.get(progressionKey) || 1;

      // Check if show has overDuration episodes
      if (showRow.firstEpisodeOverDuration === 1) {
        // For overDuration shows, check if next episode fits
        const nextEpisode = show.episodes?.[nextEpisodeNumber - 1];
        if (
          nextEpisode &&
          nextEpisode.duration &&
          nextEpisode.duration <= availableDuration
        ) {
          validShows.push(show);
        }
      } else {
        // For normal shows, check if durationLimit fits
        if (show.durationLimit && show.durationLimit <= availableDuration) {
          validShows.push(show);
        }
      }
    }

    return validShows;
  }

  /**
   * Find shows by tags and duration with progression table lookup
   * Used for shows not yet in the temp episode progression dictionary
   * Joins with episode_progressions table or evaluates episodes directly
   *
   * For shows with overDuration episodes, must verify the next episode in progression fits duration
   * For shows without overDuration, just checks durationLimit <= availableDuration
   *
   * @param tagIds Array of tag IDs to match against show tags
   * @param streamType The stream type being constructed (for progression lookup)
   * @param availableDuration The available duration in seconds
   * @returns Array of shows where the next episode will fit in the available duration
   */
  findByTagsAndDurationWithProgressionCheck(
    tagIds: string[],
    streamType: string,
    availableDuration: number,
  ): Show[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => "?").join(",");

    // Query shows with tags that either:
    // 1. Have no overDuration episodes and durationLimit fits
    // 2. Have overDuration episodes but next episode in progression fits
    const showStmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId IN (${placeholders})
      AND (
        -- Case 1: No overDuration episodes, check durationLimit
        (s.firstEpisodeOverDuration = 0 AND s.durationLimit <= ?)
        OR
        -- Case 2: Has overDuration episodes, need progression check below
        (s.firstEpisodeOverDuration = 1)
      )
      ORDER BY s.title
    `);

    const showRows = showStmt.all(...tagIds, availableDuration) as any[];

    const validShows: Show[] = [];

    for (const showRow of showRows) {
      // If no overDuration, already validated by query above
      if (showRow.firstEpisodeOverDuration === 0) {
        const episodeStmt = this.db.prepare(`
          SELECT * FROM episodes WHERE showId = ?
        `);
        const episodeRows = episodeStmt.all(showRow.id) as any[];
        validShows.push(this.mapRowToShow(showRow, episodeRows));
        continue;
      }

      // For overDuration shows, check next episode from progression
      const progressionStmt = this.db.prepare(`
        SELECT currentEpisodeNumber FROM episode_progressions 
        WHERE showItemId = ? AND streamType = ?
      `);
      const progression = progressionStmt.get(
        showRow.mediaItemId,
        streamType,
      ) as any;
      const nextEpisodeNumber = progression?.currentEpisodeNumber || 1;

      // Get the next episode and check duration
      const episodeStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? AND episodeNumber = ?
      `);
      const nextEpisodeRow = episodeStmt.get(
        showRow.id,
        nextEpisodeNumber,
      ) as any;

      if (
        nextEpisodeRow &&
        nextEpisodeRow.duration &&
        nextEpisodeRow.duration <= availableDuration
      ) {
        const allEpisodeStmt = this.db.prepare(`
          SELECT * FROM episodes WHERE showId = ?
        `);
        const episodeRows = allEpisodeStmt.all(showRow.id) as any[];
        validShows.push(this.mapRowToShow(showRow, episodeRows));
      }
    }

    return validShows;
  }
}

// Singleton instance
export const showRepository = new ShowRepository();
