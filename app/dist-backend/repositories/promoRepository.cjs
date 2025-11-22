"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoRepository = exports.PromoRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const promo_1 = require("../models/promo.cjs");
const tag_1 = require("../models/tag.cjs");
const tagsRepository_1 = require("./tagsRepository.cjs");
class PromoRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new promo
    create(promo) {
        const transaction = this.db.transaction(() => {
            // Insert promo record
            const stmt = this.db.prepare(`
        INSERT INTO promos (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(promo.title, promo.mediaItemId, promo.duration, promo.path, promo.type);
            // Insert tag relationships
            this.insertPromoTags(promo.mediaItemId, promo.tags);
            return this.findByMediaItemId(promo.mediaItemId);
        });
        return transaction();
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM promos WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        const promo = this.mapRowToPromo(row);
        promo.tags = this.loadPromoTags(mediaItemId);
        return promo;
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM promos ORDER BY title`);
        const rows = stmt.all();
        return rows.map(row => {
            const promo = this.mapRowToPromo(row);
            promo.tags = this.loadPromoTags(promo.mediaItemId);
            return promo;
        });
    }
    update(mediaItemId, promo) {
        const transaction = this.db.transaction(() => {
            // Update promo record
            const stmt = this.db.prepare(`
        UPDATE promos 
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(promo.title, promo.duration, promo.path, promo.type, mediaItemId);
            if (result.changes === 0)
                return null;
            // Update tag relationships
            this.deletePromoTags(mediaItemId);
            this.insertPromoTags(mediaItemId, promo.tags);
            return this.findByMediaItemId(mediaItemId);
        });
        return transaction();
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM promos WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    // Find promos by tags (accept Tag[] or string[])
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const tagNames = tags.map(t => typeof t === 'string' ? t : t.name);
        const placeholders = tagNames.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT p.* FROM promos p
      INNER JOIN promo_tags pt ON p.mediaItemId = pt.mediaItemId
      INNER JOIN tags t ON pt.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY p.title
    `);
        const rows = stmt.all(...tagNames);
        return rows.map(row => {
            const promo = this.mapRowToPromo(row);
            promo.tags = this.loadPromoTags(promo.mediaItemId);
            return promo;
        });
    }
    // Find promos by type
    findByType(type) {
        const stmt = this.db.prepare(`
      SELECT * FROM promos WHERE type = ? ORDER BY title
    `);
        const rows = stmt.all(type);
        return rows.map(row => {
            const promo = this.mapRowToPromo(row);
            promo.tags = this.loadPromoTags(promo.mediaItemId);
            return promo;
        });
    }
    // Count all promos
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM promos`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToPromo(row) {
        return new promo_1.Promo(row.title, row.mediaItemId, row.duration, row.path, row.type, []);
    }
    // Helper method to insert promo tags
    insertPromoTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO promo_tags (mediaItemId, tagId)
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
                    console.warn(`Skipping unknown tag for promo ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId);
            }
            catch (error) {
                // Skip duplicates
                console.warn(`Failed to insert tag for promo ${mediaItemId}:`, error);
            }
        }
    }
    // Helper method to load promo tags
    loadPromoTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN promo_tags pt ON t.tagId = pt.tagId
      WHERE pt.mediaItemId = ?
    `);
        const rows = stmt.all(mediaItemId);
        return rows.map(row => new tag_1.Tag(row.tagId, row.name, row.type, row.holidayDates ? JSON.parse(row.holidayDates) : undefined, row.exclusionGenres ? JSON.parse(row.exclusionGenres) : undefined, row.seasonStartDate, row.seasonEndDate, row.sequence));
    }
    // Helper method to delete promo tags
    deletePromoTags(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM promo_tags WHERE mediaItemId = ?
    `);
        stmt.run(mediaItemId);
    }
}
exports.PromoRepository = PromoRepository;
exports.promoRepository = new PromoRepository();
