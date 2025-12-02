import { createTag } from "../../../factories/tag.factory";

/**
 * Holiday test tags for Kaleidoscope testing
 * Based on docs/taxonomies/holidays/index.md
 */

export const holidayTags = {
  // Major Western holidays with seasonal periods
  christmas: createTag(
    "christmas",
    "Christmas",
    TagType.Holiday,
    undefined,
    ["2024-12-24", "2024-12-25"], // holidayDates
    undefined, // exclusionGenres
    "2024-12-01 00:00:00", // seasonStartDate (DATETIME)
    "2024-12-31 23:59:59" // seasonEndDate (DATETIME)
  ),

  halloween: createTag(
    "halloween",
    "Halloween",
    TagType.Holiday,
    undefined,
    ["2024-10-31"], // holidayDates
    undefined, // exclusionGenres
    "2024-10-01 00:00:00", // seasonStartDate (DATETIME)
    "2024-11-04 23:59:59" // seasonEndDate (DATETIME)
  ),

  valentine: createTag(
    "valentine",
    "Valentine's Day",
    TagType.Holiday,
    undefined,
    ["2024-02-14"], // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),

  summer: createTag(
    "summer",
    "Independence Day",
    TagType.Holiday,
    undefined,
    ["2024-07-04"], // holidayDates (US Independence Day example)
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),

  newYear: createTag(
    "new-year",
    "New Year",
    TagType.Holiday,
    undefined,
    ["2024-01-01"], // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),
};

export const holidayTagsList = Object.values(holidayTags);
