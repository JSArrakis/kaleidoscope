import { recentlyUsedMediaRepository } from "../repositories/recentlyUsedMediaRepository.js";
import { promoRepository } from "../repositories/promoRepository.js";

export function createBuffer(
  duration: number,
  halfATags: Tag[],
  halfBTags: Tag[],
  activeHolidayTags: Tag[]
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
      console.warn("Failed to cleanup expired usage records:", error);
    }
  }

  // Select a random promo - promos are always 15 seconds
  // Promos are like channel idents (NBC, ABC markers) not show/movie promotions
  let promo: Promo | null = promoRepository.findRandomPromo();

  // Sets the duration of the buffer to be the duration of the buffer minus the duration
  // of the promo (if we have one), otherwise use full duration
  let remDur: number =
    promo && promo.duration ? duration - promo.duration : duration;

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
    let selectedB = constructBufferHalf(halfBTags, activeHolidayTags, remDur);
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
    let selectedA = constructBufferHalf(halfATags, activeHolidayTags, remDur);
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
    let selectedA = constructBufferHalf(halfATags, activeHolidayTags, halfA);
    // Add the selected media to the buffer
    buffer.push(...selectedA.selectedMedia);
    // Add the promo to the buffer (if available)
    if (promo) {
      buffer.push(promo);
    }
    // Get list of commercials, music, and shorts that match the tags of the
    // subsequent show or movie
    let selectedB = constructBufferHalf(
      halfBTags,
      activeHolidayTags,
      halfB + selectedA.remainingDuration
    );
    // Add the selected media to the buffer
    buffer.push(...selectedB.selectedMedia);

    return {
      buffer,
      remainingDuration: selectedB.remainingDuration,
    };
  }
}

// Define the main function
export function constructBufferHalf(
  tags: Tag[],
  activeHolidayTags: Tag[],
  duration: number,
): {
  selectedMedia: (Commercial | Short | Music)[];
  remainingDuration: number;
} {
  // Use new intelligent hierarchical spectrum selection
  // Note: Music selection will be handled by mosaic system when implemented
  /*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/
  const spectrumResult = selectBufferMedia(tags, activeHolidayTags, duration);

  // Log spectrum selection results
  // console.log(
  //   `[Buffer Engine] Spectrum selected ${spectrumResult.selectionStats.totalFound} items filling ${spectrumResult.selectionStats.durationFilled}/${spectrumResult.selectionStats.targetDuration}s`,
  // );
  // console.log(
  //   `[Buffer Engine] Selection breakdown - Perfect: ${spectrumResult.selectionStats.perfectMatches}, Good: ${spectrumResult.selectionStats.goodMatches}, Decent: ${spectrumResult.selectionStats.decentMatches}, Fallback: ${spectrumResult.selectionStats.fallbackMatches}, Emergency: ${spectrumResult.selectionStats.emergencyMatches}`,
  // );

  // if (spectrumResult.selectionStats.reusageApplied) {
  //   console.log(
  //     `[Buffer Engine] Reusage applied: ${spectrumResult.selectionStats.reusageReason}`,
  //   );
  // }

  // The spectrum system has already selected and filtered media intelligently
  let selectedMedia: (Commercial | Short | Music)[] = [
    ...spectrumResult.commercials,
    ...spectrumResult.shorts,
    ...spectrumResult.music,
  ];

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
    remainingDuration,
  };
}