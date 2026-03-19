import {
  getUnixTime,
  getMinutes,
  getSeconds,
  setSeconds,
  setMinutes,
  addHours,
} from "date-fns";

/**
 * Finds the next cadence time (on the hour or half-hour)
 * Cadence marks are at :00 and :30 of every hour
 * Used for aligning media blocks to consistent time boundaries
 */
export function findNextCadenceTime(now: number): number {
  const nowDate = new Date(now * 1000);
  const minutes = getMinutes(nowDate);
  const seconds = getSeconds(nowDate);

  // If we're already at a cadence time (exactly :00 or :30 with 0 seconds), return current time
  if (seconds === 0 && (minutes === 0 || minutes === 30)) {
    return now;
  }

  // Otherwise, find the next cadence time
  let nextMark = setSeconds(nowDate, 0);

  if (minutes < 30) {
    // Next cadence is at :30
    nextMark = setMinutes(nextMark, 30);
  } else {
    // Next cadence is at :00 of the next hour
    nextMark = setMinutes(nextMark, 0);
    nextMark = addHours(nextMark, 1);
  }

  return getUnixTime(nextMark);
}

/**
 * Segments tags into their respective categories
 * @param tags Array of tags to segment
 * @returns SegmentedTags object with tags grouped by type
 */
export function segmentTags(tags: Tag[]): SegmentedTags {
  const genreTags = tags.filter((tag) => tag.type === TagType.Genre);
  const aestheticTags = tags.filter((tag) => tag.type === TagType.Aesthetic);
  const eraTags = tags.filter((tag) => tag.type === TagType.Era);
  const specialtyTags = tags.filter((tag) => tag.type === TagType.Specialty);
  const ageGroupTags = tags.filter((tag) => tag.type === TagType.AgeGroup);
  return {
    genreTags,
    aestheticTags,
    eraTags,
    specialtyTags,
    ageGroupTags,
  };
}
