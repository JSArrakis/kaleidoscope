import { getDB } from "../db/sqlite.js";
export class ShowRepository {
    get db() {
        return getDB();
    }
    /**
     * Create a new show with episodes
     */
    create(show) {
        const transaction = this.db.transaction(() => {
            const showStmt = this.db.prepare(`
        INSERT INTO shows (title, mediaItemId, alias, imdb, durationLimit, firstEpisodeOverDuration, episodeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            const showResult = showStmt.run(show.title, show.mediaItemId, show.alias || null, show.imdb || null, show.durationLimit || null, show.firstEpisodeOverDuration ? 1 : 0, show.episodeCount);
            const showId = showResult.lastInsertRowid;
            // Insert show tags
            this.insertShowTags(show.mediaItemId, show.tags);
            // Insert episodes
            if (show.episodes && show.episodes.length > 0) {
                const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                for (const episode of show.episodes) {
                    episodeStmt.run(showId, episode.season, episode.episode, episode.episodeNumber, episode.path, episode.title, episode.mediaItemId, episode.showItemId, episode.duration || null, episode.durationLimit || null, episode.overDuration ? 1 : 0, 7 // MediaType.Episode
                    );
                    this.insertEpisodeTags(episode.mediaItemId, episode.tags);
                }
            }
        });
        transaction();
        return this.findByMediaItemId(show.mediaItemId);
    }
    /**
     * Find show by mediaItemId
     */
    findByMediaItemId(mediaItemId) {
        const showStmt = this.db.prepare(`SELECT * FROM shows WHERE mediaItemId = ?`);
        const showRow = showStmt.get(mediaItemId);
        if (!showRow)
            return null;
        const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
        const episodeRows = episodesStmt.all(showRow.id);
        return this.mapRowToShow(showRow, episodeRows);
    }
    /**
     * Find all shows
     */
    findAll() {
        const showsStmt = this.db.prepare(`SELECT * FROM shows ORDER BY title`);
        const showRows = showsStmt.all();
        const shows = [];
        for (const showRow of showRows) {
            const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
            const episodeRows = episodesStmt.all(showRow.id);
            shows.push(this.mapRowToShow(showRow, episodeRows));
        }
        return shows;
    }
    /**
     * Find a random show
     */
    findRandomShow() {
        const stmt = this.db.prepare(`SELECT * FROM shows ORDER BY RANDOM() LIMIT 1`);
        const showRow = stmt.get();
        if (!showRow)
            return null;
        const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
        const episodeRows = episodesStmt.all(showRow.id);
        return this.mapRowToShow(showRow, episodeRows);
    }
    /**
     * Find shows by tag
     */
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
        const showRows = stmt.all(tagId);
        const shows = [];
        for (const showRow of showRows) {
            const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);
            const episodeRows = episodesStmt.all(showRow.id);
            shows.push(this.mapRowToShow(showRow, episodeRows));
        }
        return shows;
    }
    /**
     * Update show
     */
    update(mediaItemId, show) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE shows 
        SET title = ?, alias = ?, imdb = ?, durationLimit = ?, firstEpisodeOverDuration = ?, 
            episodeCount = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(show.title, show.alias || null, show.imdb || null, show.durationLimit || null, show.firstEpisodeOverDuration ? 1 : 0, show.episodeCount, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete and re-insert tags
            this.db
                .prepare("DELETE FROM show_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertShowTags(mediaItemId, show.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    /**
     * Delete show
     */
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM shows WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    /**
     * Count total shows
     */
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shows`);
        const result = stmt.get();
        return result.count;
    }
    /**
     * Get episode by mediaItemId
     */
    getEpisode(episodeMediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM episodes WHERE mediaItemId = ?`);
        const row = stmt.get(episodeMediaItemId);
        if (!row)
            return null;
        return this.mapRowToEpisode(row);
    }
    /**
     * Insert tags for a show
     */
    insertShowTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO show_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId, tag.type);
        }
    }
    /**
     * Insert tags for an episode
     */
    insertEpisodeTags(episodeMediaItemId, tags) {
        if (tags.length === 0)
            return;
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
    mapRowToEpisode(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN episode_tags et ON t.tagId = et.tagId
      WHERE et.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
        const tags = tagRows.map((tagRow) => ({
            tagId: tagRow.tagId,
            name: tagRow.name,
            type: tagRow.type,
            seasonStartDate: tagRow.seasonStartDate,
            seasonEndDate: tagRow.seasonEndDate,
            explicitlyHoliday: tagRow.explicitlyHoliday === 1,
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
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    /**
     * Map database rows to Show object
     */
    mapRowToShow(showRow, episodeRows) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN show_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(showRow.mediaItemId);
        const tags = tagRows.map((tagRow) => ({
            tagId: tagRow.tagId,
            name: tagRow.name,
            type: tagRow.type,
            seasonStartDate: tagRow.seasonStartDate,
            seasonEndDate: tagRow.seasonEndDate,
            explicitlyHoliday: tagRow.explicitlyHoliday === 1,
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
            tags,
            episodes,
            createdAt: showRow.createdAt,
            updatedAt: showRow.updatedAt,
        };
    }
}
// Singleton instance
export const showRepository = new ShowRepository();
