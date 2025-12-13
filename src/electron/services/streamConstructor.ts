import { endOfDay } from "date-fns";
import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";
import { recentlyUsedMediaRepository } from "../repositories/recentlyUsedMediaRepository.js";
import { findNextCadenceTime, segmentTags } from "../utils/common.js";
import { createBuffer } from "./bufferConstructor.js";
import { tagRepository } from "../repositories/tagsRepository.js";
import * as playerManager from "./playerManager.js";
import { createMediaBlock } from "../../../factories/mediaBlock.factory.js";
import { holidayIntentCacheManager } from "./holidayIntentCacheManager.js";
import { selectFacetAdjacentMedia } from "../prisms/facets.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines if a date string matches any holiday date in the provided tags
 * @param dateString ISO date string (YYYY-MM-DD)
 * @param holidays Array of holiday tags to check
 * @returns True if date matches a holiday's exact date
 */
function isHolidayDate(dateString: string, holidays: Tag[]): boolean {
  for (const holiday of holidays) {
    if (holiday.holidayDates && holiday.holidayDates.includes(dateString)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines if a unix timestamp falls within any holiday's season span
 * @param unixSeconds Unix timestamp in seconds
 * @param holidays Array of holiday tags to check
 * @returns True if date falls within a holiday's season span
 */
function isHolidaySeason(unixSeconds: number, holidays: Tag[]): boolean {
  const date = new Date(unixSeconds * 1000);
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

  for (const holiday of holidays) {
    if (holiday.seasonStartDate && holiday.seasonEndDate) {
      if (
        dateString >= holiday.seasonStartDate &&
        dateString <= holiday.seasonEndDate
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Constructs remaining media blocks until end of day
 * Handles themed vs random selection with holiday content awareness
 */
function constructRemainingStream(
  startTime: number,
  endOfDayUnix: number,
  firstMediaTags: Tag[],
  activeHolidayTags: Tag[],
  streamConstructionOptions: StreamConstructionOptions,
  dateString: string
): MediaBlock[] {
  const remainingStreamBlocks: MediaBlock[] = [];
  let timepoint = startTime;

  const segmentedTags = segmentTags(firstMediaTags);

  // Determine if today is a holiday date or within a holiday season
  const todayIsHolidayDate = isHolidayDate(dateString, activeHolidayTags);
  const todayIsHolidaySeason =
    !todayIsHolidayDate && isHolidaySeason(startTime, activeHolidayTags);

  // Track holiday media play counts for the day (only used on holiday dates)
  // Key: mediaItemId, Value: play count (0-2)
  const holidayMediaPlayCount: Map<string, number> = new Map();

  while (timepoint < endOfDayUnix) {
    const nextMedia = streamConstructionOptions.Themed
      ? selectThemedMediaForStream(
          segmentedTags,
          activeHolidayTags,
          timepoint,
          dateString,
          todayIsHolidayDate,
          todayIsHolidaySeason,
          holidayMediaPlayCount
        )
      : selectRandomMediaForStream(timepoint);
    if (!nextMedia) {
      break;
    }

    if (timepoint + (nextMedia.duration || 0) > endOfDayUnix) {
      break;
    }

    const block = createMediaBlock([], nextMedia as Movie | Episode, timepoint);
    remainingStreamBlocks.push(block);
    timepoint += block.duration;

    // Track holiday media plays if on holiday date
    if (
      streamConstructionOptions.Themed &&
      todayIsHolidayDate &&
      nextMedia.mediaItemId
    ) {
      const currentCount =
        holidayMediaPlayCount.get(nextMedia.mediaItemId) || 0;
      holidayMediaPlayCount.set(nextMedia.mediaItemId, currentCount + 1);
    }
  }

  return remainingStreamBlocks;
}

/**
 * Creates and pushes a backfill buffer between two media blocks
 * Helper function to reduce duplication
 */
async function createAndPushBackfillBuffer(
  mediaBlockA: MediaBlock,
  mediaBlockB: MediaBlock,
  activeHolidayTags: Tag[]
): Promise<void> {
  let backfillDuration: number = 0;
  if (
    mediaBlockA.mainBlock &&
    mediaBlockA.mainBlock.duration &&
    mediaBlockA.mainBlock.durationLimit
  ) {
    backfillDuration =
      mediaBlockA.mainBlock.durationLimit - mediaBlockA.mainBlock.duration;
  }

  if (backfillDuration > 0) {
    const tagsA = mediaBlockA.mainBlock?.tags || [];
    const tagsB = mediaBlockB.mainBlock?.tags || [];
    const backfillBuffer = createBuffer(
      backfillDuration,
      tagsA,
      tagsB,
      activeHolidayTags,
      mediaBlockA.startTime
    );
    const backfillBlock = createMediaBlock(backfillBuffer.buffer, undefined);
    await playerManager.addMediaBlockToPlayer(backfillBlock);
  }
}

/**
 * Main stream constructor entry point
 * Determines construction approach based on stream type
 */
export async function constructStream(
  streamType: StreamType,
  streamConstructionOptions: StreamConstructionOptions,
  rightNow: number,
  previousTags?: Tag[]
): Promise<[MediaBlock[], string]> {
  switch (streamType) {
    case StreamType.Cont:
      return constructContinuousStream(
        streamConstructionOptions,
        rightNow,
        previousTags
      );
    case StreamType.Adhoc:
      // TODO: Implement adhoc stream construction
      return [[], "Adhoc streams not yet implemented"];
    default:
      return [[], `Unsupported stream type: ${streamType}`];
  }
}

/**
 * Constructs a continuous 24/7 stream
 * Fills time from now until end of day with media
 */
async function constructContinuousStream(
  streamConstructionOptions: StreamConstructionOptions,
  timepoint: number,
  previousTags?: Tag[]
): Promise<[MediaBlock[], string]> {
  const streamBlocks: MediaBlock[] = [];
  const constructionStartTime = Date.now(); // Capture start time for deviation tracking

  try {
    //Get active holiday tags and extract date string
    const fullDateString = new Date(timepoint * 1000).toISOString();
    const dateString = fullDateString.split("T")[0]; // Extract YYYY-MM-DD
    const activeHolidayTags =
      tagRepository.findActiveHolidaysByDate(fullDateString);

    // Select first media if not provided
    let selectedFirstMedia = selectRandomMediaForStream(timepoint);

    if (!selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    // Calculate end of day
    const endOfDayDate = endOfDay(new Date(timepoint * 1000));
    const endOfDayUnix = Math.floor(endOfDayDate.getTime() / 1000);
    let currentTime = timepoint;

    let firstBlock: MediaBlock;

    if (streamConstructionOptions.Cadence) {
      // Check if there is any time between current time and next cadence point
      const nextCadenceTime = findNextCadenceTime(currentTime);
      if (nextCadenceTime > currentTime) {
        // CADENCE WITH FILLER: Create initial buffer to align to cadence
        const fillerDuration = nextCadenceTime - currentTime;
        const initialBuffer = createBuffer(
          fillerDuration,
          [],
          previousTags || selectedFirstMedia.tags || [],
          activeHolidayTags,
          currentTime
        );
        firstBlock = createMediaBlock(
          initialBuffer.buffer,
          undefined,
          currentTime
        );
        // Push initial filler buffer to player immediately
        let timeDeltaMs = Date.now() - constructionStartTime;
        await playerManager.addMediaBlockToPlayer(firstBlock);
        await playerManager.play({ timeDeltaMs });

        // While buffer plays, immediately push the selectedFirstMedia block
        // This extends the time available for rest of stream construction
        const mediaBlock = createMediaBlock(
          [],
          selectedFirstMedia as Movie | Episode,
          nextCadenceTime
        );
        await playerManager.addMediaBlockToPlayer(mediaBlock);

        currentTime = nextCadenceTime + mediaBlock.duration;

        // Construct remaining stream blocks
        const remainingStreamBlocks = constructRemainingStream(
          currentTime,
          endOfDayUnix,
          selectedFirstMedia.tags || [],
          activeHolidayTags,
          streamConstructionOptions,
          dateString
        );

        // Create backfill buffer between selectedFirstMedia and first remaining block
        if (remainingStreamBlocks.length > 0) {
          await createAndPushBackfillBuffer(
            mediaBlock,
            remainingStreamBlocks[0],
            activeHolidayTags
          );
        }

        // Add initial blocks to streamBlocks
        streamBlocks.push(firstBlock);
        streamBlocks.push(mediaBlock);

        // Add remaining stream blocks to streamBlocks
        streamBlocks.push(...remainingStreamBlocks);
      } else {
        // CADENCE WITHOUT FILLER: Already at cadence, media starts immediately
        firstBlock = createMediaBlock(
          [],
          selectedFirstMedia as Movie | Episode,
          currentTime
        );
        // Push firstBlock immediately to player
        const timeDeltaMs = Date.now() - constructionStartTime;
        await playerManager.addMediaBlockToPlayer(firstBlock);
        await playerManager.play({ timeDeltaMs });

        streamBlocks.push(firstBlock);
        currentTime += firstBlock.duration;

        // Construct remaining stream blocks
        const remainingStreamBlocks = constructRemainingStream(
          currentTime,
          endOfDayUnix,
          selectedFirstMedia.tags || [],
          activeHolidayTags,
          streamConstructionOptions,
          dateString
        );

        // Create backfill buffer between firstBlock and first remaining block
        if (remainingStreamBlocks.length > 0) {
          await createAndPushBackfillBuffer(
            firstBlock,
            remainingStreamBlocks[0],
            activeHolidayTags
          );
        }

        // Add remaining stream blocks to streamBlocks
        streamBlocks.push(...remainingStreamBlocks);
      }
    } else {
      // NON-CADENCE: First media plays immediately
      firstBlock = createMediaBlock(
        [],
        selectedFirstMedia as Movie | Episode,
        currentTime
      );
      // Push firstBlock immediately to player
      const timeDeltaMs = Date.now() - constructionStartTime;
      await playerManager.addMediaBlockToPlayer(firstBlock);
      await playerManager.play({ timeDeltaMs });

      streamBlocks.push(firstBlock);
      currentTime += firstBlock.duration;

      // Construct remaining stream blocks
      const remainingStreamBlocks = constructRemainingStream(
        currentTime,
        endOfDayUnix,
        selectedFirstMedia.tags || [],
        activeHolidayTags,
        streamConstructionOptions,
        dateString
      );

      // Create backfill buffer between firstBlock and first remaining block
      if (remainingStreamBlocks.length > 0) {
        await createAndPushBackfillBuffer(
          firstBlock,
          remainingStreamBlocks[0],
          activeHolidayTags
        );
      }

      // Add remaining stream blocks to streamBlocks
      streamBlocks.push(...remainingStreamBlocks);
    }

    // NOTE: Remaining stream blocks are now in streamBlocks array
    // They should be managed by streamManager for upcoming/onDeck processing
    // NOT pushed directly to player

    console.log(
      `[StreamConstructor] Created ${streamBlocks.length} media blocks for continuous stream`
    );
    return [streamBlocks, ""];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[StreamConstructor] Stream construction failed: ${message}`);
    return [[], message];
  }
}

/**
 * Selects a random media item for stream construction
 * Randomly chooses between shows and movies, respecting episode progression for shows
 * Cleans up expired recently-used media records before selection
 */
function selectRandomMediaForStream(timepoint: number): Movie | Episode | null {
  // Clean up expired media records first
  const unixSeconds = Math.floor(timepoint);
  recentlyUsedMediaRepository.deleteExpired(unixSeconds);

  const showCount = showRepository.count();
  const movieCount = movieRepository.count();

  // If neither exists, return null
  if (showCount === 0 && movieCount === 0) {
    return null;
  }

  // If only movies exist
  if (showCount === 0) {
    return movieRepository.findRandomMovie();
  }

  // If only shows exist
  if (movieCount === 0) {
    const randomShow = showRepository.findRandomShow();
    if (randomShow) {
      return getNextEpisodeForShow(randomShow, StreamType.Cont);
    }
    return null;
  }

  // Both exist - randomly choose between them
  const useShow = Math.random() < 0.5;

  if (useShow) {
    const randomShow = showRepository.findRandomShow();
    if (randomShow) {
      const episode = getNextEpisodeForShow(randomShow, StreamType.Cont);
      if (episode) return episode;
    }
    // Fall back to movie if show selection failed
    return movieRepository.findRandomMovie();
  } else {
    return movieRepository.findRandomMovie();
  }
}

/**
 * Selects themed media based on holiday context
 * Three algorithmic paths:
 * 1. Holiday Date: Saturate with holiday content (max 2 plays per media item)
 * 2. Holiday Season: Respect 3-day distribution from holiday intent
 * 3. Non-Holiday: Select specialty/facet-adjacent media
 *
 * @param firstMediaTags Tags from first media of the day
 * @param activeHolidayTags Active holiday tags for today
 * @param timepoint Unix timestamp (seconds)
 * @param dateString ISO date string (YYYY-MM-DD)
 * @param isHolidayDate True if today is an exact holiday date
 * @param isHolidaySeason True if today is within a holiday season span
 * @param holidayMediaPlayCount Map tracking play counts (only used on holiday dates)
 * @returns Selected movie/episode or null if none available
 */
function selectHolidayMediaForTag(
  holidayTagId: string,
  dateString: string
): Movie | Episode | null {
  // Get movies and episodes with this holiday tag
  const moviesWithTag = movieRepository.findByTags([holidayTagId]);

  // For episodes, we need to get shows with the holiday tag and then get their episodes
  // Since we're looking for episodes tagged with the holiday
  let episodesWithTag: Episode[] = [];
  const showsWithTag = showRepository.findByEpisodeTags([holidayTagId]);

  for (const show of showsWithTag) {
    if (show.episodes) {
      for (const episode of show.episodes) {
        if (
          episode.tags &&
          episode.tags.some((t) => t.tagId === holidayTagId)
        ) {
          episodesWithTag.push(episode);
        }
      }
    }
  }

  // Combine pools
  const totalAvailable = moviesWithTag.length + episodesWithTag.length;

  if (totalAvailable === 0) {
    return null;
  }

  // Randomly choose between movie and episode pool
  const useMovie = Math.random() < moviesWithTag.length / totalAvailable;

  if (useMovie && moviesWithTag.length > 0) {
    return moviesWithTag[Math.floor(Math.random() * moviesWithTag.length)];
  } else if (episodesWithTag.length > 0) {
    return episodesWithTag[Math.floor(Math.random() * episodesWithTag.length)];
  } else if (moviesWithTag.length > 0) {
    return moviesWithTag[Math.floor(Math.random() * moviesWithTag.length)];
  }

  return null;
}

/**
 * Selects media based on specialty tag relationships
 * Finds other media that share specialty tags with the current content
 * @param specialtyTags Specialty tags from current media
 * @returns Movie or Episode with matching specialty, or null if none found
 */
function selectSpecialtyAdjacentMedia(
  specialtyTags: Tag[]
): Movie | Episode | null {
  if (specialtyTags.length === 0) {
    return null;
  }

  const specialtyTagIds = specialtyTags.map((t) => t.tagId);

  // Find all media that have any of these specialty tags
  const moviesWithSpecialty = movieRepository.findByTags(specialtyTagIds);

  // Find shows with secondary tags matching specialty tags
  let episodesWithSpecialty: Episode[] = [];
  for (const specialtyTagId of specialtyTagIds) {
    const showsWithSpecialty = showRepository.findByTag(specialtyTagId);
    for (const show of showsWithSpecialty) {
      if (show.episodes) {
        for (const episode of show.episodes) {
          // if (
          //   episode.secondaryTags &&
          //   episode.secondaryTags.some((t: Tag) =>
          //     specialtyTagIds.includes(t.tagId)
          //   )
          // ) {
          //   episodesWithSpecialty.push(episode);
          // }
        }
      }
    }
  }

  // Combine pools
  const totalAvailable =
    moviesWithSpecialty.length + episodesWithSpecialty.length;

  if (totalAvailable === 0) {
    return null;
  }

  // Randomly choose between movie and episode pool
  const useMovie = Math.random() < moviesWithSpecialty.length / totalAvailable;

  if (useMovie && moviesWithSpecialty.length > 0) {
    return moviesWithSpecialty[
      Math.floor(Math.random() * moviesWithSpecialty.length)
    ];
  } else if (episodesWithSpecialty.length > 0) {
    return episodesWithSpecialty[
      Math.floor(Math.random() * episodesWithSpecialty.length)
    ];
  } else if (moviesWithSpecialty.length > 0) {
    return moviesWithSpecialty[
      Math.floor(Math.random() * moviesWithSpecialty.length)
    ];
  }

  return null;
}

export function selectThemedMediaForStream(
  segmentedTags: SegmentedTags,
  activeHolidayTags: Tag[],
  timepoint: number,
  dateString: string,
  isHolidayDate: boolean,
  isHolidaySeason: boolean,
  holidayMediaPlayCount: Map<string, number>
): Movie | Episode | null {
  // PATH 1: HOLIDAY DATE - Saturate with holiday content
  if (isHolidayDate) {
    // Build blacklist of media that have been played 2+ times
    const blacklistedMediaIds = Array.from(holidayMediaPlayCount.entries())
      .filter(([_, count]) => count >= 2)
      .map(([mediaId, _]) => mediaId);

    // Collect all movies and episodes from all active holiday tags (not blacklisted)
    const availableMovies: Movie[] = [];
    const availableEpisodes: Episode[] = [];

    for (const holidayTag of activeHolidayTags) {
      // Get movies with this holiday tag
      const moviesWithTag = movieRepository.findByTags([holidayTag.tagId]);
      for (const movie of moviesWithTag) {
        // Skip if blacklisted (played 2+ times)
        if (!blacklistedMediaIds.includes(movie.mediaItemId)) {
          availableMovies.push(movie);
        }
      }

      // Get episodes with this holiday tag
      const showsWithTag = showRepository.findByEpisodeTags([holidayTag.tagId]);
      for (const show of showsWithTag) {
        if (show.episodes) {
          for (const episode of show.episodes) {
            // Skip if blacklisted
            if (
              !blacklistedMediaIds.includes(episode.mediaItemId) &&
              episode.tags &&
              episode.tags.some((t) => t.tagId === holidayTag.tagId)
            ) {
              availableEpisodes.push(episode);
            }
          }
        }
      }
    }

    // Combine pools
    const totalAvailable = availableMovies.length + availableEpisodes.length;

    if (totalAvailable === 0) {
      // No more non-blacklisted holiday content available
      return null;
    }

    // Randomly choose between movie and episode pool
    const useMovie = Math.random() < availableMovies.length / totalAvailable;

    if (useMovie && availableMovies.length > 0) {
      return availableMovies[
        Math.floor(Math.random() * availableMovies.length)
      ];
    } else if (availableEpisodes.length > 0) {
      return availableEpisodes[
        Math.floor(Math.random() * availableEpisodes.length)
      ];
    } else if (availableMovies.length > 0) {
      return availableMovies[
        Math.floor(Math.random() * availableMovies.length)
      ];
    }

    return null;
  }

  // PATH 2: HOLIDAY SEASON - Respect 3-day distribution
  if (isHolidaySeason) {
    // Try each active holiday tag to see if we have budget for more content
    for (const holidayTag of activeHolidayTags) {
      // Check if we can add more content for this holiday today
      if (
        holidayIntentCacheManager.canAddMoreContent(
          holidayTag.tagId,
          dateString
        )
      ) {
        // Try to select media with this holiday tag
        const selectedMedia = selectHolidayMediaForTag(
          holidayTag.tagId,
          dateString
        );

        if (selectedMedia) {
          // Track the selected minutes (duration is in seconds, convert to minutes)
          const durationMinutes = Math.floor(
            (selectedMedia.duration || 0) / 60
          );
          holidayIntentCacheManager.trackSelectedMinutes(
            holidayTag.tagId,
            durationMinutes,
            dateString
          );
          return selectedMedia;
        }
      }
    }

    // If no holiday content available or all budgets exhausted, fall back to specialty/facet
    // PATH 3 logic will handle this
    return null;
  }

  // PATH 3: NON-HOLIDAY - Select specialty/facet-adjacent media
  // Strategy: Coin flip between specialty-adjacent or facet-adjacent
  // Fallback: Facet-adjacent if specialty yields no results

  // Attempt specialty-adjacent selection if specialty tags exist
  if (segmentedTags.specialtyTags.length > 0 && Math.random() < 0.5) {
    const selectedMedia = selectSpecialtyAdjacentMedia(segmentedTags.specialtyTags);
    if (selectedMedia) {
      return selectedMedia;
    }
  }

  // Fall back to facet-adjacent selection
  // This becomes the preferred fallback if specialty fails or we lost the coin flip
  const selectedMedia = selectFacetAdjacentMedia(segmentedTags);
  return selectedMedia;
}

/**
 * Gets the next episode for a show based on stream progression
 */
function getNextEpisodeForShow(
  show: Show,
  streamType: StreamType
): Episode | null {
  if (!show.episodes || show.episodes.length === 0) {
    return null;
  }

  // Get or create progression for this show/stream type combination
  const progressionId = `prog-${show.mediaItemId}-${streamType}`;
  let progression = episodeProgressionRepository.findByShowAndStreamType(
    show.mediaItemId,
    streamType
  );

  if (!progression) {
    // Create new progression starting at episode 1
    progression = episodeProgressionRepository.create({
      episodeProgressionId: progressionId,
      showItemId: show.mediaItemId,
      streamType: streamType,
      currentEpisodeNumber: 1,
      totalEpisodes: show.episodes.length,
      lastPlayedDate: new Date().toISOString(),
    });
  }

  // Get current episode or default to first
  const episodeNum = progression.currentEpisodeNumber || 1;
  const currentEpisode = show.episodes[episodeNum - 1];

  if (currentEpisode) {
    // Increment progression for next time
    const nextEpisodeNum =
      episodeNum < show.episodes.length ? episodeNum + 1 : 1; // Loop back to 1
    episodeProgressionRepository.updateEpisodeNumber(
      progression.episodeProgressionId,
      nextEpisodeNum,
      show.episodes.length
    );
  }

  return currentEpisode || null;
}
