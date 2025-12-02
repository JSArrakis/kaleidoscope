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
      explicitlyHoliday: tagRow.explicitlyHoliday === 1,
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
