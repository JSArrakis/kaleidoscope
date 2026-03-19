import { getDB } from "../db/sqlite.js";
export class CommercialRepository {
    get db() {
        return getDB();
    }
    create(commercial) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO commercials (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(commercial.title, commercial.mediaItemId, commercial.duration || null, commercial.path);
            this.insertTags(commercial.mediaItemId, commercial.tags);
        });
        transaction();
        return this.findByMediaItemId(commercial.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM commercials WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToCommercial(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM commercials ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToCommercial(row));
    }
    findRandomCommercial() {
        const stmt = this.db.prepare(`SELECT * FROM commercials ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToCommercial(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE ct.tagId = ?
      ORDER BY c.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToCommercial(row));
    }
    findHolidayCommercials(ageGroupTags, holidayTags, specialtyTags, maxDuration) {
        if (holidayTags.length === 0) {
            return [];
        }
        const holidayTagIds = holidayTags.map((tag) => tag.tagId);
        const ageGroupTagIds = ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];
        const specialtyTagIds = specialtyTags.length > 0 ? specialtyTags.map((tag) => tag.tagId) : [];
        const commercialMap = new Map();
        const holidayPlaceholders = holidayTagIds
            .map((_, i) => `:holiday${i}`)
            .join(",");
        // Query 1: Commercials with holiday + age group + specialty tags
        if (ageGroupTagIds.length > 0 && specialtyTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query2 = `
        SELECT DISTINCT c.* FROM commercials c
        JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
        WHERE c.duration IS NOT NULL
          AND c.duration <= :maxDuration
          AND ct.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM commercial_tags ct2
            WHERE ct2.mediaItemId = c.mediaItemId
              AND ct2.tagId IN (${ageGroupPlaceholders})
          )
          AND EXISTS (
            SELECT 1 FROM commercial_tags ct2
            WHERE ct2.mediaItemId = c.mediaItemId
              AND ct2.tagId IN (${specialtyPlaceholders})
          )
        ORDER BY c.title
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
                const commercial = this.mapRowToCommercial(row);
                commercialMap.set(commercial.mediaItemId, commercial);
            });
        }
        // Query 2: Commercials with holiday + specialty tags (no age group)
        if (specialtyTagIds.length > 0) {
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query1 = `
        SELECT DISTINCT c.* FROM commercials c
        JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
        WHERE c.duration IS NOT NULL
          AND c.duration <= :maxDuration
          AND ct.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM commercial_tags ct2
            WHERE ct2.mediaItemId = c.mediaItemId
              AND ct2.tagId IN (${specialtyPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM commercial_tags ct2
            JOIN tags t ON ct2.tagId = t.tagId
            WHERE ct2.mediaItemId = c.mediaItemId
              AND t.type = 'AgeGroup'
          )
        ORDER BY c.title
      `;
            const queryParams1 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
            };
            const stmt1 = this.db.prepare(query1);
            const rows1 = stmt1.all(queryParams1);
            rows1.forEach((row) => {
                const commercial = this.mapRowToCommercial(row);
                commercialMap.set(commercial.mediaItemId, commercial);
            });
        }
        // Query 3: Commercials with holiday + age group tags (no specialty)
        if (ageGroupTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const query3 = `
        SELECT DISTINCT c.* FROM commercials c
        JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
        WHERE c.duration IS NOT NULL
          AND c.duration <= :maxDuration
          AND ct.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM commercial_tags ct2
            WHERE ct2.mediaItemId = c.mediaItemId
              AND ct2.tagId IN (${ageGroupPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM commercial_tags ct2
            JOIN tags t ON ct2.tagId = t.tagId
            WHERE ct2.mediaItemId = c.mediaItemId
              AND t.type = 'Specialty'
          )
        ORDER BY c.title
      `;
            const queryParams3 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
            };
            const stmt3 = this.db.prepare(query3);
            const rows3 = stmt3.all(queryParams3);
            rows3.forEach((row) => {
                const commercial = this.mapRowToCommercial(row);
                commercialMap.set(commercial.mediaItemId, commercial);
            });
        }
        // Query 4: Commercials with ONLY holiday tag (no age group or specialty)
        const query4 = `
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND ct.tagId IN (${holidayPlaceholders})
        AND NOT EXISTS (
          SELECT 1 FROM commercial_tags ct2
          JOIN tags t ON ct2.tagId = t.tagId
          WHERE ct2.mediaItemId = c.mediaItemId
            AND (t.type = 'AgeGroup' OR t.type = 'Specialty')
        )
      ORDER BY c.title
    `;
        const queryParams4 = {
            maxDuration,
            ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
        };
        const stmt4 = this.db.prepare(query4);
        const rows4 = stmt4.all(queryParams4);
        rows4.forEach((row) => {
            const commercial = this.mapRowToCommercial(row);
            commercialMap.set(commercial.mediaItemId, commercial);
        });
        return Array.from(commercialMap.values());
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
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND ct.tagId IN (${specialtyPlaceholders})
      ORDER BY c.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const commercialMap = new Map();
        rows.forEach((row) => {
            const commercial = this.mapRowToCommercial(row);
            commercialMap.set(commercial.mediaItemId, commercial);
        });
        return Array.from(commercialMap.values());
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
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND ct.tagId IN (${genreAestheticPlaceholders})
    `;
        if (ageGroupTags.length > 0) {
            const ageGroupIds = ageGroupTags.map((tag) => tag.tagId);
            const ageGroupPlaceholders = ageGroupIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            query += `
        AND (
          EXISTS (
            SELECT 1 FROM commercial_tags ct2
            WHERE ct2.mediaItemId = c.mediaItemId
              AND ct2.tagId IN (${ageGroupPlaceholders})
          )
          OR NOT EXISTS (
            SELECT 1 FROM commercial_tags ct2
            JOIN tags t ON ct2.tagId = t.tagId
            WHERE ct2.mediaItemId = c.mediaItemId
              AND t.type = 'AgeGroup'
          )
        )
      `;
            ageGroupIds.forEach((id, i) => {
                params[`ageGroup${i}`] = id;
            });
        }
        query += ` ORDER BY c.title`;
        const stmt = this.db.prepare(query);
        const rows = stmt.all(params);
        return rows.map((row) => this.mapRowToCommercial(row));
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
      SELECT DISTINCT c.* FROM commercials c
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND EXISTS (
          SELECT 1 FROM commercial_tags ct
          WHERE ct.mediaItemId = c.mediaItemId
            AND ct.tagId IN (${ageGroupPlaceholders})
        )
        AND NOT EXISTS (
          SELECT 1 FROM commercial_tags ct
          JOIN tags t ON ct.tagId = t.tagId
          WHERE ct.mediaItemId = c.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre')
        )
      ORDER BY c.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const commercialMap = new Map();
        rows.forEach((row) => {
            const commercial = this.mapRowToCommercial(row);
            commercialMap.set(commercial.mediaItemId, commercial);
        });
        return Array.from(commercialMap.values());
    }
    findByNoTags(maxDuration) {
        const query = `
      SELECT DISTINCT c.* FROM commercials c
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND NOT EXISTS (
          SELECT 1 FROM commercial_tags ct
          JOIN tags t ON ct.tagId = t.tagId
          WHERE ct.mediaItemId = c.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre', 'AgeGroup')
        )
      ORDER BY c.title
    `;
        const queryParams = {
            maxDuration,
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const commercialMap = new Map();
        rows.forEach((row) => {
            const commercial = this.mapRowToCommercial(row);
            commercialMap.set(commercial.mediaItemId, commercial);
        });
        return Array.from(commercialMap.values());
    }
    findByDefaultSpecialtyTag(maxDuration) {
        const query = `
      SELECT DISTINCT c.* FROM commercials c
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND EXISTS (
          SELECT 1 FROM commercial_tags ct
          WHERE ct.mediaItemId = c.mediaItemId
            AND ct.tagId = :defaultTagId
        )
      ORDER BY c.title
    `;
        const queryParams = {
            maxDuration,
            defaultTagId: "default",
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const commercialMap = new Map();
        rows.forEach((row) => {
            const commercial = this.mapRowToCommercial(row);
            commercialMap.set(commercial.mediaItemId, commercial);
        });
        return Array.from(commercialMap.values());
    }
    update(mediaItemId, commercial) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE commercials 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(commercial.title, commercial.duration || null, commercial.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM commercial_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, commercial.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM commercials WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO commercial_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    /**
     * Finds random commercials that total at least 2 hours (7200 seconds)
     * All returned commercials must be under the passed duration limit
     * Uses SQL window functions to accumulate durations efficiently
     * Total duration may exceed 2 hours as it includes the commercial that crosses the threshold
     */
    findRandomCommercialsByPoolDuration(maxDurationPerItem) {
        const TWO_HOUR_POOL_SECONDS = 7200;
        // Use a CTE to accumulate durations in random order
        // Include all commercials up to and including the one that crosses 2 hours
        const stmt = this.db.prepare(`
      WITH randomized AS (
        SELECT 
          *,
          SUM(COALESCE(duration, 0)) OVER (ORDER BY RANDOM()) as running_total
        FROM commercials
        WHERE duration <= ?
      )
      SELECT * FROM randomized
      WHERE running_total <= (? + (SELECT COALESCE(MAX(duration), 0) FROM commercials WHERE duration <= ?))
      ORDER BY running_total
    `);
        const rows = stmt.all(maxDurationPerItem, TWO_HOUR_POOL_SECONDS, maxDurationPerItem);
        return rows.map((row) => this.mapRowToCommercial(row));
    }
    mapRowToCommercial(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN commercial_tags ct ON t.tagId = ct.tagId
      WHERE ct.mediaItemId = ?
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
            type: MediaType.Commercial,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const commercialRepository = new CommercialRepository();
