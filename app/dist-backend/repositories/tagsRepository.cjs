"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagRepository = exports.TagRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const tag_1 = require("../models/tag.cjs");
const tagTypes_1 = require("../models/const/tagTypes.cjs");
const utilities_1 = require("../utils/utilities.cjs");
class TagRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new tag
    create(tag) {
        // Check if name is already taken
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
            // Use transaction to ensure data consistency
            const transaction = this.db.transaction(() => {
                // Insert the main tag record
                insertTagStmt.run(tag.tagId, tag.name, tag.type, tag.seasonStartDate || null, tag.seasonEndDate || null, tag.explicitlyHoliday ? 1 : 0, // Convert boolean to integer for SQLite
                tag.sequence || null);
                // Insert holiday dates if this is a holiday tag and has dates
                if (tag.type === tagTypes_1.TagType.Holiday &&
                    tag.holidayDates &&
                    tag.holidayDates.length > 0) {
                    for (const holidayDate of tag.holidayDates) {
                        // Convert MM-DD format to DATETIME for storage
                        const datetime = (0, utilities_1.convertMMDDToDateTime)(holidayDate);
                        insertHolidayDateStmt.run(tag.tagId, datetime);
                    }
                }
                // Insert exclusion tags if this is a holiday tag and has exclusions
                if (tag.type === tagTypes_1.TagType.Holiday &&
                    tag.exclusionTags &&
                    tag.exclusionTags.length > 0) {
                    for (const excludedTagId of tag.exclusionTags) {
                        insertExclusionTagStmt.run(tag.tagId, excludedTagId);
                    }
                }
            });
            transaction();
            return this.findByTagId(tag.tagId);
        }
        catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                if (error.message.includes('name')) {
                    throw new Error(`Tag name "${tag.name}" already exists`);
                }
                if (error.message.includes('tagId')) {
                    throw new Error(`Tag ID "${tag.tagId}" already exists`);
                }
            }
            throw error;
        }
    }
    // Find tag by tagId
    findByTagId(tagId) {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE tagId = ?
    `);
        const row = stmt.get(tagId);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    // Find tag by name
    findByName(name) {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE name = ?
    `);
        const row = stmt.get(name);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    // Find tag by name (case-insensitive)
    findByNameIgnoreCase(name) {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE LOWER(name) = LOWER(?)
    `);
        const row = stmt.get(name);
        if (!row)
            return null;
        return this.mapRowToTag(row);
    }
    // Check if tag name already exists (case-insensitive)
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
    // Find all tags
    findAll() {
        const stmt = this.db.prepare(`
      SELECT * FROM tags ORDER BY name
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToTag(row));
    }
    // Update tag
    update(tagId, tag) {
        // Check if name is already taken by another tag
        if (this.isNameTaken(tag.name, tagId)) {
            throw new Error(`Tag name "${tag.name}" already exists`);
        }
        const updateTagStmt = this.db.prepare(`
      UPDATE tags
      SET name = ?, type = ?, seasonStartDate = ?, seasonEndDate = ?, explicitlyHoliday = ?, sequence = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE tagId = ?
    `);
        const deleteHolidayDatesStmt = this.db.prepare(`
      DELETE FROM holiday_dates WHERE tagId = ?
    `);
        const insertHolidayDateStmt = this.db.prepare(`
      INSERT INTO holiday_dates (tagId, holidayDate)
      VALUES (?, ?)
    `);
        const deleteExclusionTagsStmt = this.db.prepare(`
      DELETE FROM holiday_exclusion_tags WHERE holidayTagId = ?
    `);
        const insertExclusionTagStmt = this.db.prepare(`
      INSERT INTO holiday_exclusion_tags (holidayTagId, excludedTagId)
      VALUES (?, ?)
    `);
        try {
            // Use transaction to ensure data consistency
            const transaction = this.db.transaction(() => {
                // Update the main tag record
                const result = updateTagStmt.run(tag.name, tag.type, tag.seasonStartDate || null, tag.seasonEndDate || null, tag.explicitlyHoliday ? 1 : 0, // Convert boolean to integer for SQLite
                tag.sequence || null, tagId);
                if (result.changes === 0)
                    return null;
                // Handle holiday dates
                // First, delete all existing holiday dates for this tag
                deleteHolidayDatesStmt.run(tagId);
                // Then insert new holiday dates if this is a holiday tag and has dates
                if (tag.type === tagTypes_1.TagType.Holiday &&
                    tag.holidayDates &&
                    tag.holidayDates.length > 0) {
                    for (const holidayDate of tag.holidayDates) {
                        // Convert MM-DD format to DATETIME for storage
                        const datetime = (0, utilities_1.convertMMDDToDateTime)(holidayDate);
                        insertHolidayDateStmt.run(tagId, datetime);
                    }
                }
                // Handle exclusion tags
                // First, delete all existing exclusion tags for this holiday tag
                deleteExclusionTagsStmt.run(tagId);
                // Then insert new exclusion tags if this is a holiday tag and has exclusions
                if (tag.type === tagTypes_1.TagType.Holiday &&
                    tag.exclusionTags &&
                    tag.exclusionTags.length > 0) {
                    for (const excludedTagId of tag.exclusionTags) {
                        insertExclusionTagStmt.run(tagId, excludedTagId);
                    }
                }
            });
            transaction();
            return this.findByTagId(tagId);
        }
        catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                if (error.message.includes('name')) {
                    throw new Error(`Tag name "${tag.name}" already exists`);
                }
            }
            throw error;
        }
    }
    // Delete tag
    delete(tagId) {
        const stmt = this.db.prepare(`
      DELETE FROM tags WHERE tagId = ?
    `);
        const result = stmt.run(tagId);
        return result.changes > 0;
    }
    // Find tags by tags (accept Tag[] or string[])
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const names = tags.map(t => (typeof t === 'string' ? t : t.name));
        const stmt = this.db.prepare(`
      SELECT * FROM tags
      WHERE ${names.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY name
    `);
        const params = names.map(tag => `%"${tag}"%`);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapRowToTag(row));
    }
    // Find tags by type
    findByType(type) {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = ? ORDER BY name
    `);
        const rows = stmt.all(type);
        return rows.map(row => this.mapRowToTag(row));
    }
    // Count all tags
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM tags`);
        const result = stmt.get();
        return result.count;
    }
    // Find all holidays
    findAllHolidays() {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'Holiday' ORDER BY name
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToTag(row));
    }
    findAllTodaysHolidays(currentDateTime) {
        // Extract just the date part for holidayDates comparison (YYYY-MM-DD)
        const currentDate = currentDateTime.split(' ')[0];
        // Extract MM-DD format for holiday dates comparison
        const currentMonthDay = currentDate.substring(5); // Get MM-DD from YYYY-MM-DD
        const stmt = this.db.prepare(`
      SELECT DISTINCT t.* FROM tags t
      LEFT JOIN holiday_dates hd ON t.tagId = hd.tagId
      WHERE t.type = 'Holiday' 
        AND (
          DATE(hd.holidayDate) = ? OR 
          strftime('%m-%d', hd.holidayDate) = ? OR
          (t.seasonStartDate IS NOT NULL AND t.seasonEndDate IS NOT NULL 
           AND DATE(t.seasonStartDate) <= ? AND DATE(t.seasonEndDate) >= ?)
        )
      ORDER BY t.name
    `);
        const rows = stmt.all(currentDate, // YYYY-MM-DD format for full date match
        currentMonthDay, // MM-DD format for month-day match
        currentDate, currentDate);
        return rows.map(row => this.mapRowToTag(row));
    }
    // Find all age groups
    findAllAgeGroups() {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'AgeGroup' ORDER BY sequence, name
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToTag(row));
    }
    // Find all musical genres
    findAllMusicalGenres() {
        const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'MusicalGenre' ORDER BY name
    `);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToTag(row));
    }
    // Find holidays by current date
    findActiveHolidays(currentDateTime) {
        // Extract just the date part for holidayDates comparison (YYYY-MM-DD)
        const currentDate = currentDateTime.split(' ')[0];
        // Extract MM-DD format for holiday dates comparison
        const currentMonthDay = currentDate.substring(5); // Get MM-DD from YYYY-MM-DD
        const stmt = this.db.prepare(`
      SELECT DISTINCT t.* FROM tags t
      LEFT JOIN holiday_dates hd ON t.tagId = hd.tagId
      WHERE t.type = 'Holiday' 
        AND (
          DATE(hd.holidayDate) = ? OR 
          strftime('%m-%d', hd.holidayDate) = ? OR
          (t.seasonStartDate IS NOT NULL AND t.seasonEndDate IS NOT NULL 
           AND DATE(t.seasonStartDate) <= ? AND DATE(t.seasonEndDate) >= ?)
        )
      ORDER BY t.name
    `);
        const rows = stmt.all(currentDate, // YYYY-MM-DD format for full date match
        currentMonthDay, // MM-DD format for month-day match
        currentDate, currentDate);
        return rows.map(row => this.mapRowToTag(row));
    }
    // Create a holiday tag
    createHoliday(tagId, name, holidayDates, exclusionGenres, seasonStartDate, seasonEndDate, explicitlyHoliday) {
        // Check if name is already taken
        if (this.isNameTaken(name)) {
            throw new Error(`Tag name "${name}" already exists`);
        }
        const holiday = new tag_1.Tag(tagId, name, tagTypes_1.TagType.Holiday, holidayDates, exclusionGenres, seasonStartDate, seasonEndDate, explicitlyHoliday);
        return this.create(holiday);
    }
    // Create an age group tag
    createAgeGroup(tagId, name, sequence) {
        // Check if name is already taken
        if (this.isNameTaken(name)) {
            throw new Error(`Tag name "${name}" already exists`);
        }
        const ageGroup = new tag_1.Tag(tagId, name, tagTypes_1.TagType.AgeGroup, undefined, // holidayDates
        undefined, // exclusionGenres
        undefined, // seasonStartDate
        undefined, // seasonEndDate
        undefined, // explicitlyHoliday
        sequence);
        return this.create(ageGroup);
    }
    // Create a musical genre tag
    createMusicalGenre(tagId, name) {
        // Check if name is already taken
        if (this.isNameTaken(name)) {
            throw new Error(`Tag name "${name}" already exists`);
        }
        const musicalGenre = new tag_1.Tag(tagId, name, tagTypes_1.TagType.MusicalGenre);
        return this.create(musicalGenre);
    }
    mapRowToTag(row) {
        // Fetch holiday dates if this is a holiday tag
        let holidayDates = undefined;
        if (row.type === tagTypes_1.TagType.Holiday) {
            const holidayDatesStmt = this.db.prepare(`
        SELECT holidayDate FROM holiday_dates WHERE tagId = ? ORDER BY holidayDate
      `);
            const holidayRows = holidayDatesStmt.all(row.tagId);
            // Convert DATETIME back to MM-DD format for API responses
            holidayDates = holidayRows.map(r => (0, utilities_1.convertDateTimeToMMDD)(r.holidayDate));
        }
        // Fetch exclusion tags if this is a holiday tag
        let exclusionTags = undefined;
        if (row.type === tagTypes_1.TagType.Holiday) {
            const exclusionTagsStmt = this.db.prepare(`
        SELECT excludedTagId FROM holiday_exclusion_tags WHERE holidayTagId = ? ORDER BY excludedTagId
      `);
            const exclusionRows = exclusionTagsStmt.all(row.tagId);
            exclusionTags = exclusionRows.map(r => r.excludedTagId);
        }
        return new tag_1.Tag(row.tagId, row.name, row.type, holidayDates, exclusionTags, row.seasonStartDate, row.seasonEndDate, Boolean(row.explicitlyHoliday), // Convert SQLite integer back to boolean
        row.sequence);
    }
}
exports.TagRepository = TagRepository;
// Export singleton instance
exports.tagRepository = new TagRepository();
