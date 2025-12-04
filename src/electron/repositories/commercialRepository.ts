import { getDB } from "../db/sqlite.js";

export class CommercialRepository {
  private get db() {
    return getDB();
  }

  create(commercial: Commercial): Commercial {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO commercials (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        commercial.title,
        commercial.mediaItemId,
        commercial.duration || null,
        commercial.path
      );
      this.insertTags(commercial.mediaItemId, commercial.tags);
    });

    transaction();
    return this.findByMediaItemId(commercial.mediaItemId)!;
  }

  findByMediaItemId(mediaItemId: string): Commercial | null {
    const stmt = this.db.prepare(
      `SELECT * FROM commercials WHERE mediaItemId = ?`
    );
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToCommercial(row);
  }

  findAll(): Commercial[] {
    const stmt = this.db.prepare(`SELECT * FROM commercials ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToCommercial(row));
  }

  findRandomCommercial(): Commercial | null {
    const stmt = this.db.prepare(
      `SELECT * FROM commercials ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToCommercial(row);
  }

  findByTag(tagId: string): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE ct.tagId = ?
      ORDER BY c.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToCommercial(row));
  }

  findHolidayCommercials(
    ageGroupTags: Tag[],
    holidayTags: Tag[],
    maxDuration: number
  ): Commercial[] {
    if (holidayTags.length === 0) {
      return [];
    }

    const holidayTagIds: string[] = holidayTags.map((tag) => tag.tagId);
    const ageGroupTagIds: string[] =
      ageGroupTags.length > 0 ? ageGroupTags.map((tag) => tag.tagId) : [];

    const commercialMap = new Map<string, Commercial>();

    // Query 1: Commercials with holiday tag AND NO age group tag
    const holidayPlaceholders = holidayTagIds
      .map((_, i) => `:holiday${i}`)
      .join(",");
    const query1 = `
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE c.duration IS NOT NULL
        AND c.duration <= :maxDuration
        AND ct.tagId IN (${holidayPlaceholders})
        AND NOT EXISTS (
          SELECT 1 FROM commercial_tags ct2
          JOIN tags t ON ct2.tagId = t.tagId
          WHERE ct2.mediaItemId = c.mediaItemId
            AND t.type = 'AgeGroup'
        )
        AND NOT EXISTS (
          SELECT 1 FROM recently_used_media
          WHERE mediaItemId = c.mediaItemId
            AND mediaType = 'Commercial'
        )
      ORDER BY c.title
    `;

    const queryParams1: Record<string, any> = {
      maxDuration,
      ...Object.fromEntries(holidayTagIds.map((id, i) => [`:holiday${i}`, id])),
    };

    const stmt1 = this.db.prepare(query1);
    const rows1 = stmt1.all(queryParams1) as any[];
    rows1.forEach((row) => {
      const commercial = this.mapRowToCommercial(row);
      commercialMap.set(commercial.mediaItemId, commercial);
    });

    // Query 2: Commercials with holiday tag AND age group tag (if age groups provided)
    if (ageGroupTagIds.length > 0) {
      const ageGroupPlaceholders = ageGroupTagIds
        .map((_, i) => `:ageGroup${i}`)
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
          AND NOT EXISTS (
            SELECT 1 FROM recently_used_media
            WHERE mediaItemId = c.mediaItemId
              AND mediaType = 'Commercial'
          )
        ORDER BY c.title
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
        const commercial = this.mapRowToCommercial(row);
        commercialMap.set(commercial.mediaItemId, commercial);
      });
    }

    return Array.from(commercialMap.values());
  }

  update(mediaItemId: string, commercial: Commercial): Commercial | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE commercials 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        commercial.title,
        commercial.duration || null,
        commercial.path,
        mediaItemId
      );
      if (result.changes === 0) return null;

      this.db
        .prepare("DELETE FROM commercial_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertTags(mediaItemId, commercial.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM commercials WHERE mediaItemId = ?`
    );
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
    const result = stmt.get() as any;
    return result.count;
  }

  private insertTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO commercial_tags (mediaItemId, tagId) VALUES (?, ?)`
    );
    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId);
    }
  }

  private mapRowToCommercial(row: any): Commercial {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN commercial_tags ct ON t.tagId = ct.tagId
      WHERE ct.mediaItemId = ?
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
      type: MediaType.Commercial,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const commercialRepository = new CommercialRepository();
