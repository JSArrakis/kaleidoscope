"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movieRepository = exports.MovieRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const movie_1 = require("../models/movie.cjs");
const tag_1 = require("../models/tag.cjs");
const mediaTypes_1 = require("../models/enum/mediaTypes.cjs");
const tagsRepository_1 = require("./tagsRepository.cjs");
class MovieRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new movie
    create(movie) {
        const transaction = this.db.transaction(() => {
            // Insert movie without tags or collections
            const movieStmt = this.db.prepare(`
        INSERT INTO movies (title, mediaItemId, alias, imdb, path, duration, durationLimit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            const result = movieStmt.run(movie.title, movie.mediaItemId, movie.alias, movie.imdb, movie.path, movie.duration, movie.durationLimit);
            // Insert tags
            this.insertMediaTags(movie.mediaItemId, movie.tags);
        });
        transaction();
        return this.findByMediaItemId(movie.mediaItemId);
    }
    // Find movie by mediaItemId
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT * FROM movies WHERE mediaItemId = ?
    `);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToMovie(row);
    }
    // Find all movies
    findAll() {
        const stmt = this.db.prepare(`
      SELECT * FROM movies ORDER BY title
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToMovie(row));
    }
    // Update movie
    update(mediaItemId, movie) {
        const transaction = this.db.transaction(() => {
            // Update movie
            const movieStmt = this.db.prepare(`
        UPDATE movies 
        SET title = ?, alias = ?, imdb = ?, path = ?, duration = ?, durationLimit = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = movieStmt.run(movie.title, movie.alias, movie.imdb, movie.path, movie.duration, movie.durationLimit, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete existing tags
            this.db
                .prepare('DELETE FROM media_tags WHERE mediaItemId = ?')
                .run(mediaItemId);
            // Insert new tags
            this.insertMediaTags(mediaItemId, movie.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    // Delete movie
    delete(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM movies WHERE mediaItemId = ?
    `);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    // Find movies by tags (accept Tag[] or string[] - resolves to tagIds)
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
      SELECT DISTINCT m.* FROM movies m
      INNER JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId IN (${placeholders})
      ORDER BY m.title
    `);
        const rows = stmt.all(...tagIds);
        return rows.map(row => this.mapRowToMovie(row));
    }
    // Find movies by tag type
    findByTagType(tagType) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      INNER JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagType = ?
      ORDER BY m.title
    `);
        const rows = stmt.all(tagType);
        return rows.map(row => this.mapRowToMovie(row));
    }
    // Count all movies
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM movies`);
        const result = stmt.get();
        return result.count;
    }
    // Find a random movie from the database
    findRandomMovie() {
        const stmt = this.db.prepare(`
      SELECT * FROM movies ORDER BY RANDOM() LIMIT 1
    `);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToMovie(row);
    }
    // Helper method to insert media tags
    insertMediaTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO media_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);
        for (const tag of tags) {
            try {
                let tagId;
                let tagType;
                if (typeof tag === 'string') {
                    const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(tag);
                    if (found) {
                        tagId = found.tagId;
                        tagType = found.type;
                    }
                }
                else if (tag.tagId) {
                    tagId = tag.tagId;
                    tagType = tag.type;
                }
                if (!tagId || !tagType) {
                    console.warn(`Failed to resolve tag for media item ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId, tagType);
            }
            catch (error) {
                console.warn(`Failed to insert tag for media item ${mediaItemId}:`, error);
            }
        }
    }
    // Helper method to load tags for a media item
    loadMediaTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN media_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
    `);
        const tagRows = stmt.all(mediaItemId);
        const tags = [];
        for (const tagRow of tagRows) {
            const tag = new tag_1.Tag(tagRow.tagId, tagRow.name, tagRow.type, tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined, tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined, tagRow.seasonStartDate, tagRow.seasonEndDate, tagRow.sequence);
            tags.push(tag);
        }
        return tags;
    }
    // Helper method to load collections for a movie
    loadMovieCollections(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT c.mediaItemId, c.title, ci.sequence
      FROM collections c
      INNER JOIN collection_items ci ON c.mediaItemId = ci.collectionId
      WHERE ci.mediaItemId = ?
      ORDER BY ci.sequence
    `);
        const rows = stmt.all(mediaItemId);
        return rows.map(row => new movie_1.CollectionReference(row.mediaItemId, row.title, row.sequence));
    }
    mapRowToMovie(row) {
        const tags = this.loadMediaTags(row.mediaItemId);
        const collections = this.loadMovieCollections(row.mediaItemId);
        return new movie_1.Movie(row.title, row.mediaItemId, row.alias, row.imdb, tags, row.path, row.duration, row.durationLimit, mediaTypes_1.MediaType.Movie, collections);
    }
}
exports.MovieRepository = MovieRepository;
// Export singleton instance
exports.movieRepository = new MovieRepository();
