"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commercialRepository = exports.CommercialRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const commercial_1 = require("../models/commercial.cjs");
const tag_1 = require("../models/tag.cjs");
const tagsRepository_1 = require("./tagsRepository.cjs");
class CommercialRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new commercial
    create(commercial) {
        const transaction = this.db.transaction(() => {
            // Insert commercial record
            const stmt = this.db.prepare(`
        INSERT INTO commercials (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(commercial.title, commercial.mediaItemId, commercial.duration, commercial.path, commercial.type);
            // Insert tag relationships
            this.insertCommercialTags(commercial.mediaItemId, commercial.tags);
            return this.findByMediaItemId(commercial.mediaItemId);
        });
        return transaction();
    }
    // Create multiple commercials in a transaction
    createMany(commercials) {
        const transaction = this.db.transaction((commercialsToInsert) => {
            const results = [];
            for (const commercial of commercialsToInsert) {
                try {
                    // Insert commercial record
                    const stmt = this.db.prepare(`
            INSERT INTO commercials (title, mediaItemId, duration, path, type)
            VALUES (?, ?, ?, ?, ?)
          `);
                    stmt.run(commercial.title, commercial.mediaItemId, commercial.duration, commercial.path, commercial.type);
                    // Insert tag relationships
                    this.insertCommercialTags(commercial.mediaItemId, commercial.tags);
                    const created = this.findByMediaItemId(commercial.mediaItemId);
                    if (created)
                        results.push(created);
                }
                catch (error) {
                    // Skip duplicates or other errors
                    console.warn(`Failed to insert commercial ${commercial.mediaItemId}:`, error);
                }
            }
            return results;
        });
        return transaction(commercials);
    }
    // Find commercial by mediaItemId
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE mediaItemId = ?
    `);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        const commercial = this.mapRowToCommercial(row);
        commercial.tags = this.loadCommercialTags(mediaItemId);
        return commercial;
    }
    // Find all commercials
    findAll() {
        const stmt = this.db.prepare(`
      SELECT * FROM commercials ORDER BY title
    `);
        const rows = stmt.all();
        return rows.map(row => {
            const commercial = this.mapRowToCommercial(row);
            commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
            return commercial;
        });
    }
    // Update commercial
    update(mediaItemId, commercial) {
        const transaction = this.db.transaction(() => {
            // Update commercial record
            const stmt = this.db.prepare(`
        UPDATE commercials 
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(commercial.title, commercial.duration, commercial.path, commercial.type, mediaItemId);
            if (result.changes === 0)
                return null;
            // Update tag relationships
            this.deleteCommercialTags(mediaItemId);
            this.insertCommercialTags(mediaItemId, commercial.tags);
            return this.findByMediaItemId(mediaItemId);
        });
        return transaction();
    }
    // Delete commercial
    delete(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM commercials WHERE mediaItemId = ?
    `);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    // Find commercials by tags
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const tagNames = tags.map(t => typeof t === 'string' ? t : t.name);
        const placeholders = tagNames.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM commercials c
      INNER JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      INNER JOIN tags t ON ct.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY c.title
    `);
        const rows = stmt.all(...tagNames);
        return rows.map(row => {
            const commercial = this.mapRowToCommercial(row);
            commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
            return commercial;
        });
    }
    // Find commercials by type
    findByType(type) {
        const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE type = ? ORDER BY title
    `);
        const rows = stmt.all(type);
        return rows.map(row => {
            const commercial = this.mapRowToCommercial(row);
            commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
            return commercial;
        });
    }
    // Count all commercials
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToCommercial(row) {
        return new commercial_1.Commercial(row.title, row.mediaItemId, row.duration, row.path, row.type, []);
    }
    // Helper method to insert commercial tags
    insertCommercialTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO commercial_tags (mediaItemId, tagId)
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
                    console.warn(`Skipping unknown tag for commercial ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId);
            }
            catch (error) {
                // Skip duplicates
                console.warn(`Failed to insert tag for commercial ${mediaItemId}:`, error);
            }
        }
    }
    // Helper method to load commercial tags
    loadCommercialTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN commercial_tags ct ON t.tagId = ct.tagId
      WHERE ct.mediaItemId = ?
    `);
        const rows = stmt.all(mediaItemId);
        return rows.map(row => new tag_1.Tag(row.tagId, row.name, row.type, row.holidayDates ? JSON.parse(row.holidayDates) : undefined, row.exclusionGenres ? JSON.parse(row.exclusionGenres) : undefined, row.seasonStartDate, row.seasonEndDate, row.sequence));
    }
    // Helper method to delete commercial tags
    deleteCommercialTags(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM commercial_tags WHERE mediaItemId = ?
    `);
        stmt.run(mediaItemId);
    }
    // Find commercials by Genre and Aesthetic tags for buffer selection, excluding recently used commercials
    findBufferCommercialsByTags(tags, hoursBack = 2) {
        if (tags.length === 0)
            return [];
        const tagNames = tags.map(t => typeof t === 'string' ? t : t.name);
        const tagPlaceholders = tagNames.map(() => '?').join(',');
        // Use NOT EXISTS for efficient exclusion of recently used commercials
        const query = `
      SELECT DISTINCT c.* FROM commercials c
      INNER JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      INNER JOIN tags t ON ct.tagId = t.tagId
      WHERE t.name IN (${tagPlaceholders}) 
      AND t.type IN ('Genre', 'Aesthetic')
      AND NOT EXISTS (
        SELECT 1 FROM recently_used_commercials ruc 
        WHERE ruc.mediaItemId = c.mediaItemId 
        AND ruc.usageContext = 'buffer'
        AND (ruc.expiresAt IS NULL OR ruc.expiresAt > datetime('now'))
        AND ruc.usedAt > datetime('now', '-${hoursBack} hours')
      )
      ORDER BY RANDOM()
    `;
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...tagNames);
        return rows.map(row => {
            const commercial = this.mapRowToCommercial(row);
            commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
            return commercial;
        });
    }
}
exports.CommercialRepository = CommercialRepository;
// Export singleton instance
exports.commercialRepository = new CommercialRepository();
