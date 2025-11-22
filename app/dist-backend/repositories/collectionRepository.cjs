"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionRepository = exports.CollectionRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const collection_1 = require("../models/collection.cjs");
class CollectionRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Helper method to insert collection items into junction table
    insertCollectionItems(collectionId, items) {
        if (items.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO collection_items (collectionId, mediaItemId, mediaItemTitle, sequence)
      VALUES (?, ?, ?, ?)
    `);
        for (const item of items) {
            try {
                stmt.run(collectionId, item.mediaItemId, item.mediaItemTitle, item.sequence);
            }
            catch (error) {
                // Ignore duplicate key errors, but log other errors
                if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint failed')) {
                    console.error('Error inserting collection item:', error);
                }
            }
        }
    }
    // Helper method to load collection items from junction table
    loadCollectionItems(collectionId) {
        const stmt = this.db.prepare(`
      SELECT mediaItemId, mediaItemTitle, sequence
      FROM collection_items
      WHERE collectionId = ?
      ORDER BY sequence
    `);
        const rows = stmt.all(collectionId);
        return rows.map(row => new collection_1.CollectionItem(row.mediaItemId, row.mediaItemTitle, row.sequence));
    }
    // Helper method to delete collection items from junction table
    deleteCollectionItems(collectionId) {
        const stmt = this.db.prepare(`
      DELETE FROM collection_items WHERE collectionId = ?
    `);
        stmt.run(collectionId);
    }
    // Create a new collection
    create(collection) {
        const transaction = this.db.transaction(() => {
            // Insert the collection record
            const stmt = this.db.prepare(`
        INSERT INTO collections (mediaItemId, title, description)
        VALUES (?, ?, ?)
      `);
            stmt.run(collection.mediaItemId, collection.title, collection.description);
            // Insert collection items
            this.insertCollectionItems(collection.mediaItemId, collection.items);
            return this.findByMediaItemId(collection.mediaItemId);
        });
        return transaction();
    }
    // Find collection by mediaItemId
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT * FROM collections WHERE mediaItemId = ?
    `);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToCollection(row);
    }
    // Find all collections
    findAll() {
        const stmt = this.db.prepare(`
      SELECT * FROM collections ORDER BY title
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToCollection(row));
    }
    // Update collection
    update(mediaItemId, collection) {
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
            const result = stmt.run(collection.title, collection.description, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete existing items and insert new ones
            this.deleteCollectionItems(mediaItemId);
            this.insertCollectionItems(mediaItemId, collection.items);
            return this.findByMediaItemId(mediaItemId);
        });
        return transaction();
    }
    // Delete collection
    delete(mediaItemId) {
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
    findByTitle(titlePart) {
        const stmt = this.db.prepare(`
      SELECT * FROM collections 
      WHERE title LIKE ? 
      ORDER BY title
    `);
        const rows = stmt.all(`%${titlePart}%`);
        return rows.map(row => this.mapRowToCollection(row));
    }
    // Find collections that contain a specific media item
    findByMediaItem(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT c.*
      FROM collections c
      INNER JOIN collection_items ci ON c.mediaItemId = ci.collectionId
      WHERE ci.mediaItemId = ?
      ORDER BY c.title
    `);
        const rows = stmt.all(mediaItemId);
        return rows.map(row => this.mapRowToCollection(row));
    }
    // Count all collections
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM collections`);
        const result = stmt.get();
        return result.count;
    }
    // Get the next sequence number for a collection
    getNextSequence(collectionId) {
        const stmt = this.db.prepare(`
      SELECT MAX(sequence) as maxSequence FROM collection_items WHERE collectionId = ?
    `);
        const result = stmt.get(collectionId);
        return (result.maxSequence || 0) + 1;
    }
    // Reorder collection items
    reorderItems(collectionId, itemSequences) {
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
    mapRowToCollection(row) {
        const items = this.loadCollectionItems(row.mediaItemId);
        return new collection_1.Collection(row.mediaItemId, row.title, row.description, items);
    }
}
exports.CollectionRepository = CollectionRepository;
// Export singleton instance
exports.collectionRepository = new CollectionRepository();
