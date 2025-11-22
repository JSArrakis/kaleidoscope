"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bumperRepository = exports.BumperRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const bumper_1 = require("../models/bumper.cjs");
const tagsRepository_1 = require("./tagsRepository.cjs");
class BumperRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Helper method to insert bumper tags into junction table
    insertBumperTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO bumper_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);
        for (const tag of tags) {
            try {
                let tagId;
                if (typeof tag === 'string') {
                    const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(tag);
                    tagId = found ? found.tagId : undefined;
                }
                else if (tag.tagId) {
                    tagId = tag.tagId;
                }
                if (!tagId) {
                    console.warn(`Skipping unknown tag for bumper ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId);
            }
            catch (error) {
                // Ignore duplicate key errors, but log other errors
                if (!(error instanceof Error) ||
                    !error.message.includes('UNIQUE constraint failed')) {
                    console.error('Error inserting bumper tag:', error);
                }
            }
        }
    }
    // Helper method to load bumper tags from junction table
    loadBumperTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN bumper_tags bt ON t.tagId = bt.tagId
      WHERE bt.mediaItemId = ?
    `);
        return stmt.all(mediaItemId);
    }
    // Helper method to delete bumper tags from junction table
    deleteBumperTags(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM bumper_tags WHERE mediaItemId = ?
    `);
        stmt.run(mediaItemId);
    }
    // Create a new bumper
    create(bumper) {
        const transaction = this.db.transaction(() => {
            // Insert the bumper record
            const stmt = this.db.prepare(`
        INSERT INTO bumpers (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(bumper.title, bumper.mediaItemId, bumper.duration, bumper.path, bumper.type);
            // Insert bumper tags
            this.insertBumperTags(bumper.mediaItemId, bumper.tags);
            return this.findByMediaItemId(bumper.mediaItemId);
        });
        return transaction();
    }
    // Create multiple bumpers in a transaction
    createMany(bumpers) {
        const transaction = this.db.transaction(() => {
            const results = [];
            const stmt = this.db.prepare(`
        INSERT INTO bumpers (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);
            for (const bumper of bumpers) {
                try {
                    stmt.run(bumper.title, bumper.mediaItemId, bumper.duration, bumper.path, bumper.type);
                    // Insert bumper tags
                    this.insertBumperTags(bumper.mediaItemId, bumper.tags);
                    const created = this.findByMediaItemId(bumper.mediaItemId);
                    if (created)
                        results.push(created);
                }
                catch (error) {
                    // Skip duplicates or other errors
                    console.warn(`Failed to insert bumper ${bumper.mediaItemId}:`, error);
                }
            }
            return results;
        });
        return transaction();
    }
    // Find bumper by mediaItemId
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT * FROM bumpers WHERE mediaItemId = ?
    `);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToBumper(row);
    }
    // Find all bumpers
    findAll() {
        const stmt = this.db.prepare(`
      SELECT * FROM bumpers ORDER BY title
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToBumper(row));
    }
    // Update bumper
    update(mediaItemId, bumper) {
        const transaction = this.db.transaction(() => {
            // Update the bumper record
            const stmt = this.db.prepare(`
        UPDATE bumpers
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(bumper.title, bumper.duration, bumper.path, bumper.type, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete existing tags and insert new ones
            this.deleteBumperTags(mediaItemId);
            this.insertBumperTags(mediaItemId, bumper.tags);
            return this.findByMediaItemId(mediaItemId);
        });
        return transaction();
    }
    // Delete bumper
    delete(mediaItemId) {
        const transaction = this.db.transaction(() => {
            // Delete tags first (will cascade, but explicit is better)
            this.deleteBumperTags(mediaItemId);
            // Delete the bumper record
            const stmt = this.db.prepare(`
        DELETE FROM bumpers WHERE mediaItemId = ?
      `);
            const result = stmt.run(mediaItemId);
            return result.changes > 0;
        });
        return transaction();
    }
    // Find bumpers by tags using SQL joins (accept Tag[] or string[])
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const tagNames = tags.map(t => (typeof t === 'string' ? t : t.name));
        const placeholders = tagNames.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT b.*
      FROM bumpers b
      INNER JOIN bumper_tags bt ON b.mediaItemId = bt.mediaItemId
      INNER JOIN tags t ON bt.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY b.title
    `);
        const rows = stmt.all(...tagNames);
        return rows.map(row => this.mapRowToBumper(row));
    }
    // Find bumpers by type
    findByType(type) {
        const stmt = this.db.prepare(`
      SELECT * FROM bumpers WHERE type = ? ORDER BY title
    `);
        const rows = stmt.all(type);
        return rows.map(row => this.mapRowToBumper(row));
    }
    // Count all bumpers
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM bumpers`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToBumper(row) {
        return new bumper_1.Bumper(row.title, row.mediaItemId, row.duration, row.path, row.type, this.loadBumperTags(row.mediaItemId));
    }
}
exports.BumperRepository = BumperRepository;
// Export singleton instance
exports.bumperRepository = new BumperRepository();
