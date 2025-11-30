import { Media } from '../models/media';
import { Promo } from '../models/promo';
import { Commercial } from '../models/commercial';
import { Short } from '../models/short';
import { Music } from '../models/music';
import { TagType } from '../models/const/tagTypes';
import { Tag } from '../models/tag';
import { SegmentedTags } from '../models/segmentedTags';
import { segmentTags } from './dataTransformer';
import { BaseMedia } from '../models/mediaInterface';
import { sumMediaDuration } from '../prisms/core';
import * as core from '../prisms/core';
// TODO: Import mosaic functions when implemented
// import { getMediaByMosaicTags } from '../prisms/mosaic';
import { recentlyUsedMediaRepository } from '../repositories/recentlyUsedMediaRepository';
import { selectBufferMedia } from '../prisms/spectrum';
import { getActiveHolidayTags } from './holidayService';
import { selectRandomPromo } from './promoService';
import { Holiday } from '../models/holiday';
// Note: Music selection will eventually use mosaic system instead of spectrum

export function createBuffer(
  duration: number,
  halfATags: Tag[],
  halfBTags: Tag[],
  activeHolidayTags: Holiday[],
): {
  buffer: (Promo | Music | Short | Commercial)[];
  remainingDuration: number;
} {
  let buffer: (Promo | Music | Short | Commercial)[] = [];

  // Periodically clean up expired usage records (every ~10th call)
  if (Math.random() < 0.1) {
    try {
      recentlyUsedMediaRepository.cleanupExpiredRecords();
    } catch (error) {
      console.warn('Failed to cleanup expired usage records:', error);
    }
  }

  // transform holidayTags into Tag objects
  const holidayMediaTags: Tag[] = activeHolidayTags.map(holiday => {
    return new Tag(
      holiday.tagId,
      holiday.name,
      TagType.Holiday,
      holiday.holidayDates,
      holiday.exclusionTags,
      holiday.seasonStartDate,
      holiday.seasonEndDate,
      false, // explicitlyHoliday default
    );
  });

  // Get the translated tags for the preceding show or movie and the subsequent
  // show or movie. These are used to get buffer content for the first half of the
  // buffer and the last half of the buffer respectively
  // The reason for this is to better transition from one genre of media to the next
  let segmentedPreTags: SegmentedTags = segmentTags(halfATags);
  let segmentedPostTags: SegmentedTags = segmentTags(halfBTags);

  // Get active holiday tags from the centralized holiday service
  let selectedHolidayTags: Tag[] = getActiveHolidayTags();

  // Select a random promo - promos are always 15 seconds
  // Promos are like channel idents (NBC, ABC markers) not show/movie promotions
  let promo: Promo | null = selectRandomPromo(duration);

  // Sets the duration of the buffer to be the duration of the buffer minus the duration
  // of the promo (if we have one), otherwise use full duration
  let remDur: number = promo ? duration - promo.duration : duration;

  // variables to hold the duration of the first half of the buffer and the second half
  // of the buffer
  let halfA: number = 0;
  let halfB: number = 0;

  // If the precedint tags are empty (such as when the stream is just launched and there is
  // no preceding show or movie and we are creating the the initial buffer)
  if (halfATags.length === 0) {
    // There is no Half A, so the entire buffer is Half B (themed to the show that is about to play)
    halfB = remDur;

    // If there is no subsequent show or movie (such as when the stream is ending and there is
    // no subsequent show or movie and we are creating the final buffer)
  } else if (halfBTags.length === 0) {
    // There is no Half B, so the entire buffer is Half A (themed to the show that just played)
    halfA = remDur;
  } else {
    // If there is a preceding show or movie and a subsequent show or movie,
    // split the buffer in half
    // If the remaining duration is greater than or equal to 30 seconds, split
    // he buffer in half
    // If the remaining duration is less than 30 seconds, the entire buffer is
    // Half B(themed to the show that is about to play)
    // The reason for 30 seconds is to assume the promo is 15 seconds and the
    // fact that there are many 15 second commercials
    // TODO - We might need a better way to do this
    if (remDur >= 30) {
      halfA = Math.ceil(remDur / 2);
    }
    halfB = remDur - halfA;
  }

  // Handle case where there are no tags at all (both halfATags and halfBTags are empty)
  if (halfATags.length === 0 && halfBTags.length === 0) {
    // Only promo in buffer (if available)
    return {
      buffer: promo ? [promo] : [],
      remainingDuration: promo ? 0 : duration,
    };
  }

  if (halfA === 0) {
    // Get list of commercials, music, and shorts that match the tags of the
    // subsequent show or movie and also gets the remaining duration of the
    // buffer after selecting the media to pass to the next buffer selection
    let selectedB = selectBufferMediaWithinDuration(segmentedPostTags, remDur);
    // Add the selected media to the buffer
    buffer.push(...selectedB.selectedMedia);
    // Add the promo to the buffer (if available)
    if (promo) {
      buffer.push(promo);
    }

    return {
      buffer,
      remainingDuration: selectedB.remainingDuration,
    };
  } else if (halfB === 0) {
    // Get list of commercials, music, and shorts that match the tags of the
    // preceding show or movie and also gets the remaining duration of the
    // buffer after selecting the media to pass to the next buffer selection
    let selectedA = selectBufferMediaWithinDuration(segmentedPreTags, remDur);
    // Add the promo to the buffer (if available)
    if (promo) {
      buffer.push(promo);
    }
    // Add the selected media to the buffer
    buffer.push(...selectedA.selectedMedia);

    return {
      buffer,
      remainingDuration: selectedA.remainingDuration,
    };
  } else {
    // Get list of commercials, music, and shorts that match the tags of the
    // preceding show or movie
    let selectedA = selectBufferMediaWithinDuration(segmentedPreTags, halfA);
    // Add the selected media to the buffer
    buffer.push(...selectedA.selectedMedia);
    // Add the promo to the buffer (if available)
    if (promo) {
      buffer.push(promo);
    }
    // Get list of commercials, music, and shorts that match the tags of the
    // subsequent show or movie
    let selectedB = selectBufferMediaWithinDuration(
      segmentedPostTags,
      halfB + selectedA.remainingDuration,
    );
    // Add the selected media to the buffer
    buffer.push(...selectedB.selectedMedia);

    return {
      buffer,
      remainingDuration: selectedB.remainingDuration,
    };
  }
}

export function getBufferVarietyStats(
  availableCommercials: Commercial[],
  availableShorts: Short[],
  availableMusic: Music[],
): {
  totalVariety: number;
  varietyLevel: 'high' | 'medium' | 'low' | 'critical';
  breakdown: {
    commercials: number;
    shorts: number;
    music: number;
  };
} {
  const breakdown = {
    commercials: availableCommercials.length,
    shorts: availableShorts.length,
    music: availableMusic.length,
  };

  const totalVariety =
    breakdown.commercials + breakdown.shorts + breakdown.music;

  let varietyLevel: 'high' | 'medium' | 'low' | 'critical';
  if (totalVariety >= 20) {
    varietyLevel = 'high';
  } else if (totalVariety >= 10) {
    varietyLevel = 'medium';
  } else if (totalVariety >= 5) {
    varietyLevel = 'low';
  } else {
    varietyLevel = 'critical';
  }

  return {
    totalVariety,
    varietyLevel,
    breakdown,
  };
}

export function selectFullDurationMedia(
  media: BaseMedia[],
  duration: number,
): BaseMedia[] {
  return media.filter((media: BaseMedia) => media.duration === duration);
}

export function selectUnderDuratonMedia(
  media: BaseMedia[],
  duration: number,
  blockDuration: number,
): BaseMedia[] {
  return media.filter(
    media => media.duration <= duration && media.duration <= blockDuration,
  );
}

export function selectAvailableCommercials(
  commercials: Commercial[],
  defaultCommercials: Commercial[],
  duration: number,
  blockDuration: number,
): Commercial[] {
  let availableCommercials: Commercial[] = [];

  // Get the commercials that fit the remaining duration
  availableCommercials = selectFullDurationMedia(
    commercials,
    duration,
  ) as Commercial[];

  // Get the commercials that are less than or equal to both the
  // remaining duration and the commercial block
  if (availableCommercials.length === 0) {
    availableCommercials = selectUnderDuratonMedia(
      commercials,
      duration,
      blockDuration,
    ) as Commercial[];
  }

  // Get the default commercials that fit the remaining duration
  // Only add them to the available commercials instead of assigning them
  // this way it still is a higher chance of selecting a commercial that is
  // not a default commercial
  if (sumMediaDuration(availableCommercials) < duration) {
    const defaultFull = selectFullDurationMedia(
      defaultCommercials,
      duration,
    ) as Commercial[];
    availableCommercials.push(...defaultFull);
  }

  // Get the default commercials that are less than or equal to both the remaining duration
  // and the commercial block
  let summedDuration = sumMediaDuration(availableCommercials);
  if (summedDuration < duration && summedDuration < blockDuration) {
    const defaultUnder = selectUnderDuratonMedia(
      defaultCommercials,
      duration,
      blockDuration,
    ) as Commercial[];
    availableCommercials.push(...defaultUnder);
  }

  return availableCommercials;
}

export function selectWeightedMedia(media: BaseMedia[]): BaseMedia {
  // Get the first 10 commercials from media, this is because the incoming
  // commercials are ordered from most relevant to least relevant in the
  // media list. We are selecting 10 commercials because we want to give
  // a little bit of variety in the commercials that are selected
  let weightedMedia: BaseMedia[] = media.slice(0, 10);
  // Select a random commercial from the first 10 commercials
  return weightedMedia[Math.floor(Math.random() * weightedMedia.length)];
}

export function selectCommercials(
  commercials: Commercial[],
  defaultCommercials: Commercial[],
  remainingDuration: number,
): [Commercial[], number] {
  let selectedCommercials: Commercial[] = [];

  // In normal TV broadcast, a single commercial is rarely longer than 120 seconds
  // However they do exist, and as such we account for that for giving a small
  // chance of selecting a commercial that is longer than 120 seconds
  // by looking for commercials that are equal to the entire remaining duration
  // The variableness of this duration is what makes the possiblity of a full
  // remaining duration commercial being selected possible but low.
  // Set the commercial block to 120 seconds
  let commercialBlock = 120;

  // Remaining duration for the buffer might be less than 120 seconds
  while (remainingDuration > 0) {
    const availableCommercials = selectAvailableCommercials(
      commercials,
      defaultCommercials,
      remainingDuration,
      commercialBlock,
    );

    if (availableCommercials.length > 0) {
      // Select random commercial from available commercials
      const selectedCommercial = selectWeightedMedia(
        availableCommercials,
      ) as Commercial;
      // Add the selected commercial to the selected commercials list and remove the
      // duration of the commercial from the remaining duration
      selectedCommercials.push(selectedCommercial);
      remainingDuration -= selectedCommercial.duration;
      // Add the title of the selected commercial to the used commercial titles list
      commercialBlock -= selectedCommercial.duration; // Reduce commercialBlock
    } else {
      // If there are no commercials that fit the remaining duration or commercial block
      // remaining duration, break the loop
      break;
    }
  }

  // Return the selected commercials and the remaining duration to be used in the next buffer
  return [selectedCommercials, remainingDuration];
}

// Select Shorts or Music
export function selectShortOrMusic(
  filteredShorts: Short[],
  filteredMusic: Music[],
  remainingDuration: number,
): (Short | Music) | null {
  // Get the available shorts that fit the remaining duration
  let availableShorts = filteredShorts.filter(
    short => short.duration <= remainingDuration,
  );

  // Get the available music that fits the remaining duration
  let availableMusic = filteredMusic.filter(
    music => music.duration <= remainingDuration,
  );

  if (availableShorts.length === 0 && availableMusic.length === 0) {
    return null; // No suitable shorts or music available
  }

  const useShort = Math.random() < 0.5; // 50% chance of selecting a short
  if (useShort && availableShorts.length > 0) {
    // Select a random short from the available shorts
    return selectWeightedMedia(availableShorts) as Short;
  } else if (availableMusic.length > 0) {
    // Select a random music video from the available music
    return selectWeightedMedia(availableMusic) as Music;
  }

  return null; // No suitable shorts or music available
}

// Define the main function
export function selectBufferMediaWithinDuration(
  tags: SegmentedTags,
  duration: number,
): {
  selectedMedia: (Commercial | Short | Music)[];
  segmentedSelectedMedia: Media;
  remainingDuration: number;
} {
  // Use new intelligent hierarchical spectrum selection
  // Note: Music selection will be handled by mosaic system when implemented
  /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/
  const spectrumResult = selectBufferMedia(tags, duration);

  // Log spectrum selection results
  console.log(
    `[Buffer Engine] Spectrum selected ${spectrumResult.selectionStats.totalFound} items filling ${spectrumResult.selectionStats.durationFilled}/${spectrumResult.selectionStats.targetDuration}s`,
  );
  console.log(
    `[Buffer Engine] Selection breakdown - Perfect: ${spectrumResult.selectionStats.perfectMatches}, Good: ${spectrumResult.selectionStats.goodMatches}, Decent: ${spectrumResult.selectionStats.decentMatches}, Fallback: ${spectrumResult.selectionStats.fallbackMatches}, Emergency: ${spectrumResult.selectionStats.emergencyMatches}`,
  );

  if (spectrumResult.selectionStats.reusageApplied) {
    console.log(
      `[Buffer Engine] Reusage applied: ${spectrumResult.selectionStats.reusageReason}`,
    );
  }

  // The spectrum system has already selected and filtered media intelligently
  let selectedMedia: (Commercial | Short | Music)[] = [
    ...spectrumResult.commercials,
    ...spectrumResult.shorts,
    ...spectrumResult.music,
  ];

  let segmentedSelectedMedia = new Media([], [], [], [], [], [], [], [], []);
  segmentedSelectedMedia.commercials.push(...spectrumResult.commercials);
  segmentedSelectedMedia.shorts.push(...spectrumResult.shorts);
  segmentedSelectedMedia.music.push(...spectrumResult.music);

  // Calculate remaining duration after spectrum selection (for timing correction)
  const actualDuration = core.sumMediaDuration(selectedMedia);
  const remainingDuration = duration - actualDuration;
  /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/

  // Record usage of all selected buffer media to prevent repetition
  const mediaUsageRecords = [
    ...spectrumResult.commercials.map((c: Commercial) => ({
      mediaItemId: c.mediaItemId,
      mediaType: 'commercial' as const,
      usageContext: 'buffer' as const,
    })),
    ...spectrumResult.shorts.map((s: Short) => ({
      mediaItemId: s.mediaItemId,
      mediaType: 'short' as const,
      usageContext: 'buffer' as const,
    })),
    ...spectrumResult.music.map((m: Music) => ({
      mediaItemId: m.mediaItemId,
      mediaType: 'music' as const,
      usageContext: 'buffer' as const,
    })),
  ];

  if (mediaUsageRecords.length > 0) {
    recentlyUsedMediaRepository.recordBatchUsage(mediaUsageRecords);

    // Log buffer creation summary
    console.log(
      `[Buffer Engine] Created buffer with ${spectrumResult.commercials.length} commercials, ${spectrumResult.shorts.length} shorts, ${spectrumResult.music.length} music tracks`,
    );
  }

  return {
    selectedMedia,
    segmentedSelectedMedia,
    remainingDuration,
  };
}
