import { getDB } from "../db/sqlite.js";

export class ShortRepository {
  private get db() {
    return getDB();
  }

  create(short: Short): Short {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO shorts (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        short.title,
        short.mediaItemId,
        short.duration || null,
        short.path
      );
      this.insertTags(short.mediaItemId, short.tags);
    });

    transaction();
    return this.findByMediaItemId(short.mediaItemId)!;
  }

  findByMediaItemId(mediaItemId: string): Short | null {
    const stmt = this.db.prepare(`SELECT * FROM shorts WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToShort(row);
  }

  findAll(): Short[] {
    const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToShort(row));
  }

  findRandomShort(): Short | null {
    const stmt = this.db.prepare(
      `SELECT * FROM shorts ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToShort(row);
  }

  findByTag(tagId: string): Short[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToShort(row));
  }

  findHolidayShorts(
    ageGroupTags: Tag[],
    holidayTags: Tag[],
    specialtyTags: Tag[],
    maxDuration: number
  ): Short[] {
    if (holidayTags.length === 0) {
      return [];
    }

    const holidayTagIds: string[] = holidayTags.map((tag) => tag.tagId);
    const ageGroupTagIds: string[] =
      ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];
    const specialtyTagIds: string[] =
      specialtyTags.length > 0 ? specialtyTags.map((tag) => tag.tagId) : [];

    const shortMap = new Map<string, Short>();

    const holidayPlaceholders = holidayTagIds
      .map((_, i) => `:holiday${i}`)
      .join(",");

    // Query 1: Shorts with holiday + specialty tags (no age group or other specialty)
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
          AND NOT EXISTS (
            SELECT 1 FROM recently_used_media
            WHERE mediaItemId = s.mediaItemId
              AND mediaType = 'Short'
          )
        ORDER BY s.title
      `;

      const queryParams1: Record<string, any> = {
        maxDuration,
        ...Object.fromEntries(
          holidayTagIds.map((id, i) => [`:holiday${i}`, id])
        ),
        ...Object.fromEntries(
          specialtyTagIds.map((id, i) => [`:specialty${i}`, id])
        ),
      };

      const stmt1 = this.db.prepare(query1);
      const rows1 = stmt1.all(queryParams1) as any[];
      rows1.forEach((row) => {
        const short = this.mapRowToShort(row);
        shortMap.set(short.mediaItemId, short);
      });
    }

    // Query 2: Shorts with holiday + age group + specialty tags
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
          AND NOT EXISTS (
            SELECT 1 FROM recently_used_media
            WHERE mediaItemId = s.mediaItemId
              AND mediaType = 'Short'
          )
        ORDER BY s.title
      `;

      const queryParams2: Record<string, any> = {
        maxDuration,
        ...Object.fromEntries(
          holidayTagIds.map((id, i) => [`:holiday${i}`, id])
        ),
        ...Object.fromEntries(
          ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])
        ),
        ...Object.fromEntries(
          specialtyTagIds.map((id, i) => [`:specialty${i}`, id])
        ),
      };

      const stmt2 = this.db.prepare(query2);
      const rows2 = stmt2.all(queryParams2) as any[];
      rows2.forEach((row) => {
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
          AND NOT EXISTS (
            SELECT 1 FROM recently_used_media
            WHERE mediaItemId = s.mediaItemId
              AND mediaType = 'Short'
          )
        ORDER BY s.title
      `;

      const queryParams3: Record<string, any> = {
        maxDuration,
        ...Object.fromEntries(
          holidayTagIds.map((id, i) => [`:holiday${i}`, id])
        ),
        ...Object.fromEntries(
          ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])
        ),
      };

      const stmt3 = this.db.prepare(query3);
      const rows3 = stmt3.all(queryParams3) as any[];
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
        AND NOT EXISTS (
          SELECT 1 FROM recently_used_media
          WHERE mediaItemId = s.mediaItemId
            AND mediaType = 'Short'
        )
      ORDER BY s.title
    `;

    const queryParams4: Record<string, any> = {
      maxDuration,
      ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
    };

    const stmt4 = this.db.prepare(query4);
    const rows4 = stmt4.all(queryParams4) as any[];
    rows4.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    return Array.from(shortMap.values());
  }

  findBySpecialtyTags(specialtyTags: Tag[], maxDuration: number): Short[] {
    if (specialtyTags.length === 0) {
      return [];
    }

    const specialtyTagIds: string[] = specialtyTags.map((tag) => tag.tagId);
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

    const queryParams: Record<string, any> = {
      maxDuration,
      ...Object.fromEntries(
        specialtyTagIds.map((id, i) => [`:specialty${i}`, id])
      ),
    };

    const stmt = this.db.prepare(query);
    const rows = stmt.all(queryParams) as any[];
    const shortMap = new Map<string, Short>();

    rows.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    return Array.from(shortMap.values());
  }

  findByGenreAestheticAgeGroup(
    genreTags: Tag[],
    aestheticTags: Tag[],
    ageGroupTags: Tag[],
    maxDuration: number
  ): Short[] {
    const shortMap = new Map<string, Short>();

    // Build list of all tags to search
    const allTags = [...genreTags, ...aestheticTags, ...ageGroupTags];
    if (allTags.length === 0) {
      return [];
    }

    const allTagIds: string[] = allTags.map((tag) => tag.tagId);
    const allPlaceholders = allTagIds.map((_, i) => `:tag${i}`).join(",");

    // Query 1: Any shorts with any of genre/aesthetic/age group tags
    const query1 = `
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND st.tagId IN (${allPlaceholders})
      ORDER BY s.title
    `;

    const queryParams1: Record<string, any> = {
      maxDuration,
      ...Object.fromEntries(allTagIds.map((id, i) => [`:tag${i}`, id])),
    };

    const stmt1 = this.db.prepare(query1);
    const rows1 = stmt1.all(queryParams1) as any[];
    rows1.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    // Query 2: Shorts with aesthetic/genre tags but NO age group
    if (aestheticTags.length > 0 || genreTags.length > 0) {
      const nonAgeTagIds: string[] = [...genreTags, ...aestheticTags].map(
        (tag) => tag.tagId
      );
      const nonAgePlaceholders = nonAgeTagIds
        .map((_, i) => `:nonAgeTag${i}`)
        .join(",");

      const query2 = `
        SELECT DISTINCT s.* FROM shorts s
        JOIN short_tags st ON s.mediaItemId = st.mediaItemId
        WHERE s.duration IS NOT NULL
          AND s.duration <= :maxDuration
          AND st.tagId IN (${nonAgePlaceholders})
          AND NOT EXISTS (
            SELECT 1 FROM short_tags st2
            JOIN tags t ON st2.tagId = t.tagId
            WHERE st2.mediaItemId = s.mediaItemId
              AND t.type = 'AgeGroup'
          )
        ORDER BY s.title
      `;

      const queryParams2: Record<string, any> = {
        maxDuration,
        ...Object.fromEntries(
          nonAgeTagIds.map((id, i) => [`:nonAgeTag${i}`, id])
        ),
      };

      const stmt2 = this.db.prepare(query2);
      const rows2 = stmt2.all(queryParams2) as any[];
      rows2.forEach((row) => {
        const short = this.mapRowToShort(row);
        shortMap.set(short.mediaItemId, short);
      });
    }

    return Array.from(shortMap.values());
  }

  findByAgeGroupOnly(ageGroupTags: Tag[], maxDuration: number): Short[] {
    if (ageGroupTags.length === 0) {
      return [];
    }

    const ageGroupTagIds: string[] = ageGroupTags.map((tag) => tag.tagId);
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

    const queryParams: Record<string, any> = {
      maxDuration,
      ...Object.fromEntries(
        ageGroupTagIds.map((id, i) => [`:ageGroup${i}`, id])
      ),
    };

    const stmt = this.db.prepare(query);
    const rows = stmt.all(queryParams) as any[];
    const shortMap = new Map<string, Short>();

    rows.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    return Array.from(shortMap.values());
  }

  findByNoTags(maxDuration: number): Short[] {
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

    const queryParams: Record<string, any> = {
      maxDuration,
    };

    const stmt = this.db.prepare(query);
    const rows = stmt.all(queryParams) as any[];
    const shortMap = new Map<string, Short>();

    rows.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    return Array.from(shortMap.values());
  }

  update(mediaItemId: string, short: Short): Short | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE shorts 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        short.title,
        short.duration || null,
        short.path,
        mediaItemId
      );
      if (result.changes === 0) return null;

      this.db
        .prepare("DELETE FROM short_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertTags(mediaItemId, short.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM shorts WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shorts`);
    const result = stmt.get() as any;
    return result.count;
  }

  private insertTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO short_tags (mediaItemId, tagId) VALUES (?, ?)`
    );
    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId);
    }
  }

  private mapRowToShort(row: any): Short {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN short_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
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
      title: row.title,
      path: row.path,
      duration: row.duration,
      type: MediaType.Short,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Finds a random set of shorts and music videos matching the requested count combined
   * Uses a single query with two CTEs that randomly alternates between shorts and music
   * Each iteration randomly chooses from either shorts or music pool
   * Selects items while ensuring total combined duration does not exceed the duration limit
   * Each item must be individually under maxDuration
   */
  findRandomShortsAndMusicByCount(
    count: number,
    maxDuration: number,
    duration: number
  ): { shorts: Short[]; music: Music[] } {
    // Single query with two CTEs for shorts and music
    // Randomly chooses from either CTE and accumulates duration
    const stmt = this.db.prepare(`
      WITH shorts_pool AS (
        SELECT 
          'short' as type,
          mediaItemId,
          title,
          path,
          duration,
          createdAt,
          updatedAt,
          ROW_NUMBER() OVER (ORDER BY RANDOM()) as row_num
        FROM shorts
        WHERE duration <= ?
      ),
      music_pool AS (
        SELECT 
          'music' as type,
          mediaItemId,
          title,
          path,
          duration,
          createdAt,
          updatedAt,
          ROW_NUMBER() OVER (ORDER BY RANDOM()) as row_num
        FROM music
        WHERE duration <= ?
      ),
      combined AS (
        SELECT * FROM shorts_pool
        UNION ALL
        SELECT * FROM music_pool
      ),
      randomized AS (
        SELECT 
          type,
          mediaItemId,
          title,
          path,
          duration,
          createdAt,
          updatedAt,
          row_num,
          SUM(duration) OVER (ORDER BY RANDOM()) as running_total,
          ROW_NUMBER() OVER (ORDER BY RANDOM()) as pick_order
        FROM combined
      )
      SELECT * FROM randomized
      WHERE running_total - duration <= ?
      LIMIT ?
      ORDER BY type, row_num
    `);

    const rows = stmt.all(maxDuration, maxDuration, duration, count) as any[];

    const shorts: Short[] = [];
    const music: Music[] = [];

    for (const row of rows) {
      if (row.type === "short") {
        shorts.push(this.mapRowToShort(row));
      } else {
        music.push(this.mapRowToMusic(row));
      }
    }

    return { shorts, music };
  }

  private mapRowToMusic(row: any): Music {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN music_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
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
      title: row.title,
      path: row.path,
      duration: row.duration,
      type: MediaType.Music,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const shortRepository = new ShortRepository();
