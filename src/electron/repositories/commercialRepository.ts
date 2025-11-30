import { getDB } from "../db/sqlite.js";
import { Tag } from "./tagsRepository.js";

export interface Commercial {
  mediaItemId: string;
  title: string;
  path: string;
  duration?: number;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
}

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
      explicitlyHoliday: tagRow.explicitlyHoliday === 1,
      sequence: tagRow.sequence,
    }));

    return {
      mediaItemId: row.mediaItemId,
      title: row.title,
      path: row.path,
      duration: row.duration,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const commercialRepository = new CommercialRepository();
