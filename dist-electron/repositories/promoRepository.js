import { getDB } from "../db/sqlite.js";
export class PromoRepository {
    get db() {
        return getDB();
    }
    create(promo) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO promos (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(promo.title, promo.mediaItemId, promo.duration || null, promo.path);
            this.insertTags(promo.mediaItemId, promo.tags);
        });
        transaction();
        return this.findByMediaItemId(promo.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM promos WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToPromo(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM promos ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToPromo(row));
    }
    findRandomPromo() {
        const stmt = this.db.prepare(`SELECT * FROM promos ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToPromo(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT p.* FROM promos p
      JOIN promo_tags pt ON p.mediaItemId = pt.mediaItemId
      WHERE pt.tagId = ?
      ORDER BY p.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToPromo(row));
    }
    update(mediaItemId, promo) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE promos 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(promo.title, promo.duration || null, promo.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM promo_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, promo.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM promos WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM promos`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO promo_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    mapRowToPromo(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN promo_tags pt ON t.tagId = pt.tagId
      WHERE pt.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
        const tags = tagRows.map((tagRow) => ({
            tagId: tagRow.tagId,
            name: tagRow.name,
            type: tagRow.type,
            seasonStartDate: tagRow.seasonStartDate,
            seasonEndDate: tagRow.seasonEndDate,
            explicitlyHoliday: tagRow.explicitlyHoliday === 1,
            sequence: tagRow.sequence,
        }));
        return {
            mediaItemId: row.mediaItemId,
            title: row.title,
            path: row.path,
            duration: row.duration,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const promoRepository = new PromoRepository();
