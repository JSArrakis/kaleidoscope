import { getDB } from '../db/sqlite';
import { Show, Episode } from '../models/show';
import { Tag } from '../models/tag';
import { MediaTag } from '../models/const/tagTypes';

export class ShowRepository {
  private get db() {
    return getDB();
  }

  // Create a new show with episodes
  create(show: Show): Show {
    const transaction = this.db.transaction(() => {
      // Insert show
      const showStmt = this.db.prepare(`
        INSERT INTO shows (title, mediaItemId, alias, imdb, durationLimit, overDuration, firstEpisodeOverDuration, episodeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const showResult = showStmt.run(
        show.title,
        show.mediaItemId,
        show.alias,
        show.imdb,
        show.durationLimit,
        show.overDuration ? 1 : 0,
        show.firstEpisodeOverDuration ? 1 : 0,
        show.episodeCount,
      );

      const showId = showResult.lastInsertRowid as number;
      const showItemId = show.mediaItemId;

      // Insert show tags
      this.insertShowTags(show.mediaItemId, show.tags, 'primary');
      this.insertShowTags(show.mediaItemId, show.secondaryTags, 'secondary');

      // Insert episodes
      if (show.episodes && show.episodes.length > 0) {
        const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const episode of show.episodes) {
          const episodeResult = episodeStmt.run(
            showId,
            episode.season,
            episode.episode,
            episode.episodeNumber,
            episode.path,
            episode.title,
            episode.mediaItemId,
            showItemId,
            episode.duration,
            episode.durationLimit,
          );

          // Insert episode tags
          this.insertEpisodeTags(episode.mediaItemId, episode.tags);
        }
      }

      return showId;
    });

    const showId = transaction();
    return this.findByMediaItemId(show.mediaItemId)!;
  }

  // Find show by mediaItemId
  findByMediaItemId(mediaItemId: string): Show | null {
    const showStmt = this.db.prepare(`
      SELECT * FROM shows WHERE mediaItemId = ?
    `);

    const showRow = showStmt.get(mediaItemId) as any;
    if (!showRow) return null;

    const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);

    const episodeRows = episodesStmt.all(showRow.id) as any[];

    return this.mapRowToShow(showRow, episodeRows);
  }

  // Find all shows
  findAll(): Show[] {
    const showsStmt = this.db.prepare(`
      SELECT * FROM shows ORDER BY title
    `);

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

  // Update show
  update(mediaItemId: string, show: Show): Show | null {
    const transaction = this.db.transaction(() => {
      // Update show
      const showStmt = this.db.prepare(`
        UPDATE shows 
        SET title = ?, alias = ?, imdb = ?, durationLimit = ?, overDuration = ?, firstEpisodeOverDuration = ?, episodeCount = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const showResult = showStmt.run(
        show.title,
        show.alias,
        show.imdb,
        show.durationLimit,
        show.overDuration ? 1 : 0,
        show.firstEpisodeOverDuration ? 1 : 0,
        show.episodeCount,
        mediaItemId,
      );

      if (showResult.changes === 0) return false;

      // Get show ID
      const showIdStmt = this.db.prepare(
        `SELECT id FROM shows WHERE mediaItemId = ?`,
      );
      const showIdRow = showIdStmt.get(mediaItemId) as any;
      const showId = showIdRow.id;

      // Delete existing show tags
      this.db.prepare('DELETE FROM show_tags WHERE mediaItemId = ?').run(mediaItemId);

      // Insert new show tags
      this.insertShowTags(mediaItemId, show.tags, 'primary');
      this.insertShowTags(mediaItemId, show.secondaryTags, 'secondary');

      // Delete existing episodes and their tags
      const deleteEpisodeTagsStmt = this.db.prepare(`
        DELETE FROM episode_tags WHERE mediaItemId IN (
          SELECT mediaItemId FROM episodes WHERE showId = ?
        )
      `);
      deleteEpisodeTagsStmt.run(showId);

      const deleteEpisodesStmt = this.db.prepare(
        `DELETE FROM episodes WHERE showId = ?`,
      );
      deleteEpisodesStmt.run(showId);

      const showItemId = show.mediaItemId;

      // Insert new episodes
      if (show.episodes && show.episodes.length > 0) {
        const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            showItemId,
            episode.duration,
            episode.durationLimit,
          );

          // Insert episode tags
          this.insertEpisodeTags(episode.mediaItemId, episode.tags);
        }
      }

      return true;
    });

    const success = transaction();
    return success ? this.findByMediaItemId(mediaItemId) : null;
  }

  // Delete show
  delete(mediaItemId: string): boolean {
    const transaction = this.db.transaction(() => {
      // Get show ID first
      const showIdStmt = this.db.prepare(
        `SELECT id FROM shows WHERE mediaItemId = ?`,
      );
      const showIdRow = showIdStmt.get(mediaItemId) as any;

      if (!showIdRow) return false;

      // Delete episode tags first (before episodes are deleted)
      const deleteEpisodeTagsStmt = this.db.prepare(`
        DELETE FROM episode_tags WHERE mediaItemId IN (
          SELECT mediaItemId FROM episodes WHERE showId = ?
        )
      `);
      deleteEpisodeTagsStmt.run(showIdRow.id);

      // Delete show tags
      const deleteShowTagsStmt = this.db.prepare(
        `DELETE FROM show_tags WHERE mediaItemId = ?`,
      );
      deleteShowTagsStmt.run(mediaItemId);

      // Delete episodes (foreign key constraint will handle this automatically, but being explicit)
      const deleteEpisodesStmt = this.db.prepare(
        `DELETE FROM episodes WHERE showId = ?`,
      );
      deleteEpisodesStmt.run(showIdRow.id);

      // Delete show
      const deleteShowStmt = this.db.prepare(
        `DELETE FROM shows WHERE mediaItemId = ?`,
      );
      const result = deleteShowStmt.run(mediaItemId);

      return result.changes > 0;
    });

    return transaction();
  }

  // Find shows by tags (searches both primary and secondary tags)
  findByTags(tagIds: string[]): Show[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      INNER JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId IN (${placeholders})
      ORDER BY s.title
    `);

    const showRows = stmt.all(...tagIds) as any[];

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

  // Find shows that have episodes with specific tags (secondary tag search)
  findByEpisodeTags(tagIds: string[]): Show[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      INNER JOIN episodes e ON s.id = e.showId
      INNER JOIN episode_tags et ON e.mediaItemId = et.mediaItemId
      WHERE et.tagId IN (${placeholders})
      ORDER BY s.title
    `);

    const showRows = stmt.all(...tagIds) as any[];

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

  // Count all shows
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shows`);
    const result = stmt.get() as any;
    return result.count;
  }

  // Helper method to insert show tags
  private insertShowTags(mediaItemId: string, tags: MediaTag[], tagType: 'primary' | 'secondary'): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO show_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);

    for (const tag of tags) {
      try {
        stmt.run(mediaItemId, tag.tagId, tagType);
      } catch (error) {
        console.warn(
          `Failed to insert show tag ${tag.tagId} for media item ${mediaItemId}:`,
          error,
        );
      }
    }
  }

  // Helper method to insert episode tags
  private insertEpisodeTags(mediaItemId: string, tags: MediaTag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO episode_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tag of tags) {
      try {
        stmt.run(mediaItemId, tag.tagId);
      } catch (error) {
        console.warn(
          `Failed to insert episode tag ${tag.tagId} for media item ${mediaItemId}:`,
          error,
        );
      }
    }
  }

  // Helper method to load show tags
  private loadShowTags(mediaItemId: string, tagType: 'primary' | 'secondary'): MediaTag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN show_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ? AND st.tagType = ?
    `);

    const tagRows = stmt.all(mediaItemId, tagType) as any[];
    const tags: MediaTag[] = [];

    for (const tagRow of tagRows) {
      const tag = new Tag(
        tagRow.tagId,
        tagRow.name,
        tagRow.type,
        tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined,
        tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined,
        tagRow.seasonStartDate,
        tagRow.seasonEndDate,
        tagRow.sequence,
      );
      tags.push(tag);
    }

    return tags;
  }

  // Helper method to load episode tags
  private loadEpisodeTags(mediaItemId: string): MediaTag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN episode_tags et ON t.tagId = et.tagId
      WHERE et.mediaItemId = ?
    `);

    const tagRows = stmt.all(mediaItemId) as any[];
    const tags: MediaTag[] = [];

    for (const tagRow of tagRows) {
      const tag = new Tag(
        tagRow.tagId,
        tagRow.name,
        tagRow.type,
        tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined,
        tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined,
        tagRow.seasonStartDate,
        tagRow.seasonEndDate,
        tagRow.sequence,
      );
      tags.push(tag);
    }

    return tags;
  }

  private mapRowToShow(showRow: any, episodeRows: any[]): Show {
    const primaryTags = this.loadShowTags(showRow.mediaItemId, 'primary');
    const secondaryTags = this.loadShowTags(showRow.mediaItemId, 'secondary');

    const episodes = episodeRows.map(
      episodeRow => {
        const episodeTags = this.loadEpisodeTags(episodeRow.mediaItemId);
        return new Episode(
          episodeRow.season,
          episodeRow.episode,
          episodeRow.episodeNumber,
          episodeRow.path,
          episodeRow.title,
          episodeRow.mediaItemId,
          episodeRow.showItemId,
          episodeRow.duration,
          episodeRow.durationLimit,
          episodeTags,
        );
      }
    );

    return new Show(
      showRow.title,
      showRow.mediaItemId,
      showRow.alias,
      showRow.imdb,
      showRow.durationLimit,
      Boolean(showRow.overDuration),
      Boolean(showRow.firstEpisodeOverDuration),
      primaryTags,
      secondaryTags,
      showRow.episodeCount,
      episodes,
    );
  }
}

// Export singleton instance
export const showRepository = new ShowRepository();
