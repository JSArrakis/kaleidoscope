import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';
import { tagRepository } from '../../src/repositories/tagsRepository';
import { sqliteService } from '../../src/db/sqlite';
import { isDateInHolidayDates, isDateInRange } from '../../src/utils/utilities';

describe('Holiday Dates Table Integration', () => {
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

  describe('Holiday dates table operations', () => {
    it('should create holiday tag with multiple dates and store them in separate table', () => {
      // Create exclusion tag first
      const horrorTag = new Tag('Horror', 'Horror Genre', TagType.Genre);
      tagRepository.create(horrorTag);

      const holidayTag = new Tag(
        'holiday-christmas',
        'Christmas Season',
        TagType.Holiday,
        ['12-24', '12-25', '12-26'],
        ['Horror'],
        '2025-12-01 00:00:00',
        '2025-12-31 23:59:59',
      );

      const created = tagRepository.create(holidayTag);

      expect(created.tagId).toBe('holiday-christmas');
      expect(created.name).toBe('Christmas Season');
      expect(created.type).toBe(TagType.Holiday);
      expect(created.holidayDates).toEqual(['12-24', '12-25', '12-26']);
      expect(created.exclusionTags).toEqual(['Horror']);
      expect(created.seasonStartDate).toBe('2025-12-01 00:00:00');
      expect(created.seasonEndDate).toBe('2025-12-31 23:59:59');
    });

    it('should retrieve holiday tag with dates from separate table', () => {
      // Create tag first
      const holidayTag = new Tag(
        'holiday-valentines',
        'Valentine Day',
        TagType.Holiday,
        ['02-14'],
        [],
        '2025-02-10 00:00:00',
        '2025-02-18 23:59:59',
      );

      tagRepository.create(holidayTag);

      // Retrieve and verify
      const retrieved = tagRepository.findByTagId('holiday-valentines');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.holidayDates).toEqual(['02-14']);
      expect(retrieved!.seasonStartDate).toBe('2025-02-10 00:00:00');
      expect(retrieved!.seasonEndDate).toBe('2025-02-18 23:59:59');
    });

    it('should update holiday dates by replacing all entries', () => {
      // Create initial tag
      const initialTag = new Tag(
        'holiday-easter',
        'Easter Period',
        TagType.Holiday,
        ['04-01', '04-02'],
        [],
        '2025-03-30 00:00:00',
        '2025-04-06 23:59:59',
      );

      tagRepository.create(initialTag);

      // Update with different dates
      const updatedTag = new Tag(
        'holiday-easter',
        'Easter Extended',
        TagType.Holiday,
        ['03-30', '03-31', '04-01', '04-02', '04-03'],
        [],
        '2025-03-28 00:00:00',
        '2025-04-08 23:59:59',
      );

      const result = tagRepository.update('holiday-easter', updatedTag);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Easter Extended');
      expect(result!.holidayDates).toEqual([
        '03-30',
        '03-31',
        '04-01',
        '04-02',
        '04-03',
      ]);
      expect(result!.seasonStartDate).toBe('2025-03-28 00:00:00');
      expect(result!.seasonEndDate).toBe('2025-04-08 23:59:59');
    });

    it('should delete holiday tag and cascade delete all holiday dates', () => {
      // Create exclusion tag first
      const christmasTag = new Tag(
        'Christmas',
        'Christmas Holiday',
        TagType.Holiday,
      );
      tagRepository.create(christmasTag);

      // Create tag with dates
      const holidayTag = new Tag(
        'holiday-halloween',
        'Halloween',
        TagType.Holiday,
        ['10-31'],
        ['Christmas'],
        '2025-10-25 00:00:00',
        '2025-11-01 23:59:59',
      );

      tagRepository.create(holidayTag);

      // Verify it exists
      let retrieved = tagRepository.findByTagId('holiday-halloween');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.holidayDates).toEqual(['10-31']);

      // Delete it
      const deleted = tagRepository.delete('holiday-halloween');
      expect(deleted).toBe(true);

      // Verify it's gone
      retrieved = tagRepository.findByTagId('holiday-halloween');
      expect(retrieved).toBeNull();
    });

    it('should handle non-holiday tags without holiday dates', () => {
      const genreTag = new Tag('genre-comedy', 'Comedy', TagType.Genre);

      const created = tagRepository.create(genreTag);

      expect(created.tagId).toBe('genre-comedy');
      expect(created.name).toBe('Comedy');
      expect(created.type).toBe(TagType.Genre);
      expect(created.holidayDates).toBeUndefined();
    });

    it('should work with utility functions for holiday date matching', () => {
      // Create holiday tag
      const christmasTag = new Tag(
        'holiday-christmas-2025',
        'Christmas 2025',
        TagType.Holiday,
        ['12-24', '12-25', '12-26'],
        [],
        '2025-12-20 00:00:00',
        '2025-12-31 23:59:59',
      );

      const created = tagRepository.create(christmasTag);

      // Test holiday dates matching (using local dates to avoid timezone issues)
      const testDate25 = new Date(2025, 11, 25); // December 25, 2025 (months are 0-indexed)
      const testDate24 = new Date(2025, 11, 24); // December 24, 2025
      const testDate23 = new Date(2025, 11, 23); // December 23, 2025

      expect(isDateInHolidayDates(testDate25, created.holidayDates!)).toBe(
        true,
      );
      expect(isDateInHolidayDates(testDate24, created.holidayDates!)).toBe(
        true,
      );
      expect(isDateInHolidayDates(testDate23, created.holidayDates!)).toBe(
        false,
      );

      // Test season range matching (using local dates to avoid timezone issues)
      const testDate25Range = new Date(2025, 11, 25, 12, 0, 0); // December 25, 2025 at noon
      const testDate19Range = new Date(2025, 11, 19, 12, 0, 0); // December 19, 2025 (should be false)
      const testDate31Range = new Date(2025, 11, 31, 12, 0, 0); // December 31, 2025 at noon (should be true)

      expect(
        isDateInRange(
          testDate25Range,
          created.seasonStartDate!,
          created.seasonEndDate!,
        ),
      ).toBe(true);
      expect(
        isDateInRange(
          testDate19Range,
          created.seasonStartDate!,
          created.seasonEndDate!,
        ),
      ).toBe(false);
      expect(
        isDateInRange(
          testDate31Range,
          created.seasonStartDate!,
          created.seasonEndDate!,
        ),
      ).toBe(true);
    });

    it('should handle empty holiday dates array', () => {
      const holidayTag = new Tag(
        'holiday-empty',
        'Holiday Without Specific Dates',
        TagType.Holiday,
        [], // Empty array
        [],
        '2025-07-01 00:00:00',
        '2025-07-07 23:59:59',
      );

      const created = tagRepository.create(holidayTag);

      expect(created.holidayDates).toEqual([]);
    });

    it('should handle holiday tag update that removes all holiday dates', () => {
      // Create with dates
      const initialTag = new Tag(
        'holiday-temp',
        'Temporary Holiday',
        TagType.Holiday,
        ['06-01', '06-02'],
        [],
        '2025-06-01 00:00:00',
        '2025-06-02 23:59:59',
      );

      tagRepository.create(initialTag);

      // Update to remove all dates
      const updatedTag = new Tag(
        'holiday-temp',
        'Updated Holiday',
        TagType.Holiday,
        [], // Remove all dates
        [],
        '2025-06-01 00:00:00',
        '2025-06-02 23:59:59',
      );

      const result = tagRepository.update('holiday-temp', updatedTag);

      expect(result).not.toBeNull();
      expect(result!.holidayDates).toEqual([]);
    });
  });
});
