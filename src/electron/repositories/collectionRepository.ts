import { getDB } from "../db/sqlite.js";

export class CollectionRepository {
  private get db() {
    return getDB();
  }

  create(collection: Collection): Collection {
    const transaction = this.db.transaction(() => {
      const collectionStmt = this.db.prepare(`
        INSERT INTO collections (collectionId, title, description, itemCount)
        VALUES (?, ?, ?, ?)
      `);

      collectionStmt.run(
        collection.collectionId,
        collection.title,
        collection.description || null,
        collection.itemCount
      );

      if (collection.items.length > 0) {
        const itemStmt = this.db.prepare(`
          INSERT INTO collection_items (collectionItemId, collectionId, mediaItemId, sequence)
          VALUES (?, ?, ?, ?)
        `);

        for (const item of collection.items) {
          itemStmt.run(
            item.collectionItemId,
            collection.collectionId,
            item.mediaItemId,
            item.sequence
          );
        }
      }
    });

    transaction();
    return this.findByCollectionId(collection.collectionId)!;
  }

  findByCollectionId(collectionId: string): Collection | null {
    const stmt = this.db.prepare(
      `SELECT * FROM collections WHERE collectionId = ?`
    );
    const row = stmt.get(collectionId) as any;
    if (!row) return null;
    return this.mapRowToCollection(row);
  }

  findAll(): Collection[] {
    const stmt = this.db.prepare(`SELECT * FROM collections ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToCollection(row));
  }

  findItemsByCollectionId(collectionId: string): CollectionItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM collection_items 
      WHERE collectionId = ? 
      ORDER BY sequence
    `);
    const rows = stmt.all(collectionId) as any[];
    return rows.map((row) => this.mapRowToCollectionItem(row));
  }

  addItemToCollection(
    collectionItemId: string,
    collectionId: string,
    mediaItemId: string,
    sequence: number
  ): CollectionItem {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO collection_items (collectionItemId, collectionId, mediaItemId, sequence)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(collectionItemId, collectionId, mediaItemId, sequence);

      // Update item count
      this.db
        .prepare(
          `UPDATE collections SET itemCount = itemCount + 1 WHERE collectionId = ?`
        )
        .run(collectionId);
    });

    transaction();
    return this.findCollectionItemById(collectionItemId)!;
  }

  removeItemFromCollection(collectionItemId: string): boolean {
    const transaction = this.db.transaction(() => {
      const itemStmt = this.db.prepare(
        `SELECT collectionId FROM collection_items WHERE collectionItemId = ?`
      );
      const item = itemStmt.get(collectionItemId) as any;

      if (!item) return false;

      const deleteStmt = this.db.prepare(
        `DELETE FROM collection_items WHERE collectionItemId = ?`
      );
      const result = deleteStmt.run(collectionItemId);

      if (result.changes > 0) {
        this.db
          .prepare(
            `UPDATE collections SET itemCount = itemCount - 1 WHERE collectionId = ?`
          )
          .run(item.collectionId);
        return true;
      }

      return false;
    });

    return transaction();
  }

  updateCollectionItem(
    collectionItemId: string,
    sequence: number
  ): CollectionItem | null {
    const stmt = this.db.prepare(`
      UPDATE collection_items 
      SET sequence = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE collectionItemId = ?
    `);

    const result = stmt.run(sequence, collectionItemId);
    if (result.changes === 0) return null;

    return this.findCollectionItemById(collectionItemId);
  }

  updateCollection(
    collectionId: string,
    collection: Collection
  ): Collection | null {
    const stmt = this.db.prepare(`
      UPDATE collections 
      SET title = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE collectionId = ?
    `);

    const result = stmt.run(
      collection.title,
      collection.description || null,
      collectionId
    );
    if (result.changes === 0) return null;

    return this.findByCollectionId(collectionId);
  }

  deleteCollection(collectionId: string): boolean {
    const transaction = this.db.transaction(() => {
      this.db
        .prepare(`DELETE FROM collection_items WHERE collectionId = ?`)
        .run(collectionId);
      const stmt = this.db.prepare(
        `DELETE FROM collections WHERE collectionId = ?`
      );
      const result = stmt.run(collectionId);
      return result.changes > 0;
    });

    return transaction();
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM collections`);
    const result = stmt.get() as any;
    return result.count;
  }

  private findCollectionItemById(
    collectionItemId: string
  ): CollectionItem | null {
    const stmt = this.db.prepare(
      `SELECT * FROM collection_items WHERE collectionItemId = ?`
    );
    const row = stmt.get(collectionItemId) as any;
    if (!row) return null;
    return this.mapRowToCollectionItem(row);
  }

  private mapRowToCollection(row: any): Collection {
    const items = this.findItemsByCollectionId(row.collectionId);

    return {
      collectionId: row.collectionId,
      title: row.title,
      description: row.description,
      itemCount: row.itemCount,
      items,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapRowToCollectionItem(row: any): CollectionItem {
    return {
      collectionItemId: row.collectionItemId,
      collectionId: row.collectionId,
      mediaItemId: row.mediaItemId,
      sequence: row.sequence,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const collectionRepository = new CollectionRepository();
