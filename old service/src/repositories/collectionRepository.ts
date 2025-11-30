import { getDB } from '../db/sqlite';
import { Collection, CollectionItem } from '../models/collection';

export class CollectionRepository {
  private get db() {
    return getDB();
  }

  // Helper method to insert collection items into junction table
  private insertCollectionItems(collectionId: string, items: CollectionItem[]): void {
    if (items.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO collection_items (collectionId, mediaItemId, mediaItemTitle, sequence)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      try {
        stmt.run(collectionId, item.mediaItemId, item.mediaItemTitle, item.sequence);
      } catch (error) {
        // Ignore duplicate key errors, but log other errors
        if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint failed')) {
          console.error('Error inserting collection item:', error);
        }
      }
    }
  }

  // Helper method to load collection items from junction table
  private loadCollectionItems(collectionId: string): CollectionItem[] {
    const stmt = this.db.prepare(`
      SELECT mediaItemId, mediaItemTitle, sequence
      FROM collection_items
      WHERE collectionId = ?
      ORDER BY sequence
    `);

    const rows = stmt.all(collectionId) as any[];
    return rows.map(row => new CollectionItem(
      row.mediaItemId,
      row.mediaItemTitle,
      row.sequence
    ));
  }

  // Helper method to delete collection items from junction table
  private deleteCollectionItems(collectionId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM collection_items WHERE collectionId = ?
    `);
    stmt.run(collectionId);
  }

  // Create a new collection
  create(collection: Collection): Collection {
    const transaction = this.db.transaction(() => {
      // Insert the collection record
      const stmt = this.db.prepare(`
        INSERT INTO collections (mediaItemId, title, description)
        VALUES (?, ?, ?)
      `);

      stmt.run(
        collection.mediaItemId,
        collection.title,
        collection.description,
      );

      // Insert collection items
      this.insertCollectionItems(collection.mediaItemId, collection.items);

      return this.findByMediaItemId(collection.mediaItemId)!;
    });

    return transaction();
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
    const transaction = this.db.transaction(() => {
      // Update the collection record
      const stmt = this.db.prepare(`
        UPDATE collections 
        SET title = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
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
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Delete existing items and insert new ones
      this.deleteCollectionItems(mediaItemId);
      this.insertCollectionItems(mediaItemId, collection.items);

      return this.findByMediaItemId(mediaItemId);
    });

    return transaction();
  }

  // Delete collection
  delete(mediaItemId: string): boolean {
    const transaction = this.db.transaction(() => {
      // Delete items first (will cascade, but explicit is better)
      this.deleteCollectionItems(mediaItemId);

      // Delete the collection record
      const stmt = this.db.prepare(`
        DELETE FROM collections WHERE mediaItemId = ?
      `);

      const result = stmt.run(mediaItemId);
      return result.changes > 0;
    });

    return transaction();
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

  // Find collections that contain a specific media item
  findByMediaItem(mediaItemId: string): Collection[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.*
      FROM collections c
      INNER JOIN collection_items ci ON c.mediaItemId = ci.collectionId
      WHERE ci.mediaItemId = ?
      ORDER BY c.title
    `);

    const rows = stmt.all(mediaItemId) as any[];
    return rows.map(row => this.mapRowToCollection(row));
  }

  // Count all collections
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM collections`);
    const result = stmt.get() as any;
    return result.count;
  }

  // Get the next sequence number for a collection
  getNextSequence(collectionId: string): number {
    const stmt = this.db.prepare(`
      SELECT MAX(sequence) as maxSequence FROM collection_items WHERE collectionId = ?
    `);
    const result = stmt.get(collectionId) as any;
    return (result.maxSequence || 0) + 1;
  }

  // Reorder collection items
  reorderItems(collectionId: string, itemSequences: { mediaItemId: string; sequence: number }[]): boolean {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE collection_items 
        SET sequence = ? 
        WHERE collectionId = ? AND mediaItemId = ?
      `);

      for (const item of itemSequences) {
        stmt.run(item.sequence, collectionId, item.mediaItemId);
      }
      
      return true;
    });

    return transaction();
  }

  private mapRowToCollection(row: any): Collection {
    const items = this.loadCollectionItems(row.mediaItemId);

    return new Collection(
      row.mediaItemId,
      row.title,
      row.description,
      items,
    );
  }
}

// Export singleton instance
export const collectionRepository = new CollectionRepository();
