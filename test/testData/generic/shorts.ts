import { createShort } from "../../../factories/short.factory";
import { genericGenreTags, genericAgeGroupTags } from "./tags";

/**
 * Generic shorts for buffer pool validation testing
 * Covers variety of durations (5-25 minutes) to test usability scoring
 * Higher variability helps test slots-per-buffer calculations
 */

// 5-minute shorts (high slots per buffer - many pieces fit)
export const short5min_1 = createShort(
  "Short 5min - 1",
  "short5min_1",
  300, // 5 minutes
  "/path/short5min_1.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short5min_2 = createShort(
  "Short 5min - 2",
  "short5min_2",
  300,
  "/path/short5min_2.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short5min_3 = createShort(
  "Short 5min - 3",
  "short5min_3",
  300,
  "/path/short5min_3.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 10-minute shorts (moderate slots per buffer)
export const short10min_1 = createShort(
  "Short 10min - 1",
  "short10min_1",
  600, // 10 minutes
  "/path/short10min_1.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short10min_2 = createShort(
  "Short 10min - 2",
  "short10min_2",
  600,
  "/path/short10min_2.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short10min_3 = createShort(
  "Short 10min - 3",
  "short10min_3",
  600,
  "/path/short10min_3.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short10min_4 = createShort(
  "Short 10min - 4",
  "short10min_4",
  600,
  "/path/short10min_4.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 15-minute shorts (fewer slots per buffer)
export const short15min_1 = createShort(
  "Short 15min - 1",
  "short15min_1",
  900, // 15 minutes
  "/path/short15min_1.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const short15min_2 = createShort(
  "Short 15min - 2",
  "short15min_2",
  900,
  "/path/short15min_2.mp4",
  MediaType.Short,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 20-minute shorts (very few slots per buffer - edge case)
export const short20min = createShort(
  "Short 20min",
  "short20min",
  1200, // 20 minutes
  "/path/short20min.mp4",
  MediaType.Short,
  [genericGenreTags.genre2, genericAgeGroupTags.ageGroup2]
);

// 25-minute shorts (extreme case - only 1-2 per 30-min buffer)
export const short25min = createShort(
  "Short 25min",
  "short25min",
  1500, // 25 minutes
  "/path/short25min.mp4",
  MediaType.Short,
  [genericGenreTags.genre3, genericAgeGroupTags.ageGroup3]
);

export const allGenericShorts = [
  short5min_1,
  short5min_2,
  short5min_3,
  short10min_1,
  short10min_2,
  short10min_3,
  short10min_4,
  short15min_1,
  short15min_2,
  short20min,
  short25min,
];
