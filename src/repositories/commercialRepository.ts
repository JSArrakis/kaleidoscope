import { getDB } from '../db/sqlite';
import { Commercial } from '../models/commercial';
import { MediaTag } from '../models/const/tagTypes';
import { Tag } from '../models/tag';

export class CommercialRepository {
  private get db() {
    return getDB();
  }

  // Create a new commercial
  create(commercial: Commercial): Commercial {
    const transaction = this.db.transaction(() => {
      // Insert commercial record
      const stmt = this.db.prepare(`
        INSERT INTO commercials (title, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        commercial.title,
        commercial.mediaItemId,
        commercial.duration,
        commercial.path,
        commercial.type,
      );

      // Insert tag relationships
      this.insertCommercialTags(commercial.mediaItemId, commercial.tags);

      return this.findByMediaItemId(commercial.mediaItemId)!;
    });

    return transaction();
  }

  // Create multiple commercials in a transaction
  createMany(commercials: Commercial[]): Commercial[] {
    const transaction = this.db.transaction(
      (commercialsToInsert: Commercial[]) => {
        const results: Commercial[] = [];
        for (const commercial of commercialsToInsert) {
          try {
            // Insert commercial record
            const stmt = this.db.prepare(`
            INSERT INTO commercials (title, mediaItemId, duration, path, type)
            VALUES (?, ?, ?, ?, ?)
          `);

            stmt.run(
              commercial.title,
              commercial.mediaItemId,
              commercial.duration,
              commercial.path,
              commercial.type,
            );

            // Insert tag relationships
            this.insertCommercialTags(commercial.mediaItemId, commercial.tags);

            const created = this.findByMediaItemId(commercial.mediaItemId);
            if (created) results.push(created);
          } catch (error) {
            // Skip duplicates or other errors
            console.warn(
              `Failed to insert commercial ${commercial.mediaItemId}:`,
              error,
            );
          }
        }
        return results;
      },
    );

    return transaction(commercials);
  }

  // Find commercial by mediaItemId
  findByMediaItemId(mediaItemId: string): Commercial | null {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE mediaItemId = ?
    `);

    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    const commercial = this.mapRowToCommercial(row);
    commercial.tags = this.loadCommercialTags(mediaItemId);
    return commercial;
  }

  // Find all commercials
  findAll(): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials ORDER BY title
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => {
      const commercial = this.mapRowToCommercial(row);
      commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
      return commercial;
    });
  }

  // Update commercial
  update(mediaItemId: string, commercial: Commercial): Commercial | null {
    const transaction = this.db.transaction(() => {
      // Update commercial record
      const stmt = this.db.prepare(`
        UPDATE commercials 
        SET title = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        commercial.title,
        commercial.duration,
        commercial.path,
        commercial.type,
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Update tag relationships
      this.deleteCommercialTags(mediaItemId);
      this.insertCommercialTags(mediaItemId, commercial.tags);

      return this.findByMediaItemId(mediaItemId);
    });

    return transaction();
  }

  // Delete commercial
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM commercials WHERE mediaItemId = ?
    `);

    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find commercials by tags
  findByTags(tags: string[]): Commercial[] {
    if (tags.length === 0) return [];

    const placeholders = tags.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM commercials c
      INNER JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      INNER JOIN tags t ON ct.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY c.title
    `);

    const rows = stmt.all(...tags) as any[];
    return rows.map(row => {
      const commercial = this.mapRowToCommercial(row);
      commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
      return commercial;
    });
  }

  // Find commercials by type
  findByType(type: number): Commercial[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commercials WHERE type = ? ORDER BY title
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => {
      const commercial = this.mapRowToCommercial(row);
      commercial.tags = this.loadCommercialTags(commercial.mediaItemId);
      return commercial;
    });
  }

  // Count all commercials
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToCommercial(row: any): Commercial {
    return new Commercial(
      row.title,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      [], // Tags will be loaded separately
    );
  }

  // Helper method to insert commercial tags
  private insertCommercialTags(mediaItemId: string, tags: MediaTag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO commercial_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);

    for (const tag of tags) {
      try {
        stmt.run(mediaItemId, tag.tagId);
      } catch (error) {
        // Skip duplicates
        console.warn(
          `Failed to insert tag ${tag.tagId} for commercial ${mediaItemId}:`,
          error,
        );
      }
    }
  }

  // Helper method to load commercial tags
  private loadCommercialTags(mediaItemId: string): MediaTag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN commercial_tags ct ON t.tagId = ct.tagId
      WHERE ct.mediaItemId = ?
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

  // Helper method to delete commercial tags
  private deleteCommercialTags(mediaItemId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM commercial_tags WHERE mediaItemId = ?
    `);
    stmt.run(mediaItemId);
  }
}

// Export singleton instance
export const commercialRepository = new CommercialRepository();
