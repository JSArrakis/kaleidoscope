import { TagType } from '../../src/models/const/tagTypes';
import { Tag } from '../../src/models/tag';

describe('Tag Helper Methods for ExplicitlyHoliday', () => {
  describe('isExplicitlyHoliday()', () => {
    it('should return true for explicitly holiday tags', () => {
      const explicitTag = new Tag(
        'explicit-christmas',
        'Explicit Christmas',
        TagType.Holiday,
        ['12-25'],
        [],
        undefined,
        undefined,
        true, // explicitlyHoliday = true
      );

      expect(explicitTag.isExplicitlyHoliday()).toBe(true);
    });

    it('should return false for general holiday tags', () => {
      const generalTag = new Tag(
        'general-christmas',
        'General Christmas',
        TagType.Holiday,
        ['12-25'],
        [],
        undefined,
        undefined,
        false, // explicitlyHoliday = false
      );

      expect(generalTag.isExplicitlyHoliday()).toBe(false);
    });

    it('should return false for non-holiday tags', () => {
      const genreTag = new Tag('horror', 'Horror', TagType.Genre);

      expect(genreTag.isExplicitlyHoliday()).toBe(false);
    });

    it('should return false when explicitlyHoliday is undefined', () => {
      const undefinedTag = new Tag(
        'undefined-holiday',
        'Undefined Holiday',
        TagType.Holiday,
        ['12-25'],
        // explicitlyHoliday not specified (undefined)
      );

      expect(undefinedTag.isExplicitlyHoliday()).toBe(false);
    });
  });

  describe('canPlayAnytime()', () => {
    it('should return false for explicitly holiday tags (restricted)', () => {
      const explicitTag = new Tag(
        'explicit-halloween',
        'Explicit Halloween',
        TagType.Holiday,
        ['10-31'],
        [],
        undefined,
        undefined,
        true, // explicitlyHoliday = true
      );

      expect(explicitTag.canPlayAnytime()).toBe(false);
    });

    it('should return true for general holiday tags (can play anytime)', () => {
      const generalTag = new Tag(
        'general-halloween',
        'General Halloween',
        TagType.Holiday,
        ['10-31'],
        [],
        undefined,
        undefined,
        false, // explicitlyHoliday = false
      );

      expect(generalTag.canPlayAnytime()).toBe(true);
    });

    it('should return true for non-holiday tags', () => {
      const genreTag = new Tag('action', 'Action', TagType.Genre);

      expect(genreTag.canPlayAnytime()).toBe(true);
    });
  });

  describe('business scenarios with helper methods', () => {
    it('should help identify content scheduling restrictions', () => {
      // Create different types of holiday content
      const christmasGeneral = new Tag(
        'christmas-general',
        'Christmas General',
        TagType.Holiday,
        ['12-25'],
        [],
        undefined,
        undefined,
        false, // Can play anytime
      );

      const christmasExclusive = new Tag(
        'christmas-exclusive',
        'Christmas Exclusive',
        TagType.Holiday,
        ['12-25'],
        [],
        '2024-12-01 00:00:00',
        '2024-12-31 23:59:59',
        true, // Only during Christmas season
      );

      const horrorGenre = new Tag('horror', 'Horror', TagType.Genre);

      // Business logic examples
      expect(christmasGeneral.canPlayAnytime()).toBe(true);
      expect(christmasGeneral.isExplicitlyHoliday()).toBe(false);

      expect(christmasExclusive.canPlayAnytime()).toBe(false);
      expect(christmasExclusive.isExplicitlyHoliday()).toBe(true);

      expect(horrorGenre.canPlayAnytime()).toBe(true);
      expect(horrorGenre.isExplicitlyHoliday()).toBe(false);
    });

    it('should support filtering content for scheduling', () => {
      const tags = [
        new Tag(
          'horror-general',
          'Horror General',
          TagType.Holiday,
          ['10-31'],
          [],
          undefined,
          undefined,
          false,
        ),
        new Tag(
          'horror-exclusive',
          'Horror Exclusive',
          TagType.Holiday,
          ['10-31'],
          [],
          undefined,
          undefined,
          true,
        ),
        new Tag(
          'christmas-general',
          'Christmas General',
          TagType.Holiday,
          ['12-25'],
          [],
          undefined,
          undefined,
          false,
        ),
        new Tag(
          'christmas-exclusive',
          'Christmas Exclusive',
          TagType.Holiday,
          ['12-25'],
          [],
          undefined,
          undefined,
          true,
        ),
        new Tag('action', 'Action', TagType.Genre),
      ];

      // Content that can play anytime (including outside holiday periods)
      const anytimeContent = tags.filter(tag => tag.canPlayAnytime());
      expect(anytimeContent.length).toBe(3); // horror-general, christmas-general, action

      // Content restricted to holiday periods only
      const restrictedContent = tags.filter(tag => tag.isExplicitlyHoliday());
      expect(restrictedContent.length).toBe(2); // horror-exclusive, christmas-exclusive

      // Holiday content that can play anytime (good for year-round availability)
      const flexibleHolidayContent = tags.filter(
        tag => tag.isHoliday() && tag.canPlayAnytime(),
      );
      expect(flexibleHolidayContent.length).toBe(2); // horror-general, christmas-general
    });
  });
});
