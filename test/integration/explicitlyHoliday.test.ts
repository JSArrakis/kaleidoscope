import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';
import { tagRepository } from '../../src/repositories/tagsRepository';
import { sqliteService, getDB } from '../../src/db/sqlite';

describe('ExplicitlyHoliday Field Integration', () => {
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

  describe('explicitlyHoliday field functionality', () => {
    it('should create holiday tag with explicitlyHoliday=false by default', () => {
      const holiday = new Tag(
        'general-christmas',
        'General Christmas',
        TagType.Holiday,
        ['12-25'],
        [],
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
        // explicitlyHoliday not specified, should default to false
      );

      const created = tagRepository.create(holiday);

      expect(created.explicitlyHoliday).toBe(false);
      expect(created.tagId).toBe('general-christmas');
      expect(created.name).toBe('General Christmas');
    });

    it('should create holiday tag with explicitlyHoliday=true for restricted content', () => {
      const explicitHoliday = new Tag(
        'exclusive-christmas',
        'Exclusive Christmas',
        TagType.Holiday,
        ['12-25'],
        [],
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
        true, // explicitlyHoliday = true
      );

      const created = tagRepository.create(explicitHoliday);

      expect(created.explicitlyHoliday).toBe(true);
      expect(created.tagId).toBe('exclusive-christmas');
      expect(created.name).toBe('Exclusive Christmas');
    });

    it('should store explicitlyHoliday as integer in database and convert back to boolean', () => {
      // Create tag with explicitlyHoliday=true
      const holiday = new Tag(
        'test-explicit-holiday',
        'Test Explicit Holiday',
        TagType.Holiday,
        ['10-31'],
        [],
        undefined,
        undefined,
        true, // explicitlyHoliday = true
      );

      const created = tagRepository.create(holiday);

      // Verify database stores as integer
      const db = getDB();
      const row = db
        .prepare(
          `
        SELECT explicitlyHoliday FROM tags WHERE tagId = ?
      `,
        )
        .get(created.tagId) as { explicitlyHoliday: number };

      expect(row.explicitlyHoliday).toBe(1); // Stored as 1 in database

      // Verify retrieval converts back to boolean
      const retrieved = tagRepository.findByTagId('test-explicit-holiday');
      expect(retrieved?.explicitlyHoliday).toBe(true);
    });

    it('should update explicitlyHoliday field', () => {
      // Create with explicitlyHoliday=false
      const holiday = new Tag(
        'updatable-holiday',
        'Updatable Holiday',
        TagType.Holiday,
        ['07-04'],
        [],
        undefined,
        undefined,
        false, // explicitlyHoliday = false
      );

      const created = tagRepository.create(holiday);
      expect(created.explicitlyHoliday).toBe(false);

      // Update to explicitlyHoliday=true
      const updatedTag = new Tag(
        created.tagId,
        created.name,
        TagType.Holiday,
        ['07-04'],
        [],
        undefined,
        undefined,
        true, // Change to true
      );

      const updated = tagRepository.update(created.tagId, updatedTag);
      expect(updated!.explicitlyHoliday).toBe(true);

      // Verify in database
      const retrieved = tagRepository.findByTagId('updatable-holiday');
      expect(retrieved?.explicitlyHoliday).toBe(true);
    });

    it('should handle non-holiday tags with explicitlyHoliday field (should be false)', () => {
      const genre = new Tag('test-genre', 'Test Genre', TagType.Genre);

      const created = tagRepository.create(genre);

      expect(created.explicitlyHoliday).toBe(false);
      expect(created.type).toBe(TagType.Genre);
    });

    it('should handle createHoliday helper method with explicitlyHoliday parameter', () => {
      // Create exclusion tag first
      const familyTag = new Tag('family', 'Family Genre', TagType.Genre);
      tagRepository.create(familyTag);

      // Test with explicitlyHoliday=true
      const explicitHoliday = tagRepository.createHoliday(
        'explicit-halloween',
        'Explicit Halloween',
        ['10-31'],
        ['family'],
        '2024-10-01 00:00:00',
        '2024-10-31 23:59:59',
        true, // explicitlyHoliday
      );

      expect(explicitHoliday.explicitlyHoliday).toBe(true);
      expect(explicitHoliday.name).toBe('Explicit Halloween');

      // Test with explicitlyHoliday=false
      const generalHoliday = tagRepository.createHoliday(
        'general-halloween',
        'General Halloween',
        ['10-31'],
        [],
        undefined,
        undefined,
        false, // explicitlyHoliday
      );

      expect(generalHoliday.explicitlyHoliday).toBe(false);
      expect(generalHoliday.name).toBe('General Halloween');
    });

    it('should use false as default when explicitlyHoliday is not specified in createHoliday', () => {
      const holiday = tagRepository.createHoliday(
        'default-holiday',
        'Default Holiday',
        ['01-01'],
        [],
        // explicitlyHoliday not specified
      );

      expect(holiday.explicitlyHoliday).toBe(false);
    });
  });

  describe('business logic scenarios', () => {
    beforeEach(() => {
      // Create test tags for business scenarios
      tagRepository.createHoliday(
        'horror-general',
        'Horror General',
        ['10-31'],
        [],
        undefined,
        undefined,
        false, // Can play anytime
      );

      tagRepository.createHoliday(
        'horror-exclusive',
        'Horror Exclusive',
        ['10-31'],
        [],
        '2024-10-01 00:00:00',
        '2024-10-31 23:59:59',
        true, // Only during Halloween season
      );

      tagRepository.createHoliday(
        'christmas-general',
        'Christmas General',
        ['12-25'],
        [],
        undefined,
        undefined,
        false, // Can play anytime
      );

      tagRepository.createHoliday(
        'christmas-exclusive',
        'Christmas Exclusive',
        ['12-25'],
        [],
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
        true, // Only during Christmas season
      );
    });

    it('should distinguish between general holiday content and exclusive holiday content', () => {
      const allHolidays = tagRepository.findAllHolidays();
      expect(allHolidays.length).toBe(4);

      // General holiday content (can play anytime)
      const generalContent = allHolidays.filter(h => !h.explicitlyHoliday);
      expect(generalContent.length).toBe(2);
      expect(generalContent.map(h => h.name)).toContain('Horror General');
      expect(generalContent.map(h => h.name)).toContain('Christmas General');

      // Exclusive holiday content (only during holiday periods)
      const exclusiveContent = allHolidays.filter(h => h.explicitlyHoliday);
      expect(exclusiveContent.length).toBe(2);
      expect(exclusiveContent.map(h => h.name)).toContain('Horror Exclusive');
      expect(exclusiveContent.map(h => h.name)).toContain(
        'Christmas Exclusive',
      );
    });

    it('should support filtering holidays by explicitlyHoliday status', () => {
      const db = getDB();

      // Query for exclusive holiday content only
      const exclusiveHolidays = db
        .prepare(
          `
        SELECT * FROM tags WHERE type = 'Holiday' AND explicitlyHoliday = 1
      `,
        )
        .all() as any[];

      expect(exclusiveHolidays.length).toBe(2);
      const exclusiveNames = exclusiveHolidays.map(h => h.name);
      expect(exclusiveNames).toContain('Horror Exclusive');
      expect(exclusiveNames).toContain('Christmas Exclusive');

      // Query for general holiday content
      const generalHolidays = db
        .prepare(
          `
        SELECT * FROM tags WHERE type = 'Holiday' AND explicitlyHoliday = 0
      `,
        )
        .all() as any[];

      expect(generalHolidays.length).toBe(2);
      const generalNames = generalHolidays.map(h => h.name);
      expect(generalNames).toContain('Horror General');
      expect(generalNames).toContain('Christmas General');
    });
  });
});
