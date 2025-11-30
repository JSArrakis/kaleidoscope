import { getDB } from '../db/sqlite';
import { Short } from '../models/short';
import { Tag } from '../models/tag';
import { tagRepository } from './tagsRepository';
import { tagNamesFrom } from '../prisms/core';
import { recentlyUsedMediaRepository } from './recentlyUsedMediaRepository';

export class ShortRepository {
  private get db() {
    return getDB();
  }

  // Create a new short
  create(short: Short): Short {
    const transaction = this.db.transaction(() => {
      // Insert short record
      const stmt = this.db.prepare(`
        INSERT INTO shorts (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        short.title,
        short.mediaItemId,
        short.duration,
        short.path,
        short.type,
      );

      // Insert tag relationships
      this.insertShortTags(short.mediaItemId, short.tags);

      return this.findByMediaItemId(short.mediaItemId)!;
    });

    return transaction();
  }

  findByMediaItemId(mediaItemId: string): Short | null {
    const stmt = this.db.prepare(`SELECT * FROM shorts WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    const short = this.mapRowToShort(row);
    short.tags = this.loadShortTags(mediaItemId);
    return short;
  }

  findAll(): Short[] {
    const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map(row => {
      const short = this.mapRowToShort(row);
      short.tags = this.loadShortTags(short.mediaItemId);
      return short;
    });
  }

  update(mediaItemId: string, short: Short): Short | null {
    const transaction = this.db.transaction(() => {
      // Update short record
      const stmt = this.db.prepare(`
        UPDATE shorts 
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        short.title,
        short.duration,
        short.path,
        short.type,
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Update tag relationships
      this.deleteShortTags(mediaItemId);
      this.insertShortTags(mediaItemId, short.tags);

      return this.findByMediaItemId(mediaItemId);
    });

    return transaction();
  }

  // Delete short
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM shorts WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find shorts by tags (accept Tag[] and map to tag names)
  findByTags(tags: Tag[]): Short[] {
    if (tags.length === 0) return [];

    const tagNames = tagNamesFrom(tags);
    const placeholders = tagNames.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shorts s
      INNER JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      INNER JOIN tags t ON st.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY s.title
    `);

    const rows = stmt.all(...tagNames) as any[];
    return rows.map(row => {
      const short = this.mapRowToShort(row);
      short.tags = this.loadShortTags(short.mediaItemId);
      return short;
    });
  }

  // Find shorts by type
  findByType(type: number): Short[] {
    const stmt = this.db.prepare(`
      SELECT * FROM shorts WHERE type = ? ORDER BY title
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => {
      const short = this.mapRowToShort(row);
      short.tags = this.loadShortTags(short.mediaItemId);
      return short;
    });
  }

  // Count all shorts
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shorts`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToShort(row: any): Short {
    return new Short(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      [], // Tags will be loaded separately
    );
  }

  // Helper method to insert short tags
  private insertShortTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO short_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tag of tags) {
      try {
        // tag may be a Tag object or a string during migration; resolve to Tag
        let tagId: string | undefined;
        if (typeof tag === 'string') {
          const found = tagRepository.findByNameIgnoreCase(tag);
          tagId = found ? found.tagId : undefined;
        } else if ((tag as any).tagId) {
          tagId = (tag as any).tagId;
        }

        if (!tagId) {
          console.warn(`Skipping unknown tag for short ${mediaItemId}:`, tag);
          continue;
        }

        stmt.run(mediaItemId, tagId);
      } catch (error) {
        // Skip duplicates
        console.warn(`Failed to insert tag for short ${mediaItemId}:`, error);
      }
    }
  }

  // Helper method to load short tags
  private loadShortTags(mediaItemId: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN short_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
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

  // Helper method to delete short tags
  private deleteShortTags(mediaItemId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM short_tags WHERE mediaItemId = ?
    `);
    stmt.run(mediaItemId);
  }

  // Find shorts by Genre and Aesthetic tags for buffer selection, excluding recently used shorts
  findBufferShortsByTags(
    tags: (Tag | string)[],
    hoursBack: number = 2,
  ): Short[] {
    if (tags.length === 0) return [];

    const tagNames = tags.map(t =>
      typeof t === 'string' ? t : (t as any).name,
    );
    const tagPlaceholders = tagNames.map(() => '?').join(',');

    // Use NOT EXISTS for efficient exclusion of recently used shorts
    const query = `
      SELECT DISTINCT s.* FROM shorts s
      INNER JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      INNER JOIN tags t ON st.tagId = t.tagId
      WHERE t.name IN (${tagPlaceholders})
      AND t.type IN ('Genre', 'Aesthetic')
      AND NOT EXISTS (
        SELECT 1 FROM recently_used_shorts rus 
        WHERE rus.mediaItemId = s.mediaItemId 
        AND rus.usageContext = 'buffer'
        AND (rus.expiresAt IS NULL OR rus.expiresAt > datetime('now'))
        AND rus.usedAt > datetime('now', '-${hoursBack} hours')
      )
      ORDER BY RANDOM()
    `;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...tagNames) as any[];

    return rows.map(row => {
      const short = this.mapRowToShort(row);
      short.tags = this.loadShortTags(short.mediaItemId);
      return short;
    });
  }
}

export const shortRepository = new ShortRepository();
