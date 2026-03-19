import { getDB } from "../db/sqlite.js";
export class MovieRepository {
    get db() {
        return getDB();
    }
    /**
     * Create a new movie
     */
    create(movie) {
        const transaction = this.db.transaction(() => {
            const movieStmt = this.db.prepare(`
        INSERT INTO movies (title, mediaItemId, alias, imdb, path, duration, durationLimit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
            movieStmt.run(movie.title, movie.mediaItemId, movie.alias || null, movie.imdb || null, movie.path, movie.duration || null, movie.durationLimit || null);
            // Insert tags
            this.insertMovieTags(movie.mediaItemId, movie.tags);
        });
        transaction();
        return this.findByMediaItemId(movie.mediaItemId);
    }
    /**
     * Find movie by mediaItemId
     */
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM movies WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToMovie(row);
    }
    /**
     * Find all movies
     */
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM movies ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMovie(row));
    }
    /**
     * Find a random movie
     */
    findRandomMovie() {
        const stmt = this.db.prepare(`SELECT * FROM movies ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToMovie(row);
    }
    findRandomMovieUnderDuration(maxDuration, ageGroups) {
        const ageGroupIds = ageGroups.map((ageGroup) => ageGroup.tagId);
        let query = `
      SELECT * 
      FROM movies 
      WHERE duration <= :maxDuration 
      AND mediaItemId NOT IN (SELECT mediaItemId FROM recently_used_movies)
    `;
        const params = { maxDuration };
        if (ageGroupIds.length > 0) {
            // Build dynamic named parameters for age group IDs
            const ageGroupPlaceholders = ageGroupIds
                .map((_, index) => `:ageGroupId_${index}`)
                .join(",");
            query += `
        AND mediaItemId IN (
          SELECT mediaItemId FROM movie_tags 
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
        query += ` ORDER BY RANDOM() LIMIT 1`;
        const stmt = this.db.prepare(query);
        const row = stmt.get(params);
        if (!row)
            return null;
        return this.mapRowToMovie(row);
    }
    /**
     * Find movies by tag
     */
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      JOIN movie_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ?
      ORDER BY m.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToMovie(row));
    }
    /**
     * Find movies by tag under duration
     */
    findByTagAndUnderDuration(tagId, maxDuration) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      JOIN movie_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ? AND m.duration <= ?
      ORDER BY m.title
    `);
        const rows = stmt.all(tagId, maxDuration);
        return rows.map((row) => this.mapRowToMovie(row));
    }
    /**
     * Find movies by multiple tags (AND condition)
     */
    findByTags(tagIds) {
        if (tagIds.length === 0)
            return [];
        const placeholders = tagIds.map(() => "?").join(",");
        const stmt = this.db.prepare(`
      SELECT m.* FROM movies m
      WHERE m.mediaItemId IN (
        SELECT mediaItemId FROM movie_tags 
        WHERE tagId IN (${placeholders})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
      ORDER BY m.title
    `);
        const rows = stmt.all(...tagIds, tagIds.length);
        return rows.map((row) => this.mapRowToMovie(row));
    }
    findByTagsUnderDuration(tags, maxDuration) {
        if (tags.length === 0)
            return [];
        const tagIds = tags.map((tag) => tag.tagId);
        const placeholders = tagIds.map(() => "?").join(",");
        const stmt = this.db.prepare(`
      SELECT m.* FROM movies m
      WHERE m.duration <= ?
      AND m.mediaItemId IN (
        SELECT mediaItemId FROM movie_tags 
        WHERE tagId IN (${placeholders})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
      AND mediaItemId NOT IN (SELECT mediaItemId FROM recently_used_movies)
      ORDER BY m.title
    `);
        const rows = stmt.all(maxDuration, ...tagIds, tagIds.length);
        return rows.map((row) => this.mapRowToMovie(row));
    }
    findByTagsAndAgeGroupsUnderDuration(tags, ageGroups, maxDuration) {
        if (tags.length === 0) {
            return [];
        }
        const tagIds = tags.map((tag) => tag.tagId);
        const ageGroupIds = ageGroups.map((ageGroup) => ageGroup.tagId);
        // Build query conditionally based on whether ageGroups are provided
        let query = `
      SELECT m.* FROM movies m
      WHERE m.duration <= ?
      AND m.mediaItemId IN (
        SELECT mediaItemId FROM movie_tags 
        WHERE tagId IN (${tagIds.map(() => "?").join(",")})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
    `;
        const params = [maxDuration, ...tagIds, tagIds.length];
        if (ageGroupIds.length > 0) {
            query += `
        AND m.mediaItemId IN (
          SELECT mediaItemId FROM movie_tags 
          WHERE tagId IN (${ageGroupIds.map(() => "?").join(",")})
          GROUP BY mediaItemId 
          HAVING COUNT(DISTINCT tagId) = ?
        )
      `;
            params.push(...ageGroupIds, ageGroupIds.length);
        }
        query += `
      AND mediaItemId NOT IN (SELECT mediaItemId FROM recently_used_movies)
      ORDER BY m.title
    `;
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map((row) => this.mapRowToMovie(row));
    }
    /**
     * Get total minutes of movies tagged with a specific holiday tag
     * Duration in database is stored in seconds, converts to minutes
     * @param holidayTagId The holiday tag ID
     * @returns Total minutes of all movies with this holiday tag
     */
    getTotalMinutesByHolidayTag(holidayTagId) {
        const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(m.duration), 0) as totalSeconds
      FROM movies m
      INNER JOIN movie_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ?
    `);
        const result = stmt.get(holidayTagId);
        const totalSeconds = result.totalSeconds || 0;
        return Math.floor(totalSeconds / 60); // Convert seconds to minutes
    }
    /**
     * Update movie
     */
    update(mediaItemId, movie) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE movies 
        SET title = ?, alias = ?, imdb = ?, path = ?, duration = ?, durationLimit = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(movie.title, movie.alias || null, movie.imdb || null, movie.path, movie.duration || null, movie.durationLimit || null, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete and re-insert tags
            this.db
                .prepare("DELETE FROM movie_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertMovieTags(mediaItemId, movie.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    /**
     * Delete movie
     */
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM movies WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    /**
     * Count total movies
     */
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM movies`);
        const result = stmt.get();
        return result.count;
    }
    /**
     * Insert tags for a movie
     */
    insertMovieTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO movie_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId, tag.type);
        }
    }
    /**
     * Map database row to Movie object
     */
    mapRowToMovie(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN movie_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
        const tags = tagRows.map((tagRow) => {
            // Fetch holiday dates for this tag if it has any
            const holidayDatesStmt = this.db.prepare(`
        SELECT holidayDate FROM holiday_dates WHERE tagId = ?
      `);
            const holidayDateRows = holidayDatesStmt.all(tagRow.tagId);
            const holidayDates = holidayDateRows.map((hd) => hd.holidayDate);
            return {
                tagId: tagRow.tagId,
                name: tagRow.name,
                type: tagRow.type,
                seasonStartDate: tagRow.seasonStartDate,
                seasonEndDate: tagRow.seasonEndDate,
                sequence: tagRow.sequence,
                holidayDates: holidayDates.length > 0 ? holidayDates : [],
            };
        });
        return {
            mediaItemId: row.mediaItemId,
            title: row.title,
            alias: row.alias,
            imdb: row.imdb,
            path: row.path,
            duration: row.duration,
            durationLimit: row.durationLimit,
            isHolidayExclusive: !!row.isHolidayExclusive,
            type: MediaType.Movie,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
// Singleton instance
export const movieRepository = new MovieRepository();
