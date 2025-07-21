import { getDB } from '../db/sqlite';
import { Holiday } from '../models/holiday';

export class HolidayRepository {
  private get db() {
    return getDB();
  }

  create(holiday: Holiday): Holiday | null {
    const stmt = this.db.prepare(`
      INSERT INTO holidays (tagId, name, holidayDates, exclusionGenres, seasonStartDate, seasonEndDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      holiday.tagId,
      holiday.name,
      JSON.stringify(holiday.holidayDates),
      JSON.stringify(holiday.exclusionGenres),
      holiday.seasonStartDate,
      holiday.seasonEndDate,
    );

    return this.findByTagId(holiday.tagId);
  }

  findByTagId(tagId: string): any | null {
    const stmt = this.db.prepare(`SELECT * FROM holidays WHERE tagId = ?`);
    const row = stmt.get(tagId) as any;
    return row ? this.mapRowToHoliday(row) : null;
  }

  findAll(): any[] {
    const stmt = this.db.prepare(`SELECT * FROM holidays ORDER BY name`);
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToHoliday(row));
  }

  delete(tagId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM holidays WHERE tagId = ?`);
    const result = stmt.run(tagId);
    return result.changes > 0;
  }

  private mapRowToHoliday(row: any): any {
    return {
      title: row.title,
      mediaItemId: row.mediaItemId,
      tags: JSON.parse(row.tags || '[]'),
      startDate: row.startDate,
      endDate: row.endDate,
    };
  }
}

export const holidayRepository = new HolidayRepository();
