import { getDB } from '../db/sqlite';
import { Tag } from '../models/tag';

export class TagRepository {
  private get db() {
    return getDB();
  }

  // Create a new tag
  create(tag: Tag): Tag {
    // Check if name is already taken
    if (this.isNameTaken(tag.name)) {
      throw new Error(`Tag name "${tag.name}" already exists`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO tags (tagId, name, type, holidayDates, exclusionGenres, seasonStartDate, seasonEndDate, sequence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        tag.tagId,
        tag.name,
        tag.type,
        tag.holidayDates ? JSON.stringify(tag.holidayDates) : null,
        tag.exclusionGenres ? JSON.stringify(tag.exclusionGenres) : null,
        tag.seasonStartDate || null,
        tag.seasonEndDate || null,
        tag.sequence || null,
      );

      return this.findByTagId(tag.tagId)!;
    } catch (error: any) {
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
  findByTagId(tagId: string): Tag | null {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE tagId = ?
    `);

    const row = stmt.get(tagId) as any;
    if (!row) return null;

    return this.mapRowToTag(row);
  }

  // Find tag by name
  findByName(name: string): Tag | null {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE name = ?
    `);

    const row = stmt.get(name) as any;
    if (!row) return null;

    return this.mapRowToTag(row);
  }

  // Find tag by name (case-insensitive)
  findByNameIgnoreCase(name: string): Tag | null {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE LOWER(name) = LOWER(?)
    `);

    const row = stmt.get(name) as any;
    if (!row) return null;

    return this.mapRowToTag(row);
  }

  // Check if tag name already exists (case-insensitive)
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

  // Find all tags
  findAll(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags ORDER BY name
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Update tag
  update(tagId: string, tag: Tag): Tag | null {
    // Check if name is already taken by another tag
    if (this.isNameTaken(tag.name, tagId)) {
      throw new Error(`Tag name "${tag.name}" already exists`);
    }

    const stmt = this.db.prepare(`
      UPDATE tags
      SET name = ?, type = ?, holidayDates = ?, exclusionGenres = ?, seasonStartDate = ?, seasonEndDate = ?, sequence = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE tagId = ?
    `);

    try {
      const result = stmt.run(
        tag.name,
        tag.type,
        tag.holidayDates ? JSON.stringify(tag.holidayDates) : null,
        tag.exclusionGenres ? JSON.stringify(tag.exclusionGenres) : null,
        tag.seasonStartDate || null,
        tag.seasonEndDate || null,
        tag.sequence || null,
        tagId,
      );

      if (result.changes === 0) return null;
      return this.findByTagId(tagId);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message.includes('name')) {
          throw new Error(`Tag name "${tag.name}" already exists`);
        }
      }
      throw error;
    }
  }

  // Delete tag
  delete(tagId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM tags WHERE tagId = ?
    `);

    const result = stmt.run(tagId);
    return result.changes > 0;
  }

  // Find tags by tags
  findByTags(tags: string[]): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY name
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Find tags by type
  findByType(type: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = ? ORDER BY name
    `);

    const rows = stmt.all(type) as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Count all tags
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM tags`);
    const result = stmt.get() as any;
    return result.count;
  }

  // Find all holidays
  findAllHolidays(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'Holiday' ORDER BY name
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Find all age groups
  findAllAgeGroups(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'AgeGroup' ORDER BY sequence, name
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Find all musical genres
  findAllMusicalGenres(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags WHERE type = 'MusicalGenre' ORDER BY name
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Find holidays by current date
  findActiveHolidays(currentDate: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tags 
      WHERE type = 'Holiday' 
        AND (holidayDates LIKE ? OR 
             (seasonStartDate <= ? AND seasonEndDate >= ?))
      ORDER BY name
    `);

    const rows = stmt.all(
      `%"${currentDate}"%`,
      currentDate,
      currentDate,
    ) as any[];
    return rows.map(row => this.mapRowToTag(row));
  }

  // Create a holiday tag
  createHoliday(
    tagId: string,
    name: string,
    holidayDates: string[],
    exclusionGenres: string[],
    seasonStartDate?: string,
    seasonEndDate?: string,
  ): Tag {
    // Check if name is already taken
    if (this.isNameTaken(name)) {
      throw new Error(`Tag name "${name}" already exists`);
    }

    const holiday = new Tag(
      tagId,
      name,
      'Holiday',
      holidayDates,
      exclusionGenres,
      seasonStartDate,
      seasonEndDate,
    );
    return this.create(holiday);
  }

  // Create an age group tag
  createAgeGroup(tagId: string, name: string, sequence: number): Tag {
    // Check if name is already taken
    if (this.isNameTaken(name)) {
      throw new Error(`Tag name "${name}" already exists`);
    }

    const ageGroup = new Tag(
      tagId,
      name,
      'AgeGroup',
      undefined,
      undefined,
      undefined,
      undefined,
      sequence,
    );
    return this.create(ageGroup);
  }

  // Create a musical genre tag
  createMusicalGenre(tagId: string, name: string): Tag {
    // Check if name is already taken
    if (this.isNameTaken(name)) {
      throw new Error(`Tag name "${name}" already exists`);
    }

    const musicalGenre = new Tag(
      tagId,
      name,
      'MusicalGenre',
    );
    return this.create(musicalGenre);
  }

  private mapRowToTag(row: any): Tag {
    return new Tag(
      row.tagId,
      row.name,
      row.type,
      row.holidayDates ? JSON.parse(row.holidayDates) : undefined,
      row.exclusionGenres ? JSON.parse(row.exclusionGenres) : undefined,
      row.seasonStartDate,
      row.seasonEndDate,
      row.sequence,
    );
  }
}

// Export singleton instance
export const tagRepository = new TagRepository();
