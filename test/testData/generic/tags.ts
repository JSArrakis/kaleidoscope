import { createTag } from "../../../factories/tag.factory";

/**
 * Generic test tags for buffer pool validation testing
 * Designed for comprehensive coverage of variability scenarios
 */

export const genericGenreTags = {
  genre1: createTag("Genre A", "genreA", "Genre" as TagType),
  genre2: createTag("Genre B", "genreB", "Genre" as TagType),
  genre3: createTag("Genre C", "genreC", "Genre" as TagType),
};

export const genericAgeGroupTags = {
  ageGroup1: createTag("Age Group 1", "ageGroup1", "AgeGroup" as TagType, 1),
  ageGroup2: createTag("Age Group 2", "ageGroup2", "AgeGroup" as TagType, 2),
  ageGroup3: createTag("Age Group 3", "ageGroup3", "AgeGroup" as TagType, 3),
};

export const genericHolidayTags = {
  holiday1: createTag("Generic Holiday 1", "holiday1", "Holiday" as TagType),
  holiday2: createTag("Generic Holiday 2", "holiday2", "Holiday" as TagType),
};

export const genericSpecialtyTags = {
  specialty1: createTag("Specialty 1", "specialty1", "Specialty" as TagType),
  specialty2: createTag("Specialty 2", "specialty2", "Specialty" as TagType),
};

export const allGenericTags = [
  ...Object.values(genericGenreTags),
  ...Object.values(genericAgeGroupTags),
  ...Object.values(genericHolidayTags),
  ...Object.values(genericSpecialtyTags),
];
