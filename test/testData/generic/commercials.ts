import { createCommercial } from "../../../factories/commercial.factory";
import { genericGenreTags, genericAgeGroupTags } from "./tags";

/**
 * Generic commercials for buffer pool validation testing
 * Covers variety of durations (1-120 seconds)
 */

// 15-second commercials (most common)
export const commercial15s_1 = createCommercial(
  "Commercial 15s - 1",
  "commercial15s_1",
  15,
  "/path/commercial15s_1.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial15s_2 = createCommercial(
  "Commercial 15s - 2",
  "commercial15s_2",
  15,
  "/path/commercial15s_2.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial15s_3 = createCommercial(
  "Commercial 15s - 3",
  "commercial15s_3",
  15,
  "/path/commercial15s_3.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial15s_4 = createCommercial(
  "Commercial 15s - 4",
  "commercial15s_4",
  15,
  "/path/commercial15s_4.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 30-second commercials
export const commercial30s_1 = createCommercial(
  "Commercial 30s - 1",
  "commercial30s_1",
  30,
  "/path/commercial30s_1.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial30s_2 = createCommercial(
  "Commercial 30s - 2",
  "commercial30s_2",
  30,
  "/path/commercial30s_2.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial30s_3 = createCommercial(
  "Commercial 30s - 3",
  "commercial30s_3",
  30,
  "/path/commercial30s_3.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 60-second commercials
export const commercial60s_1 = createCommercial(
  "Commercial 60s - 1",
  "commercial60s_1",
  60,
  "/path/commercial60s_1.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const commercial60s_2 = createCommercial(
  "Commercial 60s - 2",
  "commercial60s_2",
  60,
  "/path/commercial60s_2.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 120-second commercials
export const commercial120s = createCommercial(
  "Commercial 120s",
  "commercial120s",
  120,
  "/path/commercial120s.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// Mixed genre/age group for scenario flexibility
export const commercialGenre2 = createCommercial(
  "Commercial Genre 2",
  "commercialGenre2",
  15,
  "/path/commercialGenre2.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre2, genericAgeGroupTags.ageGroup2]
);

export const commercialGenre3 = createCommercial(
  "Commercial Genre 3",
  "commercialGenre3",
  30,
  "/path/commercialGenre3.mp4",
  "Commercial" as MediaType,
  [genericGenreTags.genre3, genericAgeGroupTags.ageGroup3]
);

export const allGenericCommercials = [
  commercial15s_1,
  commercial15s_2,
  commercial15s_3,
  commercial15s_4,
  commercial30s_1,
  commercial30s_2,
  commercial30s_3,
  commercial60s_1,
  commercial60s_2,
  commercial120s,
  commercialGenre2,
  commercialGenre3,
];
