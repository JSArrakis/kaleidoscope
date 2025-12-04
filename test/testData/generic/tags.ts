import { createTag } from "../../../factories/tag.factory";

/**
 * Generic test tags for buffer pool validation testing
 * Designed for comprehensive coverage of variability scenarios
 */

export const genericGenreTags = {
  genre1: createTag("Genre A", "genreA", TagType.Genre),
  genre2: createTag("Genre B", "genreB", TagType.Genre),
  genre3: createTag("Genre C", "genreC", TagType.Genre),
};

export const genericAgeGroupTags = {
  ageGroup1: createTag("Age Group 1", "ageGroup1", TagType.AgeGroup, 1),
  ageGroup2: createTag("Age Group 2", "ageGroup2", TagType.AgeGroup, 2),
  ageGroup3: createTag("Age Group 3", "ageGroup3", TagType.AgeGroup, 3),
};

export const genericHolidayTags = {
  holiday1: createTag("Generic Holiday 1", "holiday1", TagType.Holiday),
  holiday2: createTag("Generic Holiday 2", "holiday2", TagType.Holiday),
};

export const genericSpecialtyTags = {
  specialty1: createTag("Specialty 1", "specialty1", TagType.Specialty),
  specialty2: createTag("Specialty 2", "specialty2", TagType.Specialty),
};

export const allGenericTags = [
  ...Object.values(genericGenreTags),
  ...Object.values(genericAgeGroupTags),
  ...Object.values(genericHolidayTags),
  ...Object.values(genericSpecialtyTags),
];
