import { getDB } from '../db/sqlite';
import { Bumper } from '../models/bumper';

export class BumperRepository {
  private get db() {
    return getDB();
  }

  // Create a new bumper
  create(bumper: Bumper): Bumper {
    const stmt = this.db.prepare(`
      INSERT INTO bumpers (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      bumper.title,
      bumper.mediaItemId,
      bumper.duration,
      bumper.path,
      bumper.type,
      JSON.stringify(bumper.tags),
    );

    return this.findByMediaItemId(bumper.mediaItemId)!;
  }

  // Create multiple bumpers in a transaction
  createMany(bumpers: Bumper[]): Bumper[] {
    const stmt = this.db.prepare(`
      INSERT INTO bumpers (title, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(
      (bumpersToInsert: Bumper[]) => {
        const results: Bumper[] = [];
        for (const bumper of bumpersToInsert) {
          try {
            stmt.run(
              bumper.title,
              bumper.mediaItemId,
              bumper.duration,
              bumper.path,
              bumper.type,
              JSON.stringify(bumper.tags),
            );
            const created = this.findByMediaItemId(bumper.mediaItemId);
            if (created) results.push(created);
          } catch (error) {
            // Skip duplicates or other errors
            console.warn(
              `Failed to insert bumper ${bumper.mediaItemId}:`,
              error,
            );
          }
        }
        return results;
      },
    );

    return transaction(bumpers);
  }

  // Find bumper by mediaItemId
  findByMediaItemId(mediaItemId: string): Bumper | null {
    const stmt = this.db.prepare(`
      SELECT * FROM bumpers WHERE mediaItemId = ?
    `);

    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    return this.mapRowToBumper(row);
  }

  // Find all commercials
  findAll(): Bumper[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bumpers ORDER BY title
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToBumper(row));
  }

  // Update bumper
  update(mediaItemId: string, bumper: Bumper): Bumper | null {
    const stmt = this.db.prepare(`
      UPDATE bumpers
      SET title = ?, duration = ?, path = ?, type = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE mediaItemId = ?
    `);

    const result = stmt.run(
      bumper.title,
      bumper.duration,
      bumper.path,
      bumper.type,
      JSON.stringify(bumper.tags),
      mediaItemId,
    );

    if (result.changes === 0) return null;
    return this.findByMediaItemId(mediaItemId);
  }

  // Delete commercial
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM bumpers WHERE mediaItemId = ?
    `);

    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find bumpers by tags
  findByTags(tags: string[]): Bumper[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bumpers
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY title
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToBumper(row));
  }

  // Find bumpers by type
  findByType(type: number): Bumper[] {
    const stmt = this.db.prepare(`
      SELECT * FROM bumpers WHERE type = ? ORDER BY title
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => this.mapRowToBumper(row));
  }

  // Count all bumpers
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM bumpers`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToBumper(row: any): Bumper {
    return new Bumper(
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
export const bumperRepository = new BumperRepository();
