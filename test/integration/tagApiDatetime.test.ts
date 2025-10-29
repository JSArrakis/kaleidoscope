import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';
import { tagRepository } from '../../src/repositories/tagsRepository';
import { sqliteService, getDB } from '../../src/db/sqlite';
import {
  convertMMDDToDateTime,
  convertDateTimeToMMDD,
} from '../../src/utils/utilities';

describe('Holiday DATETIME Storage Integration', () => {
  beforeAll(() => {
    // Initialize database with fresh schema
    sqliteService.connect();
  });

  afterAll(() => {
    sqliteService.close();
  });

  beforeEach(() => {
    // Clean up any existing tags
    const allTags = tagRepository.findAll();
    allTags.forEach(tag => tagRepository.delete(tag.tagId));
  });

  describe('DATETIME storage with MM-DD API interface', () => {
    it('should store MM-DD as DATETIME in database but return MM-DD format', () => {
      // Create exclusion tag first
      const horrorTag = new Tag('horror', 'Horror Genre', TagType.Genre);
      tagRepository.create(horrorTag);

      // Create holiday tag with MM-DD input
      const holiday = new Tag(
        'test-datetime-storage',
        'Test DATETIME Storage',
        TagType.Holiday,
        ['12-25', '01-01', '07-04'], // MM-DD input format
        ['horror'], // exclusionTags - now referencing a real tag ID
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
      );

      // Create the tag
      const created = tagRepository.create(holiday);

      // Verify API returns MM-DD format (sorted by date order)
      expect(created.holidayDates).toEqual(['01-01', '07-04', '12-25']);

      // Verify database stores as DATETIME
      const db = getDB();
      const holidayDatesRows = db
        .prepare(
          `
        SELECT holidayDate FROM holiday_dates WHERE tagId = ? ORDER BY holidayDate
      `,
        )
        .all(created.tagId) as { holidayDate: string }[];

      expect(holidayDatesRows.length).toBe(3);

      // Check that database values are DATETIME format
      const currentYear = new Date().getFullYear();
      expect(holidayDatesRows[0].holidayDate).toBe(
        `${currentYear}-01-01 00:00:00`,
      );
      expect(holidayDatesRows[1].holidayDate).toBe(
        `${currentYear}-07-04 00:00:00`,
      );
      expect(holidayDatesRows[2].holidayDate).toBe(
        `${currentYear}-12-25 00:00:00`,
      );

      // Verify conversion back to MM-DD works
      expect(convertDateTimeToMMDD(holidayDatesRows[0].holidayDate)).toBe(
        '01-01',
      );
      expect(convertDateTimeToMMDD(holidayDatesRows[1].holidayDate)).toBe(
        '07-04',
      );
      expect(convertDateTimeToMMDD(holidayDatesRows[2].holidayDate)).toBe(
        '12-25',
      );
    });

    it('should update holiday dates and maintain DATETIME storage', () => {
      // Create initial holiday
      const holiday = new Tag(
        'test-update-datetime',
        'Test Update DATETIME',
        TagType.Holiday,
        ['12-25'], // Single date initially
        [], // exclusionTags
      );
      const created = tagRepository.create(holiday);

      // Update with new dates
      const updatedTag = new Tag(
        created.tagId,
        created.name,
        TagType.Holiday,
        ['12-24', '12-25', '12-26'], // Christmas period
        [], // exclusionTags
      );
      const updated = tagRepository.update(created.tagId, updatedTag);

      // Verify API returns MM-DD format
      expect(updated!.holidayDates).toEqual(['12-24', '12-25', '12-26']);

      // Verify database has DATETIME format
      const db = getDB();
      const holidayDatesRows = db
        .prepare(
          `
        SELECT holidayDate FROM holiday_dates WHERE tagId = ? ORDER BY holidayDate
      `,
        )
        .all(created.tagId) as { holidayDate: string }[];

      expect(holidayDatesRows.length).toBe(3);
      const currentYear = new Date().getFullYear();
      expect(holidayDatesRows[0].holidayDate).toBe(
        `${currentYear}-12-24 00:00:00`,
      );
      expect(holidayDatesRows[1].holidayDate).toBe(
        `${currentYear}-12-25 00:00:00`,
      );
      expect(holidayDatesRows[2].holidayDate).toBe(
        `${currentYear}-12-26 00:00:00`,
      );
    });

    it('should query holidays using DATETIME but match by month-day', () => {
      // Create Christmas holiday
      const christmas = new Tag(
        'christmas-datetime-query',
        'Christmas DATETIME Query',
        TagType.Holiday,
        ['12-25'],
        [], // exclusionTags
      );
      tagRepository.create(christmas);

      // Test query on Christmas day
      const christmasDay = new Date(2024, 11, 25); // December 25, 2024
      const currentDateTime = `${christmasDay.getFullYear()}-${String(christmasDay.getMonth() + 1).padStart(2, '0')}-${String(christmasDay.getDate()).padStart(2, '0')} 10:30:00`;

      const todaysHolidays =
        tagRepository.findAllTodaysHolidays(currentDateTime);

      expect(todaysHolidays.length).toBe(1);
      expect(todaysHolidays[0].tagId).toBe('christmas-datetime-query');
      expect(todaysHolidays[0].holidayDates).toEqual(['12-25']); // Returns MM-DD format
    });

    it('should handle different years in DATETIME but match by month-day', () => {
      // Create New Year holiday
      const newYear = new Tag(
        'newyear-datetime-test',
        'New Year DATETIME Test',
        TagType.Holiday,
        ['01-01'],
        [], // exclusionTags
      );
      tagRepository.create(newYear);

      // Database stores with current year, but query with different year should still match
      const differentYearDate = new Date(2025, 0, 1); // January 1, 2025
      const currentDateTime = `${differentYearDate.getFullYear()}-${String(differentYearDate.getMonth() + 1).padStart(2, '0')}-${String(differentYearDate.getDate()).padStart(2, '0')} 00:00:00`;

      const holidays = tagRepository.findAllTodaysHolidays(currentDateTime);

      expect(holidays.length).toBe(1);
      expect(holidays[0].tagId).toBe('newyear-datetime-test');
      expect(holidays[0].holidayDates).toEqual(['01-01']);
    });
  });
});
