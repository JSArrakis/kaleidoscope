import { getDB } from '../db/sqlite';
import { AgeGroup } from '../models/ageGroup';

export class AgeGroupRepository {
  private get db() {
    return getDB();
  }

  create(ageGroup: AgeGroup): AgeGroup | null {
    const stmt = this.db.prepare(`
      INSERT INTO age_groups (tagId, name, sequence)
      VALUES (?, ?, ?)
    `);

    stmt.run(ageGroup.tagId, ageGroup.name, ageGroup.sequence);
    return this.findByTagId(ageGroup.tagId);
  }

  findByTagId(tagId: string): AgeGroup | null {
    const stmt = this.db.prepare(`SELECT * FROM age_groups WHERE tagId = ?`);
    const row = stmt.get(tagId) as any;
    return row ? this.mapRowToAgeGroup(row) : null;
  }

  findAll(): AgeGroup[] {
    const stmt = this.db.prepare(`SELECT * FROM age_groups ORDER BY name`);
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToAgeGroup(row));
  }

  delete(tagId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM age_groups WHERE tagId = ?`);
    const result = stmt.run(tagId);
    return result.changes > 0;
  }

  private mapRowToAgeGroup(row: any): AgeGroup {
    return {
      tagId: row.tagId,
      name: row.name,
      sequence: row.sequence,
    };
  }
}
