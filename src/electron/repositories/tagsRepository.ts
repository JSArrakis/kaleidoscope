import { getDB } from "../db/sqlite.js";

export interface Tag {
  tagId: string;
  name: string;
  type:
    | "Aesthetic"
    | "Era"
    | "Genre"
    | "Specialty"
    | "Holiday"
    | "AgeGroup"
    | "MusicGenre";
  seasonStartDate?: string;
  seasonEndDate?: string;
  explicitlyHoliday?: boolean;
  sequence?: number;
  holidayDates?: string[];
  exclusionTagIds?: string[];
}

export class TagRepository {
  private get db() {
    return getDB();
  }

  /**
   * Create a new tag
   */
  create(tag: Tag): Tag {
    if (this.isNameTaken(tag.name)) {
      throw new Error(`Tag name "${tag.name}" already exists`);
    }

    const insertTagStmt = this.db.prepare(`
      INSERT INTO tags (tagId, name, type, seasonStartDate, seasonEndDate, explicitlyHoliday, sequence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHolidayDateStmt = this.db.prepare(`
      INSERT INTO holiday_dates (tagId, holidayDate)
      VALUES (?, ?)
    `);

    const insertExclusionTagStmt = this.db.prepare(`
      INSERT INTO holiday_exclusion_tags (holidayTagId, excludedTagId)
      VALUES (?, ?)
    `);

    try {
      const transaction = this.db.transaction(() => {
        insertTagStmt.run(
          tag.tagId,
          tag.name,
          tag.type,
          tag.seasonStartDate || null,
          tag.seasonEndDate || null,
          tag.explicitlyHoliday ? 1 : 0,
          tag.sequence || null
        );

        if (
          tag.type === "Holiday" &&
          tag.holidayDates &&
          tag.holidayDates.length > 0
        ) {
          for (const holidayDate of tag.holidayDates) {
            insertHolidayDateStmt.run(tag.tagId, holidayDate);
          }
        }

        if (
          tag.type === "Holiday" &&
          tag.exclusionTagIds &&
          tag.exclusionTagIds.length > 0
        ) {
          for (const excludedTagId of tag.exclusionTagIds) {
            insertExclusionTagStmt.run(tag.tagId, excludedTagId);
          }
        }
      });

      transaction();
      return this.findByTagId(tag.tagId)!;
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error(`Tag with name "${tag.name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Find tag by tagId
   */
  findByTagId(tagId: string): Tag | null {
    const stmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
    const row = stmt.get(tagId) as any;
    if (!row) return null;
    return this.mapRowToTag(row);
  }

  /**
   * Find tag by name (case-sensitive)
   */
  findByName(name: string): Tag | null {
    const stmt = this.db.prepare(`SELECT * FROM tags WHERE name = ?`);
    const row = stmt.get(name) as any;
    if (!row) return null;
    return this.mapRowToTag(row);
  }

  /**
   * Find tag by name (case-insensitive)
   */
  findByNameIgnoreCase(name: string): Tag | null {
    const stmt = this.db.prepare(
      `SELECT * FROM tags WHERE LOWER(name) = LOWER(?)`
    );
    const row = stmt.get(name) as any;
    if (!row) return null;
    return this.mapRowToTag(row);
  }

  /**
   * Check if tag name already exists
   */
  isNameTaken(name: string, excludeTagId?: string): boolean {
    let stmt: any;
    let params: any[];

    if (excludeTagId) {
      stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM tags 
        WHERE LOWER(name) = LOWER(?) AND tagId != ?
      `);
      params = [name, excludeTagId];
    } else {
      stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM tags 
        WHERE LOWER(name) = LOWER(?)
      `);
      params = [name];
    }

    const result = stmt.get(...params) as any;
    return result.count > 0;
  }

  /**
   * Find all tags
   */
  findAll(): Tag[] {
    const stmt = this.db.prepare(`SELECT * FROM tags ORDER BY name`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToTag(row));
  }

  /**
   * Find all tags by type
   */
  findByType(type: string): Tag[] {
    const stmt = this.db.prepare(
      `SELECT * FROM tags WHERE type = ? ORDER BY name`
    );
    const rows = stmt.all(type) as any[];
    return rows.map((row) => this.mapRowToTag(row));
  }

  /**
   * Update tag
   */
  update(tagId: string, tag: Tag): Tag | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE tags 
        SET name = ?, type = ?, seasonStartDate = ?, seasonEndDate = ?, 
            explicitlyHoliday = ?, sequence = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE tagId = ?
      `);

      const result = stmt.run(
        tag.name,
        tag.type,
        tag.seasonStartDate || null,
        tag.seasonEndDate || null,
        tag.explicitlyHoliday ? 1 : 0,
        tag.sequence || null,
        tagId
      );

      if (result.changes === 0) return null;

      // Handle holiday dates
      if (tag.type === "Holiday") {
        this.db.prepare("DELETE FROM holiday_dates WHERE tagId = ?").run(tagId);
        if (tag.holidayDates && tag.holidayDates.length > 0) {
          const insertStmt = this.db.prepare(
            `INSERT INTO holiday_dates (tagId, holidayDate) VALUES (?, ?)`
          );
          for (const date of tag.holidayDates) {
            insertStmt.run(tagId, date);
          }
        }

        // Handle exclusion tags
        this.db
          .prepare("DELETE FROM holiday_exclusion_tags WHERE holidayTagId = ?")
          .run(tagId);
        if (tag.exclusionTagIds && tag.exclusionTagIds.length > 0) {
          const insertStmt = this.db.prepare(`
            INSERT INTO holiday_exclusion_tags (holidayTagId, excludedTagId) VALUES (?, ?)
          `);
          for (const excludedId of tag.exclusionTagIds) {
            insertStmt.run(tagId, excludedId);
          }
        }
      }
    });

    transaction();
    return this.findByTagId(tagId);
  }

  /**
   * Delete tag
   */
  delete(tagId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM tags WHERE tagId = ?`);
    const result = stmt.run(tagId);
    return result.changes > 0;
  }

  /**
   * Get all active holidays for a given date
   */
  getActiveHolidaysForDate(date: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT t.* FROM tags t
      JOIN holiday_dates hd ON t.tagId = hd.tagId
      WHERE t.type = 'Holiday' 
        AND DATE(hd.holidayDate) = DATE(?)
      ORDER BY t.name
    `);
    const rows = stmt.all(date) as any[];
    return rows.map((row) => this.mapRowToTag(row));
  }

  /**
   * Count total tags
   */
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM tags`);
    const result = stmt.get() as any;
    return result.count;
  }

  /**
   * Map database row to Tag object
   */
  private mapRowToTag(row: any): Tag {
    const tag: Tag = {
      tagId: row.tagId,
      name: row.name,
      type: row.type,
      seasonStartDate: row.seasonStartDate,
      seasonEndDate: row.seasonEndDate,
      explicitlyHoliday: row.explicitlyHoliday === 1,
      sequence: row.sequence,
    };

    // Load holiday dates if this is a holiday tag
    if (tag.type === "Holiday") {
      const stmt = this.db.prepare(
        `SELECT holidayDate FROM holiday_dates WHERE tagId = ? ORDER BY holidayDate`
      );
      const dates = stmt.all(tag.tagId) as any[];
      tag.holidayDates = dates.map((d) => d.holidayDate);

      const exclusionStmt = this.db.prepare(
        `SELECT excludedTagId FROM holiday_exclusion_tags WHERE holidayTagId = ?`
      );
      const exclusions = exclusionStmt.all(tag.tagId) as any[];
      tag.exclusionTagIds = exclusions.map((e) => e.excludedTagId);
    }

    return tag;
  }
}

// Singleton instance
export const tagRepository = new TagRepository();
