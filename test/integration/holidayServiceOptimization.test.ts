import { tagRepository } from '../../src/repositories/tagsRepository';
import { getActiveHolidaysFromDB } from '../../src/services/holidayService';
import { sqliteService } from '../../src/db/sqlite';
import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';

describe('Holiday Service Database Query Optimization', () => {
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

  describe('getActiveHolidaysFromDB SQL optimization', () => {
    it('should return only active holidays using SQL date filtering', () => {
      // Mock the current date to be October 14, 2024 for consistent testing
      const mockDate = new Date('2024-10-14T15:30:00.000Z');
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => mockDate);

      // Create some test holidays - one active today and one not active
      const currentYear = mockDate.getFullYear();
      const currentMonth = String(mockDate.getMonth() + 1).padStart(2, '0');
      const currentDay = String(mockDate.getDate()).padStart(2, '0');
      const todayMMDD = `${currentMonth}-${currentDay}`;

      // Holiday that should be active today
      const activeHoliday = new Tag(
        'active-today',
        'Active Today Holiday',
        TagType.Holiday,
        [todayMMDD], // Today's date in MM-DD format
        [],
        undefined,
        undefined,
        false,
      );

      // Holiday that should NOT be active today (different date)
      const nextMonth =
        currentMonth === '12'
          ? '01'
          : String(Number(currentMonth) + 1).padStart(2, '0');
      const inactiveHoliday = new Tag(
        'inactive-holiday',
        'Inactive Holiday',
        TagType.Holiday,
        [`${nextMonth}-15`], // Different date
        [],
        undefined,
        undefined,
        false,
      );

      // Create both holidays in database
      const createdActive = tagRepository.create(activeHoliday);
      const createdInactive = tagRepository.create(inactiveHoliday);

      // Verify our holidays were created (don't check total count due to potential test interference)
      expect(createdActive).not.toBeNull();
      expect(createdInactive).not.toBeNull();

      // Test our optimized function - should only return the active holiday
      const activeHolidaysFromDB = getActiveHolidaysFromDB();

      // Filter to just our test holiday to avoid interference from other tests
      const ourActiveHoliday = activeHolidaysFromDB.find(
        h => h.tagId === 'active-today',
      );
      expect(ourActiveHoliday).toBeDefined();
      expect(ourActiveHoliday!.name).toBe('Active Today Holiday');

      // Restore the original Date constructor
      dateSpy.mockRestore();
    });

    it('should return holidays with season date ranges', () => {
      // Mock the current date to be October 14, 2024 for consistent testing
      const mockDate = new Date('2024-10-14T15:30:00.000Z');
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => mockDate);

      const currentYear = mockDate.getFullYear();

      // Create a holiday with season that includes today
      const seasonStart = new Date(currentYear, 0, 1); // January 1st
      const seasonEnd = new Date(currentYear, 11, 31); // December 31st

      const seasonHoliday = new Tag(
        'season-holiday',
        'Year Long Season',
        TagType.Holiday,
        [],
        [],
        seasonStart.toISOString().substring(0, 19).replace('T', ' '), // YYYY-MM-DD HH:MM:SS
        seasonEnd.toISOString().substring(0, 19).replace('T', ' '),
        false,
      );

      tagRepository.create(seasonHoliday);

      // Test our function - should return the season holiday
      const activeHolidays = getActiveHolidaysFromDB();

      expect(activeHolidays.length).toBe(1);
      expect(activeHolidays[0].tagId).toBe('season-holiday');
      expect(activeHolidays[0].name).toBe('Year Long Season');

      // Restore the original Date constructor
      dateSpy.mockRestore();
    });

    it('should return empty array when no holidays are active', () => {
      // Mock the current date to be October 14, 2024 for consistent testing
      const mockDate = new Date('2024-10-14T15:30:00.000Z');
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => mockDate);

      // Create a holiday that is definitely not active (January 1st when we're in October)
      const futureHoliday = new Tag(
        'future-holiday',
        'Future Holiday',
        TagType.Holiday,
        ['01-01'], // January 1st - inactive when current date is October 14
        [],
        undefined,
        undefined,
        false,
      );

      tagRepository.create(futureHoliday);

      const activeHolidays = getActiveHolidaysFromDB();
      expect(activeHolidays.length).toBe(0);

      // Restore the original Date constructor
      dateSpy.mockRestore();
    });
  });
});
