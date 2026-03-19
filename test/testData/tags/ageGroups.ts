import { createTag } from "../../../factories/tag.factory";

/**
 * Age Group test tags for Kaleidoscope testing
 * Based on docs/taxonomies/age-groups/index.md
 *
 * Sequence: Kids (1), Family (2), Young Adult (3), Mature (4)
 */

export const ageGroupTags = {
  kids: createTag(
    "kids",
    "Kids",
    TagType.AgeGroup,
    1, // sequence
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),

  family: createTag(
    "family",
    "Family",
    TagType.AgeGroup,
    2, // sequence
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),

  youngAdult: createTag(
    "young-adult",
    "Young Adult",
    TagType.AgeGroup,
    3, // sequence
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),

  mature: createTag(
    "mature",
    "Mature",
    TagType.AgeGroup,
    4, // sequence
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined // seasonEndDate
  ),
};

export const ageGroupTagsList = Object.values(ageGroupTags);
