import { getDB } from "../db/sqlite.js";
export class RecentlyUsedMediaRepository {
    get db() {
        return getDB();
    }
    create(media) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO recently_used_media (recentlyUsedMediaId, mediaItemId, mediaType, lastUsedDate, usageCount, expirationDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            stmt.run(media.recentlyUsedMediaId, media.mediaItemId, media.mediaType, media.lastUsedDate, media.usageCount, media.expirationDate || null);
        });
        transaction();
        return this.findById(media.recentlyUsedMediaId);
    }
    findById(recentlyUsedMediaId) {
        const stmt = this.db.prepare(`SELECT * FROM recently_used_media WHERE recentlyUsedMediaId = ?`);
        const row = stmt.get(recentlyUsedMediaId);
        if (!row)
            return null;
        return this.mapRowToMedia(row);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM recently_used_media WHERE mediaItemId = ? LIMIT 1`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToMedia(row);
    }
    findByMediaType(mediaType) {
        const stmt = this.db.prepare(`SELECT * FROM recently_used_media WHERE mediaType = ? ORDER BY lastUsedDate DESC`);
        const rows = stmt.all(mediaType);
        return rows.map((row) => this.mapRowToMedia(row));
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM recently_used_media ORDER BY lastUsedDate DESC`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMedia(row));
    }
    findNonExpired() {
        const stmt = this.db.prepare(`
      SELECT * FROM recently_used_media 
      WHERE expirationDate IS NULL OR expirationDate > CURRENT_TIMESTAMP
      ORDER BY lastUsedDate DESC
    `);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMedia(row));
    }
    findExpired() {
        const stmt = this.db.prepare(`
      SELECT * FROM recently_used_media 
      WHERE expirationDate IS NOT NULL AND expirationDate <= CURRENT_TIMESTAMP
      ORDER BY expirationDate ASC
    `);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMedia(row));
    }
    incrementUsage(recentlyUsedMediaId) {
        const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET usageCount = usageCount + 1, lastUsedDate = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);
        const result = stmt.run(recentlyUsedMediaId);
        if (result.changes === 0)
            return null;
        return this.findById(recentlyUsedMediaId);
    }
    recordUsage(mediaItemId, mediaType, expirationDate) {
        const existing = this.findByMediaItemId(mediaItemId);
        if (existing) {
            // Update existing record
            const stmt = this.db.prepare(`
        UPDATE recently_used_media 
        SET usageCount = usageCount + 1, lastUsedDate = CURRENT_TIMESTAMP, 
            expirationDate = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE recentlyUsedMediaId = ?
      `);
            stmt.run(expirationDate || null, existing.recentlyUsedMediaId);
            return this.findById(existing.recentlyUsedMediaId);
        }
        else {
            // Create new record
            const id = `rum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return this.create({
                recentlyUsedMediaId: id,
                mediaItemId,
                mediaType,
                lastUsedDate: new Date().toISOString(),
                usageCount: 1,
                expirationDate: expirationDate || undefined,
            });
        }
    }
    setExpiration(recentlyUsedMediaId, expirationDate) {
        const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET expirationDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);
        const result = stmt.run(expirationDate, recentlyUsedMediaId);
        if (result.changes === 0)
            return null;
        return this.findById(recentlyUsedMediaId);
    }
    clearExpiration(recentlyUsedMediaId) {
        const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET expirationDate = NULL, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);
        const result = stmt.run(recentlyUsedMediaId);
        if (result.changes === 0)
            return null;
        return this.findById(recentlyUsedMediaId);
    }
    delete(recentlyUsedMediaId) {
        const stmt = this.db.prepare(`DELETE FROM recently_used_media WHERE recentlyUsedMediaId = ?`);
        const result = stmt.run(recentlyUsedMediaId);
        return result.changes > 0;
    }
    deleteExpired() {
        const stmt = this.db.prepare(`
      DELETE FROM recently_used_media 
      WHERE expirationDate IS NOT NULL AND expirationDate <= CURRENT_TIMESTAMP
    `);
        const result = stmt.run();
        return result.changes;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM recently_used_media`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToMedia(row) {
        return {
            recentlyUsedMediaId: row.recentlyUsedMediaId,
            mediaItemId: row.mediaItemId,
            mediaType: row.mediaType,
            lastUsedDate: row.lastUsedDate,
            usageCount: row.usageCount,
            expirationDate: row.expirationDate,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const recentlyUsedMediaRepository = new RecentlyUsedMediaRepository();
