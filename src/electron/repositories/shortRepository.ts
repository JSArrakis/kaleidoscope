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
    maxDuration: number
  ): Short[] {
    if (holidayTags.length === 0) {
      return [];
    }

    const holidayTagIds: string[] = holidayTags.map((tag) => tag.tagId);
    const ageGroupTagIds: string[] =
      ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];

    const shortMap = new Map<string, Short>();

    // Query 1: Shorts with holiday tag AND NO age group tag
    const holidayPlaceholders = holidayTagIds
      .map((_, i) => `:holiday${i}`)
      .join(",");
    const query1 = `
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE s.duration IS NOT NULL
        AND s.duration <= :maxDuration
        AND st.tagId IN (${holidayPlaceholders})
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
      ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
    };

    const stmt1 = this.db.prepare(query1);
    const rows1 = stmt1.all(queryParams1) as any[];
    rows1.forEach((row) => {
      const short = this.mapRowToShort(row);
      shortMap.set(short.mediaItemId, short);
    });

    // Query 2: Shorts with holiday tag AND age group tag (if age groups provided)
    if (ageGroupTagIds.length > 0) {
      const ageGroupPlaceholders = ageGroupTagIds
        .map((_, i) => `:ageGroup${i}`)
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
}

export const shortRepository = new ShortRepository();
