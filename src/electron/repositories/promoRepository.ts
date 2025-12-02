import { getDB } from "../db/sqlite.js";

export class PromoRepository {
  private get db() {
    return getDB();
  }

  create(promo: Promo): Promo {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO promos (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        promo.title,
        promo.mediaItemId,
        promo.duration || null,
        promo.path
      );
      this.insertTags(promo.mediaItemId, promo.tags);
    });

    transaction();
    return this.findByMediaItemId(promo.mediaItemId)!;
  }

  findByMediaItemId(mediaItemId: string): Promo | null {
    const stmt = this.db.prepare(`SELECT * FROM promos WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToPromo(row);
  }

  findAll(): Promo[] {
    const stmt = this.db.prepare(`SELECT * FROM promos ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToPromo(row));
  }

  findRandomPromo(): Promo | null {
    const stmt = this.db.prepare(
      `SELECT * FROM promos ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToPromo(row);
  }

  findByTag(tagId: string): Promo[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT p.* FROM promos p
      JOIN promo_tags pt ON p.mediaItemId = pt.mediaItemId
      WHERE pt.tagId = ?
      ORDER BY p.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToPromo(row));
  }

  update(mediaItemId: string, promo: Promo): Promo | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE promos 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        promo.title,
        promo.duration || null,
        promo.path,
        mediaItemId
      );
      if (result.changes === 0) return null;

      this.db
        .prepare("DELETE FROM promo_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertTags(mediaItemId, promo.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM promos WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM promos`);
    const result = stmt.get() as any;
    return result.count;
  }

  private insertTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO promo_tags (mediaItemId, tagId) VALUES (?, ?)`
    );
    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId);
    }
  }

  private mapRowToPromo(row: any): Promo {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN promo_tags pt ON t.tagId = pt.tagId
      WHERE pt.mediaItemId = ?
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
      type: MediaType.Promo,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const promoRepository = new PromoRepository();
