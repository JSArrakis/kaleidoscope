"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showRepository = exports.ShowRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const show_1 = require("../models/show");
const tag_1 = require("../models/tag");
const mediaTypes_1 = require("../models/enum/mediaTypes");
const tagsRepository_1 = require("./tagsRepository");
class ShowRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new show with episodes
    create(show) {
        const transaction = this.db.transaction(() => {
            // Insert show
            const showStmt = this.db.prepare(`
        INSERT INTO shows (title, mediaItemId, alias, imdb, durationLimit, firstEpisodeOverDuration, episodeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            const showResult = showStmt.run(show.title, show.mediaItemId, show.alias, show.imdb, show.durationLimit, show.firstEpisodeOverDuration ? 1 : 0, show.episodeCount);
            const showId = showResult.lastInsertRowid;
            const showItemId = show.mediaItemId;
            // Insert show tags
            this.insertShowTags(show.mediaItemId, show.tags, 'primary');
            this.insertShowTags(show.mediaItemId, show.secondaryTags, 'secondary');
            // Insert episodes
            if (show.episodes && show.episodes.length > 0) {
                const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                for (const episode of show.episodes) {
                    const episodeResult = episodeStmt.run(showId, episode.season, episode.episode, episode.episodeNumber, episode.path, episode.title, episode.mediaItemId, showItemId, episode.duration, episode.durationLimit, episode.overDuration ? 1 : 0, episode.type);
                    // Insert episode tags
                    this.insertEpisodeTags(episode.mediaItemId, episode.tags);
                }
            }
            return showId;
        });
        const showId = transaction();
        return this.findByMediaItemId(show.mediaItemId);
    }
    // Find show by mediaItemId
    findByMediaItemId(mediaItemId) {
        const showStmt = this.db.prepare(`
      SELECT * FROM shows WHERE mediaItemId = ?
    `);
        const showRow = showStmt.get(mediaItemId);
        if (!showRow)
            return null;
        const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);
        const episodeRows = episodesStmt.all(showRow.id);
        return this.mapRowToShow(showRow, episodeRows);
    }
    // Find all shows
    findAll() {
        const showsStmt = this.db.prepare(`
      SELECT * FROM shows ORDER BY title
    `);
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
    // Update show
    update(mediaItemId, show) {
        const transaction = this.db.transaction(() => {
            // Update show
            const showStmt = this.db.prepare(`
        UPDATE shows 
        SET title = ?, alias = ?, imdb = ?, durationLimit = ?, firstEpisodeOverDuration = ?, episodeCount = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const showResult = showStmt.run(show.title, show.alias, show.imdb, show.durationLimit, show.firstEpisodeOverDuration ? 1 : 0, show.episodeCount, mediaItemId);
            if (showResult.changes === 0)
                return false;
            // Get show ID
            const showIdStmt = this.db.prepare(`SELECT id FROM shows WHERE mediaItemId = ?`);
            const showIdRow = showIdStmt.get(mediaItemId);
            const showId = showIdRow.id;
            // Delete existing show tags
            this.db
                .prepare('DELETE FROM show_tags WHERE mediaItemId = ?')
                .run(mediaItemId);
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
            const deleteEpisodesStmt = this.db.prepare(`DELETE FROM episodes WHERE showId = ?`);
            deleteEpisodesStmt.run(showId);
            const showItemId = show.mediaItemId;
            // Insert new episodes
            if (show.episodes && show.episodes.length > 0) {
                const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                for (const episode of show.episodes) {
                    episodeStmt.run(showId, episode.season, episode.episode, episode.episodeNumber, episode.path, episode.title, episode.mediaItemId, showItemId, episode.duration, episode.durationLimit, episode.overDuration ? 1 : 0, episode.type);
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
    delete(mediaItemId) {
        const transaction = this.db.transaction(() => {
            // Get show ID first
            const showIdStmt = this.db.prepare(`SELECT id FROM shows WHERE mediaItemId = ?`);
            const showIdRow = showIdStmt.get(mediaItemId);
            if (!showIdRow)
                return false;
            // Delete episode tags first (before episodes are deleted)
            const deleteEpisodeTagsStmt = this.db.prepare(`
        DELETE FROM episode_tags WHERE mediaItemId IN (
          SELECT mediaItemId FROM episodes WHERE showId = ?
        )
      `);
            deleteEpisodeTagsStmt.run(showIdRow.id);
            // Delete show tags
            const deleteShowTagsStmt = this.db.prepare(`DELETE FROM show_tags WHERE mediaItemId = ?`);
            deleteShowTagsStmt.run(mediaItemId);
            // Delete episodes (foreign key constraint will handle this automatically, but being explicit)
            const deleteEpisodesStmt = this.db.prepare(`DELETE FROM episodes WHERE showId = ?`);
            deleteEpisodesStmt.run(showIdRow.id);
            // Delete show
            const deleteShowStmt = this.db.prepare(`DELETE FROM shows WHERE mediaItemId = ?`);
            const result = deleteShowStmt.run(mediaItemId);
            return result.changes > 0;
        });
        return transaction();
    }
    // Find shows by tags (searches both primary and secondary tags) - accepts Tag[] or string[]
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const tagIds = [];
        for (const t of tags) {
            if (typeof t === 'string') {
                const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(t);
                if (found)
                    tagIds.push(found.tagId);
            }
            else if (t.tagId) {
                tagIds.push(t.tagId);
            }
        }
        if (tagIds.length === 0)
            return [];
        const placeholders = tagIds.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      INNER JOIN show_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId IN (${placeholders})
      ORDER BY s.title
    `);
        const showRows = stmt.all(...tagIds);
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
    // Find shows that have episodes with specific tags (secondary tag search) - accepts Tag[] or string[]
    findByEpisodeTags(tags) {
        if (tags.length === 0)
            return [];
        const tagIds = [];
        for (const t of tags) {
            if (typeof t === 'string') {
                const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(t);
                if (found)
                    tagIds.push(found.tagId);
            }
            else if (t.tagId) {
                tagIds.push(t.tagId);
            }
        }
        if (tagIds.length === 0)
            return [];
        const placeholders = tagIds.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shows s
      INNER JOIN episodes e ON s.id = e.showId
      INNER JOIN episode_tags et ON e.mediaItemId = et.mediaItemId
      WHERE et.tagId IN (${placeholders})
      ORDER BY s.title
    `);
        const showRows = stmt.all(...tagIds);
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
    // Count all shows
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shows`);
        const result = stmt.get();
        return result.count;
    }
    // Find a random show from the database that has at least one episode
    findRandomShow() {
        const stmt = this.db.prepare(`
      SELECT s.* FROM shows s
      WHERE EXISTS (SELECT 1 FROM episodes e WHERE e.showItemId = s.mediaItemId)
      ORDER BY RANDOM() LIMIT 1
    `);
        const showRow = stmt.get();
        if (!showRow)
            return null;
        // Get episodes for this show
        const episodeStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showItemId = ? ORDER BY episodeNumber ASC
    `);
        const episodeRows = episodeStmt.all(showRow.mediaItemId);
        return this.mapRowToShow(showRow, episodeRows);
    }
    // Helper method to insert show tags
    insertShowTags(mediaItemId, tags, tagType) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO show_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);
        for (const tag of tags) {
            try {
                let tagId;
                if (typeof tag === 'string') {
                    const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(tag);
                    tagId = found ? found.tagId : undefined;
                }
                else if (tag.tagId) {
                    tagId = tag.tagId;
                }
                if (!tagId) {
                    console.warn(`Failed to resolve show tag for media item ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId, tagType);
            }
            catch (error) {
                console.warn(`Failed to insert show tag for media item ${mediaItemId}:`, error);
            }
        }
    }
    // Helper method to insert episode tags
    insertEpisodeTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO episode_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);
        for (const tag of tags) {
            try {
                let tagId;
                if (typeof tag === 'string') {
                    const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(tag);
                    tagId = found ? found.tagId : undefined;
                }
                else if (tag.tagId) {
                    tagId = tag.tagId;
                }
                if (!tagId) {
                    console.warn(`Failed to resolve episode tag for media item ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId);
            }
            catch (error) {
                console.warn(`Failed to insert episode tag for media item ${mediaItemId}:`, error);
            }
        }
    }
    // Helper method to load show tags
    loadShowTags(mediaItemId, tagType) {
        const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN show_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ? AND st.tagType = ?
    `);
        const tagRows = stmt.all(mediaItemId, tagType);
        const tags = [];
        for (const tagRow of tagRows) {
            const tag = new tag_1.Tag(tagRow.tagId, tagRow.name, tagRow.type, tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined, tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined, tagRow.seasonStartDate, tagRow.seasonEndDate, tagRow.sequence);
            tags.push(tag);
        }
        return tags;
    }
    // Helper method to load episode tags
    loadEpisodeTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN episode_tags et ON t.tagId = et.tagId
      WHERE et.mediaItemId = ?
    `);
        const tagRows = stmt.all(mediaItemId);
        const tags = [];
        for (const tagRow of tagRows) {
            const tag = new tag_1.Tag(tagRow.tagId, tagRow.name, tagRow.type, tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined, tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined, tagRow.seasonStartDate, tagRow.seasonEndDate, tagRow.sequence);
            tags.push(tag);
        }
        return tags;
    }
    mapRowToShow(showRow, episodeRows) {
        const primaryTags = this.loadShowTags(showRow.mediaItemId, 'primary');
        const secondaryTags = this.loadShowTags(showRow.mediaItemId, 'secondary');
        const episodes = episodeRows.map(episodeRow => {
            const episodeTags = this.loadEpisodeTags(episodeRow.mediaItemId);
            return new show_1.Episode(episodeRow.season, episodeRow.episode, episodeRow.episodeNumber, episodeRow.path, episodeRow.title, episodeRow.mediaItemId, episodeRow.showItemId, episodeRow.duration, episodeRow.durationLimit, Boolean(episodeRow.overDuration), mediaTypes_1.MediaType.Episode, episodeTags);
        });
        return new show_1.Show(showRow.title, showRow.mediaItemId, showRow.alias, showRow.imdb, showRow.durationLimit, Boolean(showRow.firstEpisodeOverDuration), primaryTags, secondaryTags, mediaTypes_1.MediaType.Show, showRow.episodeCount, episodes);
    }
}
exports.ShowRepository = ShowRepository;
// Export singleton instance
exports.showRepository = new ShowRepository();
