import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Holiday test tags for Kaleidoscope testing
 * Based on docs/taxonomies/holidays/index.md
 */

export const holidayTags = {
  // Major Western holidays with seasonal periods
  christmas: new Tag(
    'christmas',
    'Christmas',
    TagType.Holiday,
    ['2024-12-24', '2024-12-25'], // holidayDates
    undefined, // exclusionGenres
    '2024-12-01 00:00:00', // seasonStartDate (DATETIME)
    '2024-12-31 23:59:59', // seasonEndDate (DATETIME)
  ),

  halloween: new Tag(
    'halloween',
    'Halloween',
    TagType.Holiday,
    ['2024-10-31'], // holidayDates
    undefined, // exclusionGenres
    '2024-10-01 00:00:00', // seasonStartDate (DATETIME)
    '2024-11-04 23:59:59', // seasonEndDate (DATETIME)
  ),

  valentine: new Tag(
    'valentine',
    "Valentine's Day",
    TagType.Holiday,
    ['2024-02-14'], // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
  ),

  summer: new Tag(
    'summer',
    'Independence Day',
    TagType.Holiday,
    ['2024-07-04'], // holidayDates (US Independence Day example)
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
  ),

  newYear: new Tag(
    'new-year',
    'New Year',
    TagType.Holiday,
    ['2024-01-01'], // holidayDates
    undefined, // exclusionGenres
    '2023-12-28', // seasonStartDate
    '2024-01-07', // seasonEndDate
  ),
};

export const holidayTagsList = Object.values(holidayTags);
