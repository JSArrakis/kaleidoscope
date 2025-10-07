import { Tag } from '../../../src/models/tag';
import { TagType } from '../../../src/models/const/tagTypes';

/**
 * Age Group test tags for Kaleidoscope testing
 * Based on docs/taxonomies/age-groups/index.md
 *
 * Sequence: Kids (1), Family (2), Young Adult (3), Mature (4)
 */

export const ageGroupTags = {
  kids: new Tag(
    'kids',
    'Kids',
    TagType.AgeGroup,
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
    1, // sequence
  ),

  family: new Tag(
    'family',
    'Family',
    TagType.AgeGroup,
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
    2, // sequence
  ),

  youngAdult: new Tag(
    'young-adult',
    'Young Adult',
    TagType.AgeGroup,
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
    3, // sequence
  ),

  mature: new Tag(
    'mature',
    'Mature',
    TagType.AgeGroup,
    undefined, // holidayDates
    undefined, // exclusionGenres
    undefined, // seasonStartDate
    undefined, // seasonEndDate
    4, // sequence
  ),
};

export const ageGroupTagsList = Object.values(ageGroupTags);
