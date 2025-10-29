import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';
import { tagRepository } from '../../src/repositories/tagsRepository';
import { sqliteService } from '../../src/db/sqlite';
import { formatDateToISO } from '../../src/utils/utilities';

describe('Holiday Repository Queries Integration', () => {
  beforeAll(() => {
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

  describe('Holiday query methods with new table structure', () => {
    it('should find todays holidays using specific dates', () => {
      // Create a holiday with specific dates including today's MM-DD
      const today = new Date();
      const todayMonthDay =
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0');

      const holidayTag = new Tag(
        'holiday-today-test',
        'Today Holiday Test',
        TagType.Holiday,
        [todayMonthDay], // Today's date in MM-DD format
        [],
        undefined, // No season range
        undefined,
      );

      tagRepository.create(holidayTag);

      // Test findAllTodaysHolidays
      const currentDateTime = formatDateToISO(today);
      const todaysHolidays =
        tagRepository.findAllTodaysHolidays(currentDateTime);

      expect(todaysHolidays.length).toBe(1);
      expect(todaysHolidays[0].tagId).toBe('holiday-today-test');
      expect(todaysHolidays[0].holidayDates).toContain(todayMonthDay);
    });

    it('should find active holidays using season ranges', () => {
      // Create a holiday with season range that includes today
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const seasonStartDate = formatDateToISO(yesterday);
      const seasonEndDate = formatDateToISO(tomorrow);

      const seasonHoliday = new Tag(
        'holiday-season-test',
        'Season Holiday Test',
        TagType.Holiday,
        [], // No specific dates
        [],
        seasonStartDate,
        seasonEndDate,
      );

      tagRepository.create(seasonHoliday);

      // Test findActiveHolidays
      const currentDateTime = formatDateToISO(today);
      const activeHolidays = tagRepository.findActiveHolidays(currentDateTime);

      expect(activeHolidays.length).toBe(1);
      expect(activeHolidays[0].tagId).toBe('holiday-season-test');
      expect(activeHolidays[0].seasonStartDate).toBe(seasonStartDate);
      expect(activeHolidays[0].seasonEndDate).toBe(seasonEndDate);
    });

    it('should find holidays using both specific dates and season ranges', () => {
      const today = new Date();
      const todayMonthDay =
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0');

      // Holiday with specific date
      const specificHoliday = new Tag(
        'holiday-specific',
        'Specific Date Holiday',
        TagType.Holiday,
        [todayMonthDay],
        [],
      );

      // Holiday with season range
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const seasonHoliday = new Tag(
        'holiday-season',
        'Season Holiday',
        TagType.Holiday,
        [],
        [],
        formatDateToISO(yesterday),
        formatDateToISO(tomorrow),
      );

      tagRepository.create(specificHoliday);
      tagRepository.create(seasonHoliday);

      // Test both query methods
      const currentDateTime = formatDateToISO(today);
      const todaysHolidays =
        tagRepository.findAllTodaysHolidays(currentDateTime);
      const activeHolidays = tagRepository.findActiveHolidays(currentDateTime);

      // Both should find both holidays
      expect(todaysHolidays.length).toBe(2);
      expect(activeHolidays.length).toBe(2);

      const todayIds = todaysHolidays.map(h => h.tagId).sort();
      const activeIds = activeHolidays.map(h => h.tagId).sort();

      expect(todayIds).toEqual(['holiday-season', 'holiday-specific']);
      expect(activeIds).toEqual(['holiday-season', 'holiday-specific']);
    });

    it('should not find holidays outside date ranges', () => {
      const today = new Date();

      // Create holiday with specific date from next month
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthDay =
        String(nextMonth.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(nextMonth.getDate()).padStart(2, '0');

      const futureHoliday = new Tag(
        'holiday-future',
        'Future Holiday',
        TagType.Holiday,
        [nextMonthDay],
        [],
      );

      // Create holiday with season range from last month
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const pastMonth = new Date(today);
      pastMonth.setMonth(pastMonth.getMonth() - 1);
      pastMonth.setDate(pastMonth.getDate() - 5);

      const pastHoliday = new Tag(
        'holiday-past',
        'Past Holiday',
        TagType.Holiday,
        [],
        [],
        formatDateToISO(pastMonth),
        formatDateToISO(lastMonth),
      );

      tagRepository.create(futureHoliday);
      tagRepository.create(pastHoliday);

      // Test that neither is found for today
      const currentDateTime = formatDateToISO(today);
      const todaysHolidays =
        tagRepository.findAllTodaysHolidays(currentDateTime);
      const activeHolidays = tagRepository.findActiveHolidays(currentDateTime);

      expect(todaysHolidays.length).toBe(0);
      expect(activeHolidays.length).toBe(0);
    });

    it('should handle holidays with multiple specific dates', () => {
      const today = new Date();
      const todayMonthDay =
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0');

      // Create dates around today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowMonthDay =
        String(tomorrow.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(tomorrow.getDate()).padStart(2, '0');

      const multiDateHoliday = new Tag(
        'holiday-multi-date',
        'Multi Date Holiday',
        TagType.Holiday,
        [todayMonthDay, tomorrowMonthDay], // Today and tomorrow
        [],
      );

      tagRepository.create(multiDateHoliday);

      // Should find it today
      const currentDateTime = formatDateToISO(today);
      const todaysHolidays =
        tagRepository.findAllTodaysHolidays(currentDateTime);
      expect(todaysHolidays.length).toBe(1);
      expect(todaysHolidays[0].holidayDates).toContain(todayMonthDay);
      expect(todaysHolidays[0].holidayDates).toContain(tomorrowMonthDay);

      // Should also find it tomorrow
      const tomorrowDateTime = formatDateToISO(tomorrow);
      const tomorrowsHolidays =
        tagRepository.findAllTodaysHolidays(tomorrowDateTime);
      expect(tomorrowsHolidays.length).toBe(1);
      expect(tomorrowsHolidays[0].tagId).toBe('holiday-multi-date');
    });
  });
});
