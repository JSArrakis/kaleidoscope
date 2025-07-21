import { getDB } from '../db/sqlite';
import { Promo } from '../models/promo';

export class PromoRepository {
  private get db() {
    return getDB();
  }

  create(promo: Promo): Promo {
    const stmt = this.db.prepare(`
      INSERT INTO promos (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      promo.title,
      promo.mediaItemId,
      promo.duration,
      promo.path,
      promo.type,
      JSON.stringify(promo.tags),
    );

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
    return rows.map(row => this.mapRowToPromo(row));
  }

  update(mediaItemId: string, promo: Promo): Promo | null {
    const stmt = this.db.prepare(`
      UPDATE promos 
      SET title = ?, duration = ?, path = ?, type = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE mediaItemId = ?
    `);

    const result = stmt.run(
      promo.title,
      promo.duration,
      promo.path,
      promo.type,
      JSON.stringify(promo.tags),
      mediaItemId,
    );

    return result.changes > 0 ? this.findByMediaItemId(mediaItemId) : null;
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM promos WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  private mapRowToPromo(row: any): Promo {
    return new Promo(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      JSON.parse(row.tags || '[]'),
    );
  }
}

export const promoRepository = new PromoRepository();