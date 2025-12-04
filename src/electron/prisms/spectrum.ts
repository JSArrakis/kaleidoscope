import { tagRepository } from "../repositories/tagsRepository.js";
import { commercialRepository } from "../repositories/commercialRepository.js";
import { shortRepository } from "../repositories/shortRepository.js";
import { musicRepository } from "../repositories/musicRepository.js";

/**
 * Validates if the current pool of shorts+music+commercials is sufficient
 * to fill buffers without excessive reuse over a 4-hour window.
 *
 * @param selectedCommercials - Currently selected commercials
 * @param selectedShorts - Currently selected shorts
 * @param selectedMusic - Currently selected music videos
 * @param bufferDuration - The typical buffer duration in seconds
 * @returns true if pool is valid (has enough variety), false otherwise
 */
export function isBufferMediaPoolValid(
  selectedCommercials: Commercial[],
  selectedShorts: Short[],
  selectedMusic: Music[],
  bufferDuration: number
): boolean {
  const TWO_HOUR_POOL_SECONDS = 7200;
  const ESTIMATED_BUFFERS_IN_4_HOURS = 8;

  // Combine shorts and music
  const shortsAndMusic = [...selectedShorts, ...selectedMusic];
  const shortsAndMusicCount = shortsAndMusic.length;
  const shortsAndMusicTotalDuration = shortsAndMusic.reduce(
    (sum, item) => sum + (item.duration || 0),
    0
  );

  // Calculate usability score
  const avgDurationPerPiece =
    shortsAndMusicCount > 0
      ? shortsAndMusicTotalDuration / shortsAndMusicCount
      : 0;

  const slotsPerBuffer =
    avgDurationPerPiece > 0
      ? Math.ceil(bufferDuration / avgDurationPerPiece)
      : 0;
  const totalSlotsNeeded = ESTIMATED_BUFFERS_IN_4_HOURS * slotsPerBuffer;

  const shortsAndMusicUsabilityScore =
    totalSlotsNeeded > 0
      ? shortsAndMusicCount / totalSlotsNeeded
      : shortsAndMusicCount > 0
      ? 1.0
      : 0;

  // Calculate usable duration
  const usableShortsAndMusicDuration =
    shortsAndMusicTotalDuration * shortsAndMusicUsabilityScore;

  // Calculate remaining needed from commercials
  const commercialsNeeded =
    TWO_HOUR_POOL_SECONDS - usableShortsAndMusicDuration;

  // Check if we have enough commercials
  const commercialsTotalDuration = selectedCommercials.reduce(
    (sum, commercial) => sum + (commercial.duration || 0),
    0
  );

  return commercialsTotalDuration >= commercialsNeeded;
}

export function selectBufferMedia(
  tags: Tag[],
  activeHolidayTags: Tag[],
  duration: number
): BufferMediaSelectionResult {
  const segmentedTags: SegmentedTags = segmentTags(tags);
  const ageGroupTags: Tag[] = tags.filter(
    (tag) => tag.type === TagType.AgeGroup
  );

  const ageAdjacencyTags = getAgeGroups(ageGroupTags);

  // Start with empty results
  let selectedCommercials: Commercial[] = [];
  let selectedShorts: Short[] = [];
  let selectedMusic: Music[] = [];

  if (activeHolidayTags.length > 0) {
    const holidayResults = getHolidayBufferMedia(
      activeHolidayTags,
      ageAdjacencyTags,
      duration
    );
    selectedCommercials.push(...holidayResults.commercials);
    selectedShorts.push(...holidayResults.shorts);
    selectedMusic.push(...holidayResults.music);
  }

  // Phase 2: Good Matches (Age + Holiday + Specialty + Genre)
  const currentDuration = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration = duration - currentDuration;

  if (
    remainingDuration > 0 &&
    (isHolidayPeriod || tags.specialtyTags.length > 0)
  ) {
    const goodResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      isHolidayPeriod ? tags.holidayTags : [],
      tags.specialtyTags,
      tags.genreTags, // Remove aesthetics and era
      [],
      "good",
      remainingDuration * 0.4
    );

    selectedCommercials.push(...goodResults.commercials);
    selectedShorts.push(...goodResults.shorts);
    selectedMusic.push(...goodResults.music);
  }

  // Phase 3: Decent Matches (Age + Genre/Aesthetic combinations)
  const currentDuration2 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration2 = duration - currentDuration2;

  if (remainingDuration2 > 0 && tags.genreTags.length > 0) {
    const decentResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      [], // Remove holiday requirement
      [], // Remove specialty requirement
      tags.genreTags, // Keep genre, remove other combinations
      [],
      "decent",
      remainingDuration2 * 0.5
    );

    selectedCommercials.push(...decentResults.commercials);
    selectedShorts.push(...decentResults.shorts);
    selectedMusic.push(...decentResults.music);
  }

  // Phase 4: Fallback Matches (Age + Any single tag)
  const currentDuration3 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration3 = duration - currentDuration3;

  if (remainingDuration3 > 0) {
    const allTags = [...tags.genreTags, ...tags.specialtyTags];
    const fallbackResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      [],
      [],
      allTags.length > 0 ? [allTags[0]] : [], // Use just one tag if available
      [],
      "fallback",
      remainingDuration3 * 0.6
    );

    selectedCommercials.push(...fallbackResults.commercials);
    selectedShorts.push(...fallbackResults.shorts);
    selectedMusic.push(...fallbackResults.music);
  }

  // Phase 5: Emergency Matches (Age + Untagged + Reusage)
  const currentDuration4 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration4 = duration - currentDuration4;

  if (remainingDuration4 > 0) {
    selectedCommercials.push(...emergencyResults.commercials);
    selectedShorts.push(...emergencyResults.shorts);
    selectedMusic.push(...emergencyResults.music);
  }

  return {
    commercials: selectedCommercials,
    shorts: selectedShorts,
    music: selectedMusic,
  };
}

function getAgeGroups(ageGroupTags: Tag[]): Tag[] {
  if (ageGroupTags.length === 0) {
    return [];
  }

  // Get the lowest age group for viewer 'safety'
  const sortedAgeGroups = ageGroupTags.sort(
    (a, b) => (a.sequence || 0) - (b.sequence || 0)
  );
  const baseAgeGroup = sortedAgeGroups[0];
  let adjacencyTags: Tag[] = [baseAgeGroup];

  // Find adjacent age groups by sequence number
  const lowerSequence = Math.max((baseAgeGroup.sequence || 1) - 1, 1);
  const higherSequence = (baseAgeGroup.sequence || 1) + 1;
  const lowerTag = tagRepository.findAgeGroupBySequence(lowerSequence);
  const higherTag = tagRepository.findAgeGroupBySequence(higherSequence);
  if (lowerTag) {
    adjacencyTags.push(lowerTag);
  }
  if (higherTag) {
    adjacencyTags.push(higherTag);
  }

  return adjacencyTags;
}

export function segmentTags(tags: Tag[]): SegmentedTags {
  const genreTags = tags.filter((tag) => tag.type === TagType.Genre);
  const aestheticTags = tags.filter((tag) => tag.type === TagType.Aesthetic);
  const eraTags = tags.filter((tag) => tag.type === TagType.Era);
  const specialtyTags = tags.filter((tag) => tag.type === TagType.Specialty);
  return {
    genreTags,
    aestheticTags,
    eraTags,
    specialtyTags,
  };
}

export function getHolidayBufferMedia(
  holidayTags: Tag[],
  ageGroupTags: Tag[],
  duration: number
): BufferMedia {
  // Get all commercials that match holiday and age group tags from the DB
  const commercials = commercialRepository.findHolidayCommercials(
    ageGroupTags,
    holidayTags,
    duration
  );
  const shorts = shortRepository.findHolidayShorts(
    ageGroupTags,
    holidayTags,
    duration
  );
  const music = musicRepository.findHolidayMusic(
    ageGroupTags,
    holidayTags,
    duration
  );
  return {
    commercials,
    shorts,
    music,
  };
}

export function getMediaByTags(
  segmentedTags: SegmentedTags,
  activeHolidayTags: Tag[]
): Media {
  if (activeHolidayTags.length > 0) {
  }
  // Implement logic to retrieve media based on segmented tags
  // This is a placeholder implementation
  return new Media([], [], [], [], [], [], [], [], []);
}
