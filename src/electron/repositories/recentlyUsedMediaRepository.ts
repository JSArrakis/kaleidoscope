import { getDB } from "../db/sqlite.js";

export class RecentlyUsedMediaRepository {
  private get db() {
    return getDB();
  }

  create(media: RecentlyUsedMedia): RecentlyUsedMedia {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO recently_used_media (recentlyUsedMediaId, mediaItemId, mediaType, lastUsedDate, usageCount, expirationDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        media.recentlyUsedMediaId,
        media.mediaItemId,
        media.mediaType,
        media.lastUsedDate,
        media.usageCount,
        media.expirationDate || null
      );
    });

    transaction();
    return this.findById(media.recentlyUsedMediaId)!;
  }

  findById(recentlyUsedMediaId: string): RecentlyUsedMedia | null {
    const stmt = this.db.prepare(
      `SELECT * FROM recently_used_media WHERE recentlyUsedMediaId = ?`
    );
    const row = stmt.get(recentlyUsedMediaId) as any;
    if (!row) return null;
    return this.mapRowToMedia(row);
  }

  findByMediaItemId(mediaItemId: string): RecentlyUsedMedia | null {
    const stmt = this.db.prepare(
      `SELECT * FROM recently_used_media WHERE mediaItemId = ? LIMIT 1`
    );
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToMedia(row);
  }

  findByMediaType(mediaType: string): RecentlyUsedMedia[] {
    const stmt = this.db.prepare(
      `SELECT * FROM recently_used_media WHERE mediaType = ? ORDER BY lastUsedDate DESC`
    );
    const rows = stmt.all(mediaType) as any[];
    return rows.map((row) => this.mapRowToMedia(row));
  }

  findAll(): RecentlyUsedMedia[] {
    const stmt = this.db.prepare(
      `SELECT * FROM recently_used_media ORDER BY lastUsedDate DESC`
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToMedia(row));
  }

  findNonExpired(): RecentlyUsedMedia[] {
    const stmt = this.db.prepare(`
      SELECT * FROM recently_used_media 
      WHERE expirationDate IS NULL OR expirationDate > CURRENT_TIMESTAMP
      ORDER BY lastUsedDate DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToMedia(row));
  }

  findExpired(): RecentlyUsedMedia[] {
    const stmt = this.db.prepare(`
      SELECT * FROM recently_used_media 
      WHERE expirationDate IS NOT NULL AND expirationDate <= CURRENT_TIMESTAMP
      ORDER BY expirationDate ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToMedia(row));
  }

  incrementUsage(recentlyUsedMediaId: string): RecentlyUsedMedia | null {
    const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET usageCount = usageCount + 1, lastUsedDate = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);

    const result = stmt.run(recentlyUsedMediaId);
    if (result.changes === 0) return null;

    return this.findById(recentlyUsedMediaId);
  }

  recordUsage(
    mediaItemId: string,
    mediaType: string,
    expirationDate?: string
  ): RecentlyUsedMedia {
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
      return this.findById(existing.recentlyUsedMediaId)!;
    } else {
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

  setExpiration(
    recentlyUsedMediaId: string,
    expirationDate: string
  ): RecentlyUsedMedia | null {
    const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET expirationDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);

    const result = stmt.run(expirationDate, recentlyUsedMediaId);
    if (result.changes === 0) return null;

    return this.findById(recentlyUsedMediaId);
  }

  clearExpiration(recentlyUsedMediaId: string): RecentlyUsedMedia | null {
    const stmt = this.db.prepare(`
      UPDATE recently_used_media 
      SET expirationDate = NULL, updatedAt = CURRENT_TIMESTAMP
      WHERE recentlyUsedMediaId = ?
    `);

    const result = stmt.run(recentlyUsedMediaId);
    if (result.changes === 0) return null;

    return this.findById(recentlyUsedMediaId);
  }

  delete(recentlyUsedMediaId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM recently_used_media WHERE recentlyUsedMediaId = ?`
    );
    const result = stmt.run(recentlyUsedMediaId);
    return result.changes > 0;
  }

  deleteExpired(): number {
    const stmt = this.db.prepare(`
      DELETE FROM recently_used_media 
      WHERE expirationDate IS NOT NULL AND expirationDate <= CURRENT_TIMESTAMP
    `);
    const result = stmt.run();
    return result.changes;
  }

  count(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM recently_used_media`
    );
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToMedia(row: any): RecentlyUsedMedia {
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
