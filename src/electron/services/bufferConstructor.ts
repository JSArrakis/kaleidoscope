import { recentlyUsedMediaRepository } from "../repositories/recentlyUsedMediaRepository.js";
import { promoRepository } from "../repositories/promoRepository.js";
import { segmentTags, selectBufferMedia } from "../prisms/spectrum.js";
import { commercialRepository } from "../repositories/commercialRepository.js";

// Buffer duration thresholds for media selection strategy
const COMMERCIALS_ONLY_THRESHOLD = 420; // 7 minutes in seconds
const MEDIUM_BUFFER_THRESHOLD = 900; // 15 minutes in seconds

export function createBuffer(
  duration: number,
  halfATags: Tag[],
  halfBTags: Tag[],
  activeHolidayTags: Tag[],
  timepoint: number
): {
  buffer: (Promo | Music | Short | Commercial)[];
  remainingDuration: number;
} {
  let buffer: (Promo | Music | Short | Commercial)[] = [];

  // Periodically clean up expired usage records (every ~10th call)
  if (Math.random() < 0.1) {
    try {
      recentlyUsedMediaRepository.deleteExpired(timepoint);
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
  let halfADuration: number = 0;
  let halfBDuration: number = 0;

  // If the precedint tags are empty (such as when the stream is just launched and there is
  // no preceding show or movie and we are creating the the initial buffer)
  if (halfATags.length === 0) {
    // There is no Half A, so the entire buffer is Half B (themed to the show that is about to play)
    halfBDuration = remDur;

    // If there is no subsequent show or movie (such as when the stream is ending and there is
    // no subsequent show or movie and we are creating the final buffer)
  } else if (halfBTags.length === 0) {
    // There is no Half B, so the entire buffer is Half A (themed to the show that just played)
    halfADuration = remDur;
  } else {
    // If there is a preceding show or movie and a subsequent show or movie,
    // split the buffer in half
    // If the remaining duration is greater than or equal to 30 seconds, split
    // the buffer in half
    // If the remaining duration is less than 30 seconds, the entire buffer is
    // Half B(themed to the show that is about to play)
    // The reason for 30 seconds is to assume the promo is 15 seconds and the
    // fact that there are many 15 second commercials
    if (remDur >= 30) {
      halfADuration = Math.ceil(remDur / 2);
    }
    halfBDuration = remDur - halfADuration;
  }

  // Handle case where there are no tags at all (both halfATags and halfBTags are empty)
  if (halfATags.length === 0 && halfBTags.length === 0) {
    // Only promo in buffer (if available)
    return {
      buffer: promo ? [promo] : [],
      remainingDuration: promo ? 0 : duration,
    };
  }

  if (halfADuration === 0) {
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
  } else if (halfBDuration === 0) {
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
    let selectedA = constructBufferHalf(
      halfATags,
      activeHolidayTags,
      halfADuration
    );
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
      halfBDuration + selectedA.remainingDuration
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
  duration: number
): {
  selectedMedia: (Commercial | Short | Music)[];
  remainingDuration: number;
} {
  let selectedMedia: (Commercial | Short | Music)[] = [];

  // Segment Tags for spectrum processing and buffer creation
  const segmentedTags = segmentTags(tags);

  // Get default commercials to use as fallback
  const defaultCommercials =
    commercialRepository.findByDefaultSpecialtyTag(duration);

  // Use the spectrum prism to select buffer media based on tags and duration
  const spectrumResult = selectBufferMedia(
    segmentedTags,
    activeHolidayTags,
    duration
  );

  let usedCommercials: Commercial[] = [];
  let usedShorts: Short[] = [];
  let usedMusic: Music[] = [];

  if (duration <= COMMERCIALS_ONLY_THRESHOLD) {
    usedCommercials = onlyCommercials(
      activeHolidayTags,
      segmentedTags.eraTags,
      spectrumResult.commercials,
      defaultCommercials,
      duration
    ).selectedCommercials;
  } else if (duration <= MEDIUM_BUFFER_THRESHOLD) {
    // TODO: Commercials/Shorts/Music mix strategy for medium buffers
  } else {
    // TODO: Commercials/Shorts/Music mix strategy for large buffers
  }

  // Record usage of all selected buffer media to prevent repetition
  const mediaUsageRecords = [
    ...usedCommercials.map((c: Commercial) => ({
      mediaItemId: c.mediaItemId,
      mediaType: "commercial" as const,
      usageContext: "buffer" as const,
    })),
    ...usedShorts.map((s: Short) => ({
      mediaItemId: s.mediaItemId,
      mediaType: "short" as const,
      usageContext: "buffer" as const,
    })),
    ...usedMusic.map((m: Music) => ({
      mediaItemId: m.mediaItemId,
      mediaType: "music" as const,
      usageContext: "buffer" as const,
    })),
  ];

  if (mediaUsageRecords.length > 0) {
    recentlyUsedMediaRepository.recordBatchUsage(mediaUsageRecords);

    // Log buffer creation summary
    console.log(
      `[Buffer Engine] Created buffer with ${spectrumResult.commercials.length} commercials, ${spectrumResult.shorts.length} shorts, ${spectrumResult.music.length} music tracks`
    );
  }

  return {
    selectedMedia,
    remainingDuration,
  };
}

export function onlyCommercials(
  activeHolidayTags: Tag[],
  eraTags: Tag[],
  commercials: Commercial[],
  defaultCommercials: Commercial[],
  duration: number
): {
  selectedCommercials: Commercial[];
  remainingDuration: number;
} {
  let selectedCommercials: Commercial[] = [];
  let candidateCommercials: Commercial[] = [...commercials];
  let remainingDuration = duration;

  // Helper function to check if there are commercials that could potentially fill remaining duration
  const hasViableCommercials = (commercials: Commercial[]): boolean => {
    return commercials.some((c) => (c.duration || 0) <= remainingDuration);
  };

  // Fill the buffer by picking commercials one at a time
  while (
    remainingDuration > 0 &&
    (hasViableCommercials(candidateCommercials) ||
      hasViableCommercials(defaultCommercials))
  ) {
    let selected = false;

    // Try to find a single commercial that exactly fills remaining duration
    let exactMatch = candidateCommercials.find(
      (c) => c.duration === remainingDuration
    );
    if (exactMatch) {
      selectedCommercials.push(exactMatch);
      remainingDuration -= exactMatch.duration || 0;
      candidateCommercials = candidateCommercials.filter(
        (c) => c.mediaItemId !== exactMatch.mediaItemId
      );
      selected = true;
    }

    // Try to find two commercials that together fill remaining duration
    if (!selected) {
      // Create a map: duration -> array of commercials (handle duplicates)
      const durationMap = new Map<number, Commercial[]>();
      for (const c of candidateCommercials) {
        const dur = c.duration || 0;
        if (!durationMap.has(dur)) {
          durationMap.set(dur, []);
        }
        durationMap.get(dur)!.push(c);
      }

      // O(n) search: for each commercial, check if complement exists
      for (const c1 of candidateCommercials) {
        if (selected) break;
        const dur1 = c1.duration || 0;
        const needed = remainingDuration - dur1;

        if (needed > 0 && durationMap.has(needed)) {
          const complements = durationMap.get(needed)!;
          // Find a complement that's not the same commercial
          for (const c2 of complements) {
            if (c1.mediaItemId !== c2.mediaItemId) {
              selectedCommercials.push(c1);
              selectedCommercials.push(c2);
              remainingDuration -= dur1 + needed;
              candidateCommercials = candidateCommercials.filter(
                (c) =>
                  c.mediaItemId !== c1.mediaItemId &&
                  c.mediaItemId !== c2.mediaItemId
              );
              selected = true;
              break;
            }
          }
        }
      }
    }

    // Pick a random commercial from candidates
    if (!selected && candidateCommercials.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * candidateCommercials.length
      );
      const randomCommercial = candidateCommercials[randomIndex];
      selectedCommercials.push(randomCommercial);
      remainingDuration -= randomCommercial.duration || 0;
      candidateCommercials.splice(randomIndex, 1);
      selected = true;
    }

    // If no candidates left, try default commercials
    if (!selected && candidateCommercials.length === 0) {
      // Try to find a single default commercial that exactly fills remaining duration
      let exactMatchDefault = defaultCommercials.find(
        (c) => c.duration === remainingDuration
      );
      if (exactMatchDefault) {
        selectedCommercials.push(exactMatchDefault);
        remainingDuration -= exactMatchDefault.duration || 0;
        selected = true;
      }

      // Try to find two default commercials that together fill remaining duration
      if (!selected) {
        // Create a map: duration -> array of commercials (handle duplicates)
        const durationMap = new Map<number, Commercial[]>();
        for (const c of defaultCommercials) {
          const dur = c.duration || 0;
          if (!durationMap.has(dur)) {
            durationMap.set(dur, []);
          }
          durationMap.get(dur)!.push(c);
        }

        // O(n) search: for each commercial, check if complement exists
        for (const c1 of defaultCommercials) {
          if (selected) break;
          const dur1 = c1.duration || 0;
          const needed = remainingDuration - dur1;

          if (needed > 0 && durationMap.has(needed)) {
            const complements = durationMap.get(needed)!;
            // Find a complement that's not the same commercial
            for (const c2 of complements) {
              if (c1.mediaItemId !== c2.mediaItemId) {
                selectedCommercials.push(c1);
                selectedCommercials.push(c2);
                remainingDuration -= dur1 + needed;
                selected = true;
                break;
              }
            }
          }
        }
      }

      // Pick a random default commercial
      if (!selected && defaultCommercials.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * defaultCommercials.length
        );
        const randomCommercial = defaultCommercials[randomIndex];
        selectedCommercials.push(randomCommercial);
        remainingDuration -= randomCommercial.duration || 0;
        selected = true;
      }
    }

    // If nothing was selected, we can't fill more, so break
    if (!selected) {
      break;
    }
  }

  return {
    selectedCommercials,
    remainingDuration,
  };
}
