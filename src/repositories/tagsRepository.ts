import { getDB } from '../db/sqlite';
import { Tag } from '../models/tag';

export class TagRepository {
  private get db() {
    return getDB();
  }

  // Create a new tag
  create(tag: Tag): Tag {
    const stmt = this.db.prepare(`
      INSERT INTO tags (tagId, name, type)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(tag.tagId, tag.name, tag.type);

    return this.findByTagId(tag.tagId)!;
  }

  // Find tag by tagId
  findByTagId(tagId: string): Tag | null {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE tagId = ?
    `);

    const row = stmt.get(tagId) as any;
    if (!row) return null;

    return this.mapRowToTag(row);
  }

  // Find all tags
  findAll(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags ORDER BY name
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Update tag
  update(tagId: string, tag: Tag): Tag | null {
    const stmt = this.db.prepare(`
      UPDATE tags
      SET name = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE tagId = ?
    `);

    const result = stmt.run(tag.name, tag.type, tagId);

    if (result.changes === 0) return null;
    return this.findByTagId(tagId);
  }

  // Delete tag
  delete(tagId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM tags WHERE tagId = ?
    `);

    const result = stmt.run(tagId);
    return result.changes > 0;
  }

  // Find tags by tags
  findByTags(tags: string[]): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY name
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Find tags by type
  findByType(type: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = ? ORDER BY name
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Count all tags
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM tags`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToTag(row: any): Tag {
    return new Tag(row.tagId, row.name, row.type);
  }
}

// Export singleton instance
export const tagRepository = new TagRepository();
