import { tagRepository } from "../repositories/tagsRepository.js";
import { commercialRepository } from "../repositories/commercialRepository.js";
import { shortRepository } from "../repositories/shortRepository.js";
import { musicRepository } from "../repositories/musicRepository.js";

interface BufferMediaSelectionResult {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
  isValid: boolean;
}

function shuffle<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleAndHalve<T>(array: T[]): T[] {
  const shuffled = shuffle(array);
  // Return the first half
  return shuffled.slice(0, Math.ceil(shuffled.length / 2));
}

/**
 * Validates if the current pool of shorts+music+commercials is sufficient
 * to fill buffers without excessive reuse over a 4-hour window.
 *
 * @param selectedCommercials - Currently selected commercials
 * @param selectedShorts - Currently selected shorts
 * @param selectedMusic - Currently selected music videos
 * @param halfBufferDuration - The duration of this half of the buffer in seconds
 * @returns true if pool is valid (has enough variety), false otherwise
 */
export function isBufferMediaPoolValid(
  selectedCommercials: Commercial[],
  selectedShorts: Short[],
  selectedMusic: Music[],
  halfBufferDuration: number
): boolean {
  const duration = halfBufferDuration * 2;
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
    avgDurationPerPiece > 0 ? Math.ceil(duration / avgDurationPerPiece) : 0;
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
  segmentedTags: SegmentedTags,
  activeHolidayTags: Tag[],
  duration: number,
  shortOrMusicNumber: number
): BufferMediaSelectionResult {
  const ageAdjacencyTags = getAgeGroups(segmentedTags.ageGroupTags);

  // Start with empty results
  let selectedCommercials: Commercial[] = [];
  let selectedShorts: Short[] = [];
  let selectedMusic: Music[] = [];

  // Gate 1: Get all Holiday Media if there are any holidays active
  if (activeHolidayTags.length > 0) {
    const holidayResults = getHolidayBufferMedia(
      activeHolidayTags,
      ageAdjacencyTags,
      segmentedTags.specialtyTags,
      duration
    );
    selectedCommercials.push(...holidayResults.commercials);
    selectedShorts.push(...holidayResults.shorts);
    selectedMusic.push(...holidayResults.music);

    if (
      isBufferMediaPoolValid(
        selectedCommercials,
        selectedShorts,
        selectedMusic,
        duration
      )
    ) {
      return {
        commercials: selectedCommercials,
        shorts: selectedShorts,
        music: selectedMusic,
        isValid: true,
      };
    }
  }

  // Gate 2: Get all Specialty Media if there are any specialty tags
  if (segmentedTags.specialtyTags.length > 0) {
    const specialtyResults = getSpecialtyBufferMedia(
      segmentedTags.specialtyTags,
      duration
    );
    selectedCommercials.push(...specialtyResults.commercials);
    selectedShorts.push(...specialtyResults.shorts);
    selectedMusic.push(...specialtyResults.music);

    if (
      isBufferMediaPoolValid(
        selectedCommercials,
        selectedShorts,
        selectedMusic,
        duration
      )
    ) {
      return {
        commercials: selectedCommercials,
        shorts: selectedShorts,
        music: selectedMusic,
        isValid: true,
      };
    }
  }

  //Gate 3: Genre/Aesthetic Media
  if (
    segmentedTags.genreTags.length > 0 ||
    segmentedTags.aestheticTags.length > 0
  ) {
    const genreAndAestheticResults = getGenreAndAestheticBufferMedia(
      segmentedTags.genreTags,
      segmentedTags.aestheticTags,
      ageAdjacencyTags,
      duration
    );
    selectedCommercials.push(...genreAndAestheticResults.commercials);
    selectedShorts.push(...genreAndAestheticResults.shorts);
    selectedMusic.push(...genreAndAestheticResults.music);
    if (
      isBufferMediaPoolValid(
        selectedCommercials,
        selectedShorts,
        selectedMusic,
        duration
      )
    ) {
      return {
        commercials: selectedCommercials,
        shorts: selectedShorts,
        music: selectedMusic,
        isValid: true,
      };
    }
  }

  //Gate 4: Fallback Buffer Media
  const ageOnlyResults = getAgeGroupOnlyBufferMedia(ageAdjacencyTags, duration);
  selectedCommercials.push(...ageOnlyResults.commercials);
  selectedShorts.push(...ageOnlyResults.shorts);
  selectedMusic.push(...ageOnlyResults.music);

  if (
    isBufferMediaPoolValid(
      selectedCommercials,
      selectedShorts,
      selectedMusic,
      duration
    )
  ) {
    return {
      commercials: selectedCommercials,
      shorts: selectedShorts,
      music: selectedMusic,
      isValid: true,
    };
  }

  const untaggedResults = getUntaggedBufferMedia(duration);
  selectedCommercials.push(...untaggedResults.commercials);
  selectedShorts.push(...untaggedResults.shorts);
  selectedMusic.push(...untaggedResults.music);

  if (
    segmentedTags.ageGroupTags.length === 0 &&
    segmentedTags.specialtyTags.length === 0 &&
    segmentedTags.genreTags.length === 0 &&
    segmentedTags.aestheticTags.length === 0
  ) {
    const randomBufferMedia = getRandomBufferMedia(
      duration,
      shortOrMusicNumber
    );
    selectedCommercials.push(...randomBufferMedia.commercials);
    selectedShorts.push(...randomBufferMedia.shorts);
    selectedMusic.push(...randomBufferMedia.music);
  }
  
  const isValid = isBufferMediaPoolValid(
    selectedCommercials,
    selectedShorts,
    selectedMusic,
    duration
  );

  // If not valid, shuffle and halve all arrays
  // This is to conserve variety in the buffer pool by not loading everything that matches for the
  // given tags and leaving nothing for future buffers for the same given tags during the recently used period.
  // This way, some variety is preserved over the course of the stream, even if the overall pool is still insufficient.
  // The remainder will be filled with default buffer media later in the process.
  if (!isValid) {
    return {
      commercials: shuffleAndHalve(selectedCommercials),
      shorts: shuffleAndHalve(selectedShorts),
      music: shuffleAndHalve(selectedMusic),
      isValid: false,
    };
  }

  return {
    commercials: shuffle(selectedCommercials),
    shorts: shuffle(selectedShorts),
    music: shuffle(selectedMusic),
    isValid: true,
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
  const ageGroupTags = tags.filter((tag) => tag.type === TagType.AgeGroup);
  return {
    genreTags,
    aestheticTags,
    eraTags,
    specialtyTags,
    ageGroupTags,
  };
}

export function getHolidayBufferMedia(
  holidayTags: Tag[],
  ageGroupTags: Tag[],
  specialtyTags: Tag[],
  duration: number
): BufferMedia {
  // Get all commercials that match holiday and age group tags from the DB
  const commercials = commercialRepository.findHolidayCommercials(
    ageGroupTags,
    holidayTags,
    specialtyTags,
    duration
  );
  const shorts = shortRepository.findHolidayShorts(
    ageGroupTags,
    holidayTags,
    specialtyTags,
    duration
  );
  const music = musicRepository.findHolidayMusic(
    ageGroupTags,
    holidayTags,
    specialtyTags,
    duration
  );
  return {
    commercials,
    shorts,
    music,
  };
}

export function getSpecialtyBufferMedia(
  specialtyTags: Tag[],
  duration: number
): BufferMedia {
  // Get all commercials that match specialty tags from the DB
  const commercials = commercialRepository.findBySpecialtyTags(
    specialtyTags,
    duration
  );
  const shorts = shortRepository.findBySpecialtyTags(specialtyTags, duration);
  const music = musicRepository.findBySpecialtyTags(specialtyTags, duration);
  return {
    commercials,
    shorts,
    music,
  };
}

export function getGenreAndAestheticBufferMedia(
  genreTags: Tag[],
  aestheticTags: Tag[],
  ageGroupTags: Tag[],
  duration: number
): BufferMedia {
  // Get all commercials that match genre/aesthetic and age group tags from the DB
  const commercials = commercialRepository.findByGenreAestheticAgeGroup(
    genreTags,
    aestheticTags,
    ageGroupTags,
    duration
  );
  const shorts = shortRepository.findByGenreAestheticAgeGroup(
    genreTags,
    aestheticTags,
    ageGroupTags,
    duration
  );

  //TODO: Music in this function will be picked by mosiac, as genre and aesthetic do not apply
  // to music.
  const music: Music[] = [];

  return {
    commercials,
    shorts,
    music,
  };
}

export function getAgeGroupOnlyBufferMedia(
  ageGroupTags: Tag[],
  duration: number
) {
  // Get all commercials that match age group tags from the DB
  const commercials = commercialRepository.findByAgeGroupOnly(
    ageGroupTags,
    duration
  );
  const shorts = shortRepository.findByAgeGroupOnly(ageGroupTags, duration);
  const music = musicRepository.findByAgeGroupOnly(ageGroupTags, duration);
  return {
    commercials,
    shorts,
    music,
  };
}

export function getUntaggedBufferMedia(duration: number): BufferMedia {
  // Get all untagged commercials from the DB
  const commercials = commercialRepository.findByNoTags(duration);
  const shorts = shortRepository.findByNoTags(duration);
  const music = musicRepository.findByNoTags(duration);
  return {
    commercials,
    shorts,
    music,
  };
}

export function getRandomBufferMedia(
  duration: number,
  shortOrMusicNumber: number
): BufferMedia {
  // Get up to 2 hours of random commercials under the passed duration
  const commercials =
    commercialRepository.findRandomCommercialsByPoolDuration(duration);

  // Get random shorts and music videos with coin-flip distribution
  // Limited by count and total duration
  const shortsAndMusic = shortRepository.findRandomShortsAndMusicByCount(
    shortOrMusicNumber,
    duration,
    duration
  );

  return {
    commercials,
    shorts: shortsAndMusic.shorts,
    music: shortsAndMusic.music,
  };
}
