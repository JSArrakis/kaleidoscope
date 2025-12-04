import { createMusic } from "../../../factories/music.factory";
import { genericGenreTags, genericAgeGroupTags } from "./tags";

/**
 * Generic music videos for buffer pool validation testing
 * Covers variety of durations (3-12 minutes) to test usability scoring
 * Typically shorter than shorts, allowing more pieces in buffer
 */

// 3-minute music videos (common pop songs)
export const music3min_1 = createMusic(
  "Music 3min - 1",
  "music3min_1",
  180, // 3 minutes
  "/path/music3min_1.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const music3min_2 = createMusic(
  "Music 3min - 2",
  "music3min_2",
  180,
  "/path/music3min_2.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const music3min_3 = createMusic(
  "Music 3min - 3",
  "music3min_3",
  180,
  "/path/music3min_3.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const music3min_4 = createMusic(
  "Music 3min - 4",
  "music3min_4",
  180,
  "/path/music3min_4.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 5-minute music videos
export const music5min_1 = createMusic(
  "Music 5min - 1",
  "music5min_1",
  300, // 5 minutes
  "/path/music5min_1.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const music5min_2 = createMusic(
  "Music 5min - 2",
  "music5min_2",
  300,
  "/path/music5min_2.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

export const music5min_3 = createMusic(
  "Music 5min - 3",
  "music5min_3",
  300,
  "/path/music5min_3.mp4",
  MediaType.Music,
  [genericGenreTags.genre1, genericAgeGroupTags.ageGroup1]
);

// 7-minute music videos
export const music7min_1 = createMusic(
  "Music 7min - 1",
  "music7min_1",
  420, // 7 minutes
  "/path/music7min_1.mp4",
  MediaType.Music,
  [genericGenreTags.genre2, genericAgeGroupTags.ageGroup2]
);

export const music7min_2 = createMusic(
  "Music 7min - 2",
  "music7min_2",
  420,
  "/path/music7min_2.mp4",
  MediaType.Music,
  [genericGenreTags.genre2, genericAgeGroupTags.ageGroup2]
);

// 10-minute music videos (extended cuts)
export const music10min_1 = createMusic(
  "Music 10min - 1",
  "music10min_1",
  600, // 10 minutes
  "/path/music10min_1.mp4",
  MediaType.Music,
  [genericGenreTags.genre3, genericAgeGroupTags.ageGroup3]
);

export const music10min_2 = createMusic(
  "Music 10min - 2",
  "music10min_2",
  600,
  "/path/music10min_2.mp4",
  MediaType.Music,
  [genericGenreTags.genre3, genericAgeGroupTags.ageGroup3]
);

// 12-minute music videos (longest tracks)
export const music12min = createMusic(
  "Music 12min",
  "music12min",
  720, // 12 minutes
  "/path/music12min.mp4",
  MediaType.Music,
  [genericGenreTags.genre3, genericAgeGroupTags.ageGroup3]
);

export const allGenericMusic = [
  music3min_1,
  music3min_2,
  music3min_3,
  music3min_4,
  music5min_1,
  music5min_2,
  music5min_3,
  music7min_1,
  music7min_2,
  music10min_1,
  music10min_2,
  music12min,
];
