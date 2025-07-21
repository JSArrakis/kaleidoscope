import { getDB } from '../db/sqlite';
import { Commercial } from '../models/commercial';

export class CommercialRepository {
  private get db() {
    return getDB();
  }

  // Create a new commercial
  create(commercial: Commercial): Commercial {
    const stmt = this.db.prepare(`
      INSERT INTO commercials (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      commercial.title,
      commercial.mediaItemId,
      commercial.duration,
      commercial.path,
      commercial.type,
      JSON.stringify(commercial.tags),
    );

    return this.findByMediaItemId(commercial.mediaItemId)!;
  }

  // Create multiple commercials in a transaction
  createMany(commercials: Commercial[]): Commercial[] {
    const stmt = this.db.prepare(`
      INSERT INTO commercials (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(
      (commercialsToInsert: Commercial[]) => {
        const results: Commercial[] = [];
        for (const commercial of commercialsToInsert) {
          try {
            stmt.run(
              commercial.title,
              commercial.mediaItemId,
              commercial.duration,
              commercial.path,
              commercial.type,
              JSON.stringify(commercial.tags),
            );
            const created = this.findByMediaItemId(commercial.mediaItemId);
            if (created) results.push(created);
          } catch (error) {
            // Skip duplicates or other errors
            console.warn(
              `Failed to insert commercial ${commercial.mediaItemId}:`,
              error,
            );
          }
        }
        return results;
      },
    );

    return transaction(commercials);
  }

  // Find commercial by mediaItemId
  findByMediaItemId(mediaItemId: string): Commercial | null {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE mediaItemId = ?
    `);

    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    return this.mapRowToCommercial(row);
  }

  // Find all commercials
  findAll(): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials ORDER BY title
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToCommercial(row));
  }

  // Update commercial
  update(mediaItemId: string, commercial: Commercial): Commercial | null {
    const stmt = this.db.prepare(`
      UPDATE commercials 
      SET title = ?, duration = ?, path = ?, type = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE mediaItemId = ?
    `);

    const result = stmt.run(
      commercial.title,
      commercial.duration,
      commercial.path,
      commercial.type,
      JSON.stringify(commercial.tags),
      mediaItemId,
    );

    if (result.changes === 0) return null;
    return this.findByMediaItemId(mediaItemId);
  }

  // Delete commercial
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM commercials WHERE mediaItemId = ?
    `);

    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find commercials by tags
  findByTags(tags: string[]): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials 
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY title
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToCommercial(row));
  }

  // Find commercials by type
  findByType(type: number): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE type = ? ORDER BY title
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => this.mapRowToCommercial(row));
  }

  // Count all commercials
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToCommercial(row: any): Commercial {
    return new Commercial(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      JSON.parse(row.tags || '[]'),
    );
  }
}

// Export singleton instance
export const commercialRepository = new CommercialRepository();
