import { getDB } from "../db/sqlite.js";
export class TagRepository {
    get db() {
        return getDB();
    }
    /**
     * Create a new tag
     */
    create(tag) {
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
                insertTagStmt.run(tag.tagId, tag.name, tag.type, tag.seasonStartDate || null, tag.seasonEndDate || null, tag.explicitlyHoliday ? 1 : 0, tag.sequence || null);
                if (tag.type === "Holiday" &&
                    tag.holidayDates &&
                    tag.holidayDates.length > 0) {
                    for (const holidayDate of tag.holidayDates) {
                        insertHolidayDateStmt.run(tag.tagId, holidayDate);
                    }
                }
                if (tag.type === "Holiday" &&
                    tag.exclusionTagIds &&
                    tag.exclusionTagIds.length > 0) {
                    for (const excludedTagId of tag.exclusionTagIds) {
                        insertExclusionTagStmt.run(tag.tagId, excludedTagId);
                    }
                }
            });
            transaction();
            return this.findByTagId(tag.tagId);
        }
        catch (error) {
            if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
                throw new Error(`Tag with name "${tag.name}" already exists`);
            }
            throw error;
        }
    }
    /**
     * Find tag by tagId
     */
    findByTagId(tagId) {
        const stmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
        const row = stmt.get(tagId);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    /**
     * Find tag by name (case-sensitive)
     */
    findByName(name) {
        const stmt = this.db.prepare(`SELECT * FROM tags WHERE name = ?`);
        const row = stmt.get(name);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    /**
     * Find tag by name (case-insensitive)
     */
    findByNameIgnoreCase(name) {
        const stmt = this.db.prepare(`SELECT * FROM tags WHERE LOWER(name) = LOWER(?)`);
        const row = stmt.get(name);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    /**
     * Check if tag name already exists
     */
    isNameTaken(name, excludeTagId) {
        let stmt;
        let params;
        if (excludeTagId) {
            stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM tags 
        WHERE LOWER(name) = LOWER(?) AND tagId != ?
      `);
            params = [name, excludeTagId];
        }
        else {
            stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM tags 
        WHERE LOWER(name) = LOWER(?)
      `);
            params = [name];
        }
        const result = stmt.get(...params);
        return result.count > 0;
    }
    /**
     * Find all tags
     */
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM tags ORDER BY name`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToTag(row));
    }
    /**
     * Find all tags by type
     */
    findByType(type) {
        const stmt = this.db.prepare(`SELECT * FROM tags WHERE type = ? ORDER BY name`);
        const rows = stmt.all(type);
        return rows.map((row) => this.mapRowToTag(row));
    }
    /**
     * Update tag
     */
    update(tagId, tag) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE tags 
        SET name = ?, type = ?, seasonStartDate = ?, seasonEndDate = ?, 
            explicitlyHoliday = ?, sequence = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE tagId = ?
      `);
            const result = stmt.run(tag.name, tag.type, tag.seasonStartDate || null, tag.seasonEndDate || null, tag.explicitlyHoliday ? 1 : 0, tag.sequence || null, tagId);
            if (result.changes === 0)
                return null;
            // Handle holiday dates
            if (tag.type === "Holiday") {
                this.db.prepare("DELETE FROM holiday_dates WHERE tagId = ?").run(tagId);
                if (tag.holidayDates && tag.holidayDates.length > 0) {
                    const insertStmt = this.db.prepare(`INSERT INTO holiday_dates (tagId, holidayDate) VALUES (?, ?)`);
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
    delete(tagId) {
        const stmt = this.db.prepare(`DELETE FROM tags WHERE tagId = ?`);
        const result = stmt.run(tagId);
        return result.changes > 0;
    }
    /**
     * Get all active holidays for a given date
     */
    getActiveHolidaysForDate(date) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT t.* FROM tags t
      JOIN holiday_dates hd ON t.tagId = hd.tagId
      WHERE t.type = 'Holiday' 
        AND DATE(hd.holidayDate) = DATE(?)
      ORDER BY t.name
    `);
        const rows = stmt.all(date);
        return rows.map((row) => this.mapRowToTag(row));
    }
    /**
     * Count total tags
     */
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM tags`);
        const result = stmt.get();
        return result.count;
    }
    /**
     * Map database row to Tag object
     */
    mapRowToTag(row) {
        const tag = {
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
            const stmt = this.db.prepare(`SELECT holidayDate FROM holiday_dates WHERE tagId = ? ORDER BY holidayDate`);
            const dates = stmt.all(tag.tagId);
            tag.holidayDates = dates.map((d) => d.holidayDate);
            const exclusionStmt = this.db.prepare(`SELECT excludedTagId FROM holiday_exclusion_tags WHERE holidayTagId = ?`);
            const exclusions = exclusionStmt.all(tag.tagId);
            tag.exclusionTagIds = exclusions.map((e) => e.excludedTagId);
        }
        return tag;
    }
}
// Singleton instance
export const tagRepository = new TagRepository();
