import { getDB } from "../db/sqlite.js";
export class ShortRepository {
    get db() {
        return getDB();
    }
    create(short) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO shorts (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(short.title, short.mediaItemId, short.duration || null, short.path);
            this.insertTags(short.mediaItemId, short.tags);
        });
        transaction();
        return this.findByMediaItemId(short.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM shorts WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToShort(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToShort(row));
    }
    findRandomShort() {
        const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToShort(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToShort(row));
    }
    findHolidayShorts(ageGroupTags, holidayTags, specialtyTags, maxDuration) {
        if (holidayTags.length === 0) {
            return [];
        }
        const holidayTagIds = holidayTags.map((tag) => tag.tagId);
        const ageGroupTagIds = ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];
        const specialtyTagIds = specialtyTags.length > 0 ? specialtyTags.map((tag) => tag.tagId) : [];
        const shortMap = new Map();
        const holidayPlaceholders = holidayTagIds
            .map((_, i) => `:holiday${i}`)
            .join(",");
        // Query 1: Shorts with holiday + age group + specialty tags
        if (ageGroupTagIds.length > 0 && specialtyTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query2 = `
        SELECT DISTINCT s.* FROM shorts s
        JOIN short_tags st ON s.mediaItemId = st.mediaItemId
        WHERE s.duration IS NOT NULL
          AND s.duration <= :maxDuration
          AND st.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM short_tags st2
            WHERE st2.mediaItemId = s.mediaItemId
              AND st2.tagId IN (${ageGroupPlaceholders})
          )
          AND EXISTS (
            SELECT 1 FROM short_tags st2
            WHERE st2.mediaItemId = s.mediaItemId
              AND st2.tagId IN (${specialtyPlaceholders})
          )
        ORDER BY s.title
      `;
            const queryParams2 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
                ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
            };
            const stmt2 = this.db.prepare(query2);
            const rows2 = stmt2.all(queryParams2);
            rows2.forEach((row) => {
                const short = this.mapRowToShort(row);
                shortMap.set(short.mediaItemId, short);
            });
        }
        // Query 2: Shorts with holiday + specialty tags (no age group)
        if (specialtyTagIds.length > 0) {
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query1 = `
        SELECT DISTINCT s.* FROM shorts s
        JOIN short_tags st ON s.mediaItemId = st.mediaItemId
        WHERE s.duration IS NOT NULL
          AND s.duration <= :maxDuration
          AND st.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM short_tags st2
            WHERE st2.mediaItemId = s.mediaItemId
              AND st2.tagId IN (${specialtyPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM short_tags st2
            JOIN tags t ON st2.tagId = t.tagId
            WHERE st2.mediaItemId = s.mediaItemId
              AND t.type = 'AgeGroup'
          )
        ORDER BY s.title
      `;
            const queryParams1 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
            };
            const stmt1 = this.db.prepare(query1);
            const rows1 = stmt1.all(queryParams1);
            rows1.forEach((row) => {
                const short = this.mapRowToShort(row);
                shortMap.set(short.mediaItemId, short);
            });
        }
        // Query 3: Shorts with holiday + age group tags (no specialty)
        if (ageGroupTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const query3 = `
        SELECT DISTINCT s.* FROM shorts s
        JOIN short_tags st ON s.mediaItemId = st.mediaItemId
        WHERE s.duration IS NOT NULL
          AND s.duration <= :maxDuration
          AND st.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM short_tags st2
            WHERE st2.mediaItemId = s.mediaItemId
              AND st2.tagId IN (${ageGroupPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM short_tags st2
            JOIN tags t ON st2.tagId = t.tagId
            WHERE st2.mediaItemId = s.mediaItemId
              AND t.type = 'Specialty'
          )
        ORDER BY s.title
      `;
            const queryParams3 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
            };
            const stmt3 = this.db.prepare(query3);
            const rows3 = stmt3.all(queryParams3);
            rows3.forEach((row) => {
                const short = this.mapRowToShort(row);
                shortMap.set(short.mediaItemId, short);
            });
        }
        // Query 4: Shorts with ONLY holiday tag (no age group or specialty)
        const query4 = `
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND st.tagId IN (${holidayPlaceholders})
        AND NOT EXISTS (
          SELECT 1 FROM short_tags st2
          JOIN tags t ON st2.tagId = t.tagId
          WHERE st2.mediaItemId = s.mediaItemId
            AND (t.type = 'AgeGroup' OR t.type = 'Specialty')
        )
      ORDER BY s.title
    `;
        const queryParams4 = {
            maxDuration,
            ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
        };
        const stmt4 = this.db.prepare(query4);
        const rows4 = stmt4.all(queryParams4);
        rows4.forEach((row) => {
            const short = this.mapRowToShort(row);
            shortMap.set(short.mediaItemId, short);
        });
        return Array.from(shortMap.values());
    }
    findBySpecialtyTags(specialtyTags, maxDuration) {
        if (specialtyTags.length === 0) {
            return [];
        }
        const specialtyTagIds = specialtyTags.map((tag) => tag.tagId);
        const specialtyPlaceholders = specialtyTagIds
            .map((_, i) => `:specialty${i}`)
            .join(",");
        const query = `
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND st.tagId IN (${specialtyPlaceholders})
      ORDER BY s.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const shortMap = new Map();
        rows.forEach((row) => {
            const short = this.mapRowToShort(row);
            shortMap.set(short.mediaItemId, short);
        });
        return Array.from(shortMap.values());
    }
    findByGenreAestheticAgeGroup(genreTags, aestheticTags, ageGroupTags, maxDuration) {
        const genreAestheticTags = [...genreTags, ...aestheticTags];
        if (genreAestheticTags.length === 0) {
            return [];
        }
        const genreAestheticTagIds = genreAestheticTags.map((tag) => tag.tagId);
        const genreAestheticPlaceholders = genreAestheticTagIds
            .map((_, i) => `:gaTag${i}`)
            .join(",");
        const params = { maxDuration };
        genreAestheticTagIds.forEach((id, i) => {
            params[`gaTag${i}`] = id;
        });
        let query = `
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND st.tagId IN (${genreAestheticPlaceholders})
    `;
        if (ageGroupTags.length > 0) {
            const ageGroupIds = ageGroupTags.map((tag) => tag.tagId);
            const ageGroupPlaceholders = ageGroupIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            query += `
        AND (
          EXISTS (
            SELECT 1 FROM short_tags st2
            WHERE st2.mediaItemId = s.mediaItemId
              AND st2.tagId IN (${ageGroupPlaceholders})
          )
          OR NOT EXISTS (
            SELECT 1 FROM short_tags st2
            JOIN tags t ON st2.tagId = t.tagId
            WHERE st2.mediaItemId = s.mediaItemId
              AND t.type = 'AgeGroup'
          )
        )
      `;
            ageGroupIds.forEach((id, i) => {
                params[`ageGroup${i}`] = id;
            });
        }
        query += ` ORDER BY s.title`;
        const stmt = this.db.prepare(query);
        const rows = stmt.all(params);
        return rows.map((row) => this.mapRowToShort(row));
    }
    findByAgeGroupOnly(ageGroupTags, maxDuration) {
        if (ageGroupTags.length === 0) {
            return [];
        }
        const ageGroupTagIds = ageGroupTags.map((tag) => tag.tagId);
        const ageGroupPlaceholders = ageGroupTagIds
            .map((_, i) => `:ageGroup${i}`)
            .join(",");
        const query = `
      SELECT DISTINCT s.* FROM shorts s
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND EXISTS (
          SELECT 1 FROM short_tags st
          WHERE st.mediaItemId = s.mediaItemId
            AND st.tagId IN (${ageGroupPlaceholders})
        )
        AND NOT EXISTS (
          SELECT 1 FROM short_tags st
          JOIN tags t ON st.tagId = t.tagId
          WHERE st.mediaItemId = s.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre')
        )
      ORDER BY s.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const shortMap = new Map();
        rows.forEach((row) => {
            const short = this.mapRowToShort(row);
            shortMap.set(short.mediaItemId, short);
        });
        return Array.from(shortMap.values());
    }
    findByNoTags(maxDuration) {
        const query = `
      SELECT DISTINCT s.* FROM shorts s
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND NOT EXISTS (
          SELECT 1 FROM short_tags st
          JOIN tags t ON st.tagId = t.tagId
          WHERE st.mediaItemId = s.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre', 'AgeGroup')
        )
      ORDER BY s.title
    `;
        const queryParams = {
            maxDuration,
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const shortMap = new Map();
        rows.forEach((row) => {
            const short = this.mapRowToShort(row);
            shortMap.set(short.mediaItemId, short);
        });
        return Array.from(shortMap.values());
    }
    update(mediaItemId, short) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE shorts 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(short.title, short.duration || null, short.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM short_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, short.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM shorts WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shorts`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO short_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    mapRowToShort(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN short_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
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
            title: row.title,
            path: row.path,
            duration: row.duration,
            isHolidayExclusive: !!row.isHolidayExclusive,
            type: MediaType.Short,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    /**
     * Finds a random set of shorts and music videos matching the requested count combined.
     * Combines all shorts and music with individual duration <= maxDuration into a single pool,
     * then randomly selects up to `count` items.
     * Duration budgeting is handled by the caller (selectShortsAndMusic).
     */
    findRandomShortsAndMusicByCount(count, maxDuration) {
        const stmt = this.db.prepare(`
      SELECT type, mediaItemId, title, path, duration, createdAt, updatedAt
      FROM (
        SELECT
          'short' as type,
          mediaItemId,
          title,
          path,
          duration,
          createdAt,
          updatedAt
        FROM shorts
        WHERE duration <= ?
        UNION ALL
        SELECT
          'music' as type,
          mediaItemId,
          title,
          path,
          duration,
          createdAt,
          updatedAt
        FROM music
        WHERE duration <= ?
      )
      ORDER BY RANDOM()
      LIMIT ?
    `);
        const rows = stmt.all(maxDuration, maxDuration, count);
        const shorts = [];
        const music = [];
        for (const row of rows) {
            if (row.type === "short") {
                shorts.push(this.mapRowToShort(row));
            }
            else {
                music.push(this.mapRowToMusic(row));
            }
        }
        return { shorts, music };
    }
    mapRowToMusic(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN music_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
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
            title: row.title,
            path: row.path,
            duration: row.duration,
            isHolidayExclusive: !!row.isHolidayExclusive,
            type: MediaType.Music,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const shortRepository = new ShortRepository();
