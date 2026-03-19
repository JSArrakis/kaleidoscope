import { getDB } from "../db/sqlite.js";
export class MusicRepository {
    get db() {
        return getDB();
    }
    create(music) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO music (title, mediaItemId, artist, duration, path)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(music.title, music.mediaItemId, music.artist || null, music.duration || null, music.path);
            this.insertTags(music.mediaItemId, music.tags);
        });
        transaction();
        return this.findByMediaItemId(music.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM music WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToMusic(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM music ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMusic(row));
    }
    findRandomMusic() {
        const stmt = this.db.prepare(`SELECT * FROM music ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToMusic(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM music m
      JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ?
      ORDER BY m.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToMusic(row));
    }
    findHolidayMusic(ageGroupTags, holidayTags, specialtyTags, maxDuration) {
        if (holidayTags.length === 0) {
            return [];
        }
        const holidayTagIds = holidayTags.map((tag) => tag.tagId);
        const ageGroupTagIds = ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];
        const specialtyTagIds = specialtyTags.length > 0 ? specialtyTags.map((tag) => tag.tagId) : [];
        const musicMap = new Map();
        const holidayPlaceholders = holidayTagIds
            .map((_, i) => `:holiday${i}`)
            .join(",");
        // Query 1: Music with holiday + age group + specialty tags
        if (ageGroupTagIds.length > 0 && specialtyTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query2 = `
        SELECT DISTINCT m.* FROM music m
        JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
        WHERE m.duration IS NOT NULL
          AND m.duration <= :maxDuration
          AND mt.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM music_tags mt2
            WHERE mt2.mediaItemId = m.mediaItemId
              AND mt2.tagId IN (${ageGroupPlaceholders})
          )
          AND EXISTS (
            SELECT 1 FROM music_tags mt2
            WHERE mt2.mediaItemId = m.mediaItemId
              AND mt2.tagId IN (${specialtyPlaceholders})
          )
        ORDER BY m.title
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
                const music = this.mapRowToMusic(row);
                musicMap.set(music.mediaItemId, music);
            });
        }
        // Query 2: Music with holiday + specialty tags (no age group or other specialty)
        if (specialtyTagIds.length > 0) {
            const specialtyPlaceholders = specialtyTagIds
                .map((_, i) => `:specialty${i}`)
                .join(",");
            const query1 = `
        SELECT DISTINCT m.* FROM music m
        JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
        WHERE m.duration IS NOT NULL
          AND m.duration <= :maxDuration
          AND mt.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM music_tags mt2
            WHERE mt2.mediaItemId = m.mediaItemId
              AND mt2.tagId IN (${specialtyPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM music_tags mt2
            JOIN tags t ON mt2.tagId = t.tagId
            WHERE mt2.mediaItemId = m.mediaItemId
              AND t.type = 'AgeGroup'
          )
        ORDER BY m.title
      `;
            const queryParams1 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
            };
            const stmt1 = this.db.prepare(query1);
            const rows1 = stmt1.all(queryParams1);
            rows1.forEach((row) => {
                const music = this.mapRowToMusic(row);
                musicMap.set(music.mediaItemId, music);
            });
        }
        // Query 3: Music with holiday + age group tags (no specialty)
        if (ageGroupTagIds.length > 0) {
            const ageGroupPlaceholders = ageGroupTagIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            const query3 = `
        SELECT DISTINCT m.* FROM music m
        JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
        WHERE m.duration IS NOT NULL
          AND m.duration <= :maxDuration
          AND mt.tagId IN (${holidayPlaceholders})
          AND EXISTS (
            SELECT 1 FROM music_tags mt2
            WHERE mt2.mediaItemId = m.mediaItemId
              AND mt2.tagId IN (${ageGroupPlaceholders})
          )
          AND NOT EXISTS (
            SELECT 1 FROM music_tags mt2
            JOIN tags t ON mt2.tagId = t.tagId
            WHERE mt2.mediaItemId = m.mediaItemId
              AND t.type = 'Specialty'
          )
        ORDER BY m.title
      `;
            const queryParams3 = {
                maxDuration,
                ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
                ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
            };
            const stmt3 = this.db.prepare(query3);
            const rows3 = stmt3.all(queryParams3);
            rows3.forEach((row) => {
                const music = this.mapRowToMusic(row);
                musicMap.set(music.mediaItemId, music);
            });
        }
        // Query 4: Music with ONLY holiday tag (no age group or specialty)
        const query4 = `
      SELECT DISTINCT m.* FROM music m
      JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE m.duration IS NOT NULL
        AND m.duration <= :maxDuration
        AND mt.tagId IN (${holidayPlaceholders})
        AND NOT EXISTS (
          SELECT 1 FROM music_tags mt2
          JOIN tags t ON mt2.tagId = t.tagId
          WHERE mt2.mediaItemId = m.mediaItemId
            AND (t.type = 'AgeGroup' OR t.type = 'Specialty')
        )
      ORDER BY m.title
    `;
        const queryParams4 = {
            maxDuration,
            ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
        };
        const stmt4 = this.db.prepare(query4);
        const rows4 = stmt4.all(queryParams4);
        rows4.forEach((row) => {
            const music = this.mapRowToMusic(row);
            musicMap.set(music.mediaItemId, music);
        });
        return Array.from(musicMap.values());
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
      SELECT DISTINCT m.* FROM music m
      JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE m.duration IS NOT NULL
        AND m.duration <= :maxDuration
        AND mt.tagId IN (${specialtyPlaceholders})
      ORDER BY m.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(specialtyTagIds.map((id, i) => [`:specialty${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const musicMap = new Map();
        rows.forEach((row) => {
            const music = this.mapRowToMusic(row);
            musicMap.set(music.mediaItemId, music);
        });
        return Array.from(musicMap.values());
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
      SELECT DISTINCT m.* FROM music m
      JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE m.duration IS NOT NULL
        AND m.duration <= :maxDuration
        AND mt.tagId IN (${genreAestheticPlaceholders})
    `;
        if (ageGroupTags.length > 0) {
            const ageGroupIds = ageGroupTags.map((tag) => tag.tagId);
            const ageGroupPlaceholders = ageGroupIds
                .map((_, i) => `:ageGroup${i}`)
                .join(",");
            query += `
        AND (
          EXISTS (
            SELECT 1 FROM music_tags mt2
            WHERE mt2.mediaItemId = m.mediaItemId
              AND mt2.tagId IN (${ageGroupPlaceholders})
          )
          OR NOT EXISTS (
            SELECT 1 FROM music_tags mt2
            JOIN tags t ON mt2.tagId = t.tagId
            WHERE mt2.mediaItemId = m.mediaItemId
              AND t.type = 'AgeGroup'
          )
        )
      `;
            ageGroupIds.forEach((id, i) => {
                params[`ageGroup${i}`] = id;
            });
        }
        query += ` ORDER BY m.title`;
        const stmt = this.db.prepare(query);
        const rows = stmt.all(params);
        return rows.map((row) => this.mapRowToMusic(row));
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
      SELECT DISTINCT m.* FROM music m
      WHERE m.duration IS NOT NULL
        AND m.duration <= :maxDuration
        AND EXISTS (
          SELECT 1 FROM music_tags mt
          WHERE mt.mediaItemId = m.mediaItemId
            AND mt.tagId IN (${ageGroupPlaceholders})
        )
        AND NOT EXISTS (
          SELECT 1 FROM music_tags mt
          JOIN tags t ON mt.tagId = t.tagId
          WHERE mt.mediaItemId = m.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre')
        )
      ORDER BY m.title
    `;
        const queryParams = {
            maxDuration,
            ...Object.fromEntries(ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])),
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const musicMap = new Map();
        rows.forEach((row) => {
            const music = this.mapRowToMusic(row);
            musicMap.set(music.mediaItemId, music);
        });
        return Array.from(musicMap.values());
    }
    findByNoTags(maxDuration) {
        const query = `
      SELECT DISTINCT m.* FROM music m
      WHERE m.duration IS NOT NULL
        AND m.duration <= :maxDuration
        AND NOT EXISTS (
          SELECT 1 FROM music_tags mt
          JOIN tags t ON mt.tagId = t.tagId
          WHERE mt.mediaItemId = m.mediaItemId
            AND t.type IN ('Holiday', 'Genre', 'Specialty', 'Aesthetic', 'MusicalGenre', 'AgeGroup')
        )
      ORDER BY m.title
    `;
        const queryParams = {
            maxDuration,
        };
        const stmt = this.db.prepare(query);
        const rows = stmt.all(queryParams);
        const musicMap = new Map();
        rows.forEach((row) => {
            const music = this.mapRowToMusic(row);
            musicMap.set(music.mediaItemId, music);
        });
        return Array.from(musicMap.values());
    }
    update(mediaItemId, music) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE music 
        SET title = ?, artist = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(music.title, music.artist || null, music.duration || null, music.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM music_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, music.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM music WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM music`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO music_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
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
            artist: row.artist,
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
export const musicRepository = new MusicRepository();
