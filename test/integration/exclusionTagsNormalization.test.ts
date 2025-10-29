import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';
import { tagRepository } from '../../src/repositories/tagsRepository';
import { sqliteService, getDB } from '../../src/db/sqlite';

describe('Exclusion Tags Normalization Integration', () => {
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

  describe('Normalized exclusion tags functionality', () => {
    it('should store and retrieve exclusion tags in normalized table', () => {
      // Create some genre tags to exclude
      const horrorTag = new Tag('horror', 'Horror', TagType.Genre);
      const thrillerTag = new Tag('thriller', 'Thriller', TagType.Genre);
      const comedyTag = new Tag('comedy', 'Comedy', TagType.Genre);

      tagRepository.create(horrorTag);
      tagRepository.create(thrillerTag);
      tagRepository.create(comedyTag);

      // Create holiday tag with exclusions
      const christmasTag = new Tag(
        'christmas-family',
        'Family Christmas',
        TagType.Holiday,
        ['12-24', '12-25', '12-26'],
        ['horror', 'thriller'], // Exclude horror and thriller during Christmas
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
        true, // explicitlyHoliday
      );

      const created = tagRepository.create(christmasTag);

      // Verify the tag was created with exclusions
      expect(created.exclusionTags).toEqual(['horror', 'thriller']);
      expect(created.isExplicitlyHoliday()).toBe(true);

      // Verify exclusion tags are stored in normalized table
      const db = getDB();
      const exclusionRows = db
        .prepare(
          `
          SELECT excludedTagId FROM holiday_exclusion_tags 
          WHERE holidayTagId = ? 
          ORDER BY excludedTagId
        `,
        )
        .all(created.tagId) as { excludedTagId: string }[];

      expect(exclusionRows.length).toBe(2);
      expect(exclusionRows[0].excludedTagId).toBe('horror');
      expect(exclusionRows[1].excludedTagId).toBe('thriller');
    });

    it('should update exclusion tags correctly', () => {
      // Create genre tags
      const horrorTag = new Tag('horror', 'Horror', TagType.Genre);
      const actionTag = new Tag('action', 'Action', TagType.Genre);
      const dramaTag = new Tag('drama', 'Drama', TagType.Genre);

      tagRepository.create(horrorTag);
      tagRepository.create(actionTag);
      tagRepository.create(dramaTag);

      // Create holiday tag with initial exclusions
      const holidayTag = new Tag(
        'new-years',
        'New Years Eve',
        TagType.Holiday,
        ['12-31'],
        ['horror'], // Initially exclude only horror
        '2024-12-31 00:00:00',
        '2024-12-31 23:59:59',
        false,
      );

      const created = tagRepository.create(holidayTag);
      expect(created.exclusionTags).toEqual(['horror']);

      // Update to exclude different tags
      const updatedTag = new Tag(
        created.tagId,
        created.name,
        TagType.Holiday,
        created.holidayDates,
        ['action', 'drama'], // Now exclude action and drama instead
        created.seasonStartDate,
        created.seasonEndDate,
        created.explicitlyHoliday,
      );

      const updated = tagRepository.update(created.tagId, updatedTag);
      expect(updated!.exclusionTags).toEqual(['action', 'drama']);

      // Verify database reflects the changes
      const db = getDB();
      const exclusionRows = db
        .prepare(
          `
          SELECT excludedTagId FROM holiday_exclusion_tags 
          WHERE holidayTagId = ? 
          ORDER BY excludedTagId
        `,
        )
        .all(created.tagId) as { excludedTagId: string }[];

      expect(exclusionRows.length).toBe(2);
      expect(exclusionRows[0].excludedTagId).toBe('action');
      expect(exclusionRows[1].excludedTagId).toBe('drama');
    });

    it('should handle empty exclusion tags', () => {
      // Create holiday tag without exclusions
      const holidayTag = new Tag(
        'valentines',
        'Valentine Day',
        TagType.Holiday,
        ['02-14'],
        [], // No exclusions
        '2024-02-14 00:00:00',
        '2024-02-14 23:59:59',
      );

      const created = tagRepository.create(holidayTag);
      expect(created.exclusionTags).toEqual([]);

      // Verify no exclusion entries in database
      const db = getDB();
      const exclusionRows = db
        .prepare(
          `
          SELECT excludedTagId FROM holiday_exclusion_tags 
          WHERE holidayTagId = ?
        `,
        )
        .all(created.tagId);

      expect(exclusionRows.length).toBe(0);
    });

    it('should cascade delete exclusion tags when holiday tag is deleted', () => {
      // Create genre tags
      const horrorTag = new Tag('horror', 'Horror', TagType.Genre);
      const actionTag = new Tag('action', 'Action', TagType.Genre);

      tagRepository.create(horrorTag);
      tagRepository.create(actionTag);

      // Create holiday tag with exclusions
      const halloweenTag = new Tag(
        'halloween-spooky',
        'Spooky Halloween',
        TagType.Holiday,
        ['10-31'],
        ['horror', 'action'],
        '2024-10-01 00:00:00',
        '2024-10-31 23:59:59',
      );

      const created = tagRepository.create(halloweenTag);

      // Verify exclusions exist
      const db = getDB();
      let exclusionRows = db
        .prepare(`SELECT * FROM holiday_exclusion_tags WHERE holidayTagId = ?`)
        .all(created.tagId);
      expect(exclusionRows.length).toBe(2);

      // Delete the holiday tag
      const deleted = tagRepository.delete(created.tagId);
      expect(deleted).toBe(true);

      // Verify exclusion tags are cascade deleted
      exclusionRows = db
        .prepare(`SELECT * FROM holiday_exclusion_tags WHERE holidayTagId = ?`)
        .all(created.tagId);
      expect(exclusionRows.length).toBe(0);
    });

    it('should maintain referential integrity for exclusion tags', () => {
      // Try to create holiday tag with non-existent exclusion tag
      const invalidHolidayTag = new Tag(
        'invalid-holiday',
        'Invalid Holiday',
        TagType.Holiday,
        ['01-01'],
        ['nonexistent-tag'], // This tag doesn't exist
      );

      // Should fail due to foreign key constraint
      expect(() => {
        tagRepository.create(invalidHolidayTag);
      }).toThrow('FOREIGN KEY constraint failed');
    });
  });
});
