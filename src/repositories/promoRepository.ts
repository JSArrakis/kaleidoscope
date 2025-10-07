import { getDB } from '../db/sqlite';
import { Promo } from '../models/promo';
import { MediaTag } from '../models/const/tagTypes';
import { Tag } from '../models/tag';
import { tagRepository } from './tagsRepository';

export class PromoRepository {
  private get db() {
    return getDB();
  }

  // Create a new promo
  create(promo: Promo): Promo {
    const transaction = this.db.transaction(() => {
      // Insert promo record
      const stmt = this.db.prepare(`
        INSERT INTO promos (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        promo.title,
        promo.mediaItemId,
        promo.duration,
        promo.path,
        promo.type,
      );

      // Insert tag relationships
      this.insertPromoTags(promo.mediaItemId, promo.tags);

      return this.findByMediaItemId(promo.mediaItemId)!;
    });

    return transaction();
  }

  findByMediaItemId(mediaItemId: string): Promo | null {
    const stmt = this.db.prepare(`SELECT * FROM promos WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    const promo = this.mapRowToPromo(row);
    promo.tags = this.loadPromoTags(mediaItemId);
    return promo;
  }

  findAll(): Promo[] {
    const stmt = this.db.prepare(`SELECT * FROM promos ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map(row => {
      const promo = this.mapRowToPromo(row);
      promo.tags = this.loadPromoTags(promo.mediaItemId);
      return promo;
    });
  }

  update(mediaItemId: string, promo: Promo): Promo | null {
    const transaction = this.db.transaction(() => {
      // Update promo record
      const stmt = this.db.prepare(`
        UPDATE promos 
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        promo.title,
        promo.duration,
        promo.path,
        promo.type,
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Update tag relationships
      this.deletePromoTags(mediaItemId);
      this.insertPromoTags(mediaItemId, promo.tags);

      return this.findByMediaItemId(mediaItemId);
    });

    return transaction();
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM promos WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find promos by tags (accept MediaTag[] or string[])
  findByTags(tags: (MediaTag | string)[]): Promo[] {
    if (tags.length === 0) return [];

    const tagNames = tags.map(t =>
      typeof t === 'string' ? t : (t as any).name,
    );
    const placeholders = tagNames.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT p.* FROM promos p
      INNER JOIN promo_tags pt ON p.mediaItemId = pt.mediaItemId
      INNER JOIN tags t ON pt.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY p.title
    `);

    const rows = stmt.all(...tagNames) as any[];
    return rows.map(row => {
      const promo = this.mapRowToPromo(row);
      promo.tags = this.loadPromoTags(promo.mediaItemId);
      return promo;
    });
  }

  // Find promos by type
  findByType(type: number): Promo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM promos WHERE type = ? ORDER BY title
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => {
      const promo = this.mapRowToPromo(row);
      promo.tags = this.loadPromoTags(promo.mediaItemId);
      return promo;
    });
  }

  // Count all promos
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM promos`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToPromo(row: any): Promo {
    return new Promo(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      [], // Tags will be loaded separately
    );
  }

  // Helper method to insert promo tags
  private insertPromoTags(mediaItemId: string, tags: MediaTag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO promo_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tag of tags) {
      try {
        let tagId: string | undefined;
        if (typeof tag === 'string') {
          const found = tagRepository.findByNameIgnoreCase(tag);
          tagId = found ? found.tagId : undefined;
        } else if ((tag as any).tagId) {
          tagId = (tag as any).tagId;
        }

        if (!tagId) {
          console.warn(`Skipping unknown tag for promo ${mediaItemId}:`, tag);
          continue;
        }

        stmt.run(mediaItemId, tagId);
      } catch (error) {
        // Skip duplicates
        console.warn(`Failed to insert tag for promo ${mediaItemId}:`, error);
      }
    }
  }

  // Helper method to load promo tags
  private loadPromoTags(mediaItemId: string): MediaTag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN promo_tags pt ON t.tagId = pt.tagId
      WHERE pt.mediaItemId = ?
    `);

    const rows = stmt.all(mediaItemId) as any[];
    return rows.map(
      row =>
        new Tag(
          row.tagId,
          row.name,
          row.type,
          row.holidayDates ? JSON.parse(row.holidayDates) : undefined,
          row.exclusionGenres ? JSON.parse(row.exclusionGenres) : undefined,
          row.seasonStartDate,
          row.seasonEndDate,
          row.sequence,
        ),
    );
  }

  // Helper method to delete promo tags
  private deletePromoTags(mediaItemId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM promo_tags WHERE mediaItemId = ?
    `);
    stmt.run(mediaItemId);
  }
}

export const promoRepository = new PromoRepository();
