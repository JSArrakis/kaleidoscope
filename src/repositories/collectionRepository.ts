import { getDB } from '../db/sqlite';
import { Collection, CollectionItem } from '../models/collection';

export class CollectionRepository {
  private get db() {
    return getDB();
  }

  // Create a new collection
  create(collection: Collection): Collection {
    const stmt = this.db.prepare(`
      INSERT INTO collections (mediaItemId, title, description, items)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      collection.mediaItemId,
      collection.title,
      collection.description,
      JSON.stringify(collection.items),
    );

    return this.findByMediaItemId(collection.mediaItemId)!;
  }

  // Find collection by mediaItemId
  findByMediaItemId(mediaItemId: string): Collection | null {
    const stmt = this.db.prepare(`
      SELECT * FROM collections WHERE mediaItemId = ?
    `);

    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    return this.mapRowToCollection(row);
  }

  // Find all collections
  findAll(): Collection[] {
    const stmt = this.db.prepare(`
      SELECT * FROM collections ORDER BY title
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToCollection(row));
  }

  // Update collection
  update(mediaItemId: string, collection: Collection): Collection | null {
    const stmt = this.db.prepare(`
      UPDATE collections 
      SET title = ?, description = ?, items = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE mediaItemId = ?
    `);

    console.log('Updating collection:', {
      title: collection.title,
      description: collection.description,
      items: collection.items,
      mediaItemId,
    });

    const result = stmt.run(
      collection.title,
      collection.description,
      JSON.stringify(collection.items),
      mediaItemId,
    );

    if (result.changes === 0) return null;
    return this.findByMediaItemId(mediaItemId);
  }

  // Delete collection
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM collections WHERE mediaItemId = ?
    `);

    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find collections by title (partial match)
  findByTitle(titlePart: string): Collection[] {
    const stmt = this.db.prepare(`
      SELECT * FROM collections 
      WHERE title LIKE ? 
      ORDER BY title
    `);

    const rows = stmt.all(`%${titlePart}%`) as any[];
    return rows.map(row => this.mapRowToCollection(row));
  }

  // Count all collections
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM collections`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToCollection(row: any): Collection {
    const items = row.items ? JSON.parse(row.items) : [];
    const collectionItems = items.map(
      (item: any) =>
        new CollectionItem(
          item.mediaItemId,
          item.mediaItemTitle,
          item.sequence,
        ),
    );

    return new Collection(
      row.mediaItemId,
      row.title,
      row.description,
      collectionItems,
    );
  }
}

// Export singleton instance
export const collectionRepository = new CollectionRepository();
