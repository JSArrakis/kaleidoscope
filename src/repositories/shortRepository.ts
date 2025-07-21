import { getDB } from '../db/sqlite';
import { Short } from '../models/short';

export class ShortRepository {
  private get db() {
    return getDB();
  }
  create(short: Short): Short {
    const stmt = this.db.prepare(`
      INSERT INTO shorts (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      short.title,
      short.mediaItemId,
      short.duration,
      short.path,
      short.type,
      JSON.stringify(short.tags),
    );

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
    return rows.map(row => this.mapRowToShort(row));
  }

  update(mediaItemId: string, short: Short): Short | null {
    const stmt = this.db.prepare(`
        UPDATE shorts 
        SET title = ?, duration = ?, path = ?, type = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

    const result = stmt.run(
      short.title,
      short.duration,
      short.path,
      short.type,
      JSON.stringify(short.tags),
      mediaItemId,
    );

    return result.changes > 0 ? this.findByMediaItemId(mediaItemId) : null;
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM shorts WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  private mapRowToShort(row: any): Short {
    return new Short(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      JSON.parse(row.tags || '[]'),
    );
  }
}

export const shortRepository = new ShortRepository();
