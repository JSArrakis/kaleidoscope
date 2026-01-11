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
import { MediaBlock } from "../types/MediaBlock.js";

/**
 * Main stream constructor entry point
 * Determines construction approach based on stream type
 */
export async function createStream(
  streamType: StreamType,
  streamConstructionOptions: StreamConstructionOptions,
  rightNow: number
): Promise<[MediaBlock[], string]> {
  switch (streamType) {
    case StreamType.Cont:
      return constructContinuousStream(streamConstructionOptions, rightNow);
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
  incomingTimepoint: number
): Promise<[MediaBlock[], string]> {
  const streamBlocks: MediaBlock[] = [];
  const constructionStartTime = Date.now(); // Capture start time for deviation tracking

  try {
    // Create initialization data
    let initializationData: StreamInitializationData = createInitializationData(
      incomingTimepoint,
      streamConstructionOptions
    );

    if (!initializationData.selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    if (streamConstructionOptions.Cadence) {
      // ============================================================================
      // CADENCE: TRUE
      // ============================================================================

      //TODO: Check for next scheduled block if there is one between now and end of day

      // Check if there is any time between current time and next cadence point
      const nextCadenceTime = findNextCadenceTime(
        initializationData.startingTimepoint
      );

      if (nextCadenceTime > initializationData.startingTimepoint) {
        // ============================================================================
        // INITIAL BUFFER/FILLER BEFORE CADENCE POINT
        // ============================================================================

        // Create initial buffer to fill time until next cadence point
        const fillerDuration =
          nextCadenceTime - initializationData.startingTimepoint;

        // Create buffer using tags from previous block or selected first media
        const initialBuffer = createBuffer(
          fillerDuration,
          [],
          initializationData.selectedFirstMedia?.tags || [],
          initializationData.activeHolidayTags,
          initializationData.startingTimepoint
        );

        // Create media block for initial buffer
        const initialBufferBlock = createMediaBlock(
          initialBuffer.buffer,
          undefined,
          initializationData.startingTimepoint
        );

        // Push initial filler buffer to player immediately
        let timeDelta = Date.now() - constructionStartTime;
        await playerManager.addMediaBlockToPlayer(initialBufferBlock);
        await playerManager.play({ timeDelta });

        // While buffer plays, immediately push the selectedFirstMedia block
        // This extends the time available for rest of stream construction
        const initialAnchorMediaBlock = createMediaBlock(
          [],
          initializationData.selectedFirstMedia as Movie | Episode,
          nextCadenceTime
        );
        await playerManager.addMediaBlockToPlayer(initialAnchorMediaBlock);

        // Segment tags for themed selection
        const segmentedTags = segmentTags(
          initializationData.selectedFirstMedia?.tags || []
        );

        // Determine if today is a holiday date or within a holiday season
        const todayIsHolidayDate = isHolidayDate(
          incomingTimepoint,
          initializationData.activeHolidayTags
        );
        const todayIsHolidaySeason = isHolidaySeason(
          incomingTimepoint,
          initializationData.activeHolidayTags
        );

        // Select first media block for the iteration after the initial anchor media
        const firstIterationAnchorMedia = streamConstructionOptions.Themed
          ? selectThemedMediaForStream(
              segmentedTags,
              initializationData.startingTimepoint,
              initializationData.iterationDuration,
              initializationData.progressionMap,
              initializationData.activeHolidayTags,
              todayIsHolidayDate,
              todayIsHolidaySeason
            )
          : selectRandomMediaForStream(
              initializationData.startingTimepoint,
              initializationData.iterationDuration,
              initializationData.progressionMap,
              []
            );

        // Create media block for first media of iteration
        const iterationFirstMediaBlock = createMediaBlock(
          [],
          firstIterationAnchorMedia as Movie | Episode,
          nextCadenceTime + initialAnchorMediaBlock.duration
        );

        // Create backfill buffer between selectedFirstMedia and iterationFirstMedia
        // (which will be injected as the first anchor media of the iteration)
        await createAndPushBackfillBuffer(
          initialAnchorMediaBlock,
          iterationFirstMediaBlock,
          initializationData.activeHolidayTags
        );

        // Update current time to after media block
        // This next time point leaves a gap between the anchor media and the next cadence point
        // This is because we have not yet selected the next anchor media after this anchor media
        // Until we select that next anchor media, we cannot determine the buffer content between them
        const iterationTimePoint =
          nextCadenceTime + initializationData.selectedFirstMedia.durationLimit;

        // Construct remaining stream blocks until the end of the day
        const remainingStreamBlocks: MediaBlock[] = constructStream(
          iterationTimePoint,
          initializationData.endOfTimeWindow,
          initializationData.selectedFirstMedia.tags || [],
          initializationData.activeHolidayTags,
          streamConstructionOptions,
          iterationFirstMediaBlock,
          initializationData.progressionMap
        );

        // Add initial blocks to streamBlocks
        streamBlocks.push(initialBufferBlock);
        streamBlocks.push(initialAnchorMediaBlock);

        // Add remaining stream blocks to streamBlocks
        streamBlocks.push(...remainingStreamBlocks);
      } else {
        // ============================================================================
        // NO INITIAL BUFFER/FILLER BEFORE CADENCE POINT
        // ============================================================================
        const initialBufferBlock = createMediaBlock(
          [],
          initializationData.selectedFirstMedia as Movie | Episode,
          initializationData.startingTimepoint
        );
        // Push firstBlock immediately to player
        const timeDeltaMs = Date.now() - constructionStartTime;
        await playerManager.addMediaBlockToPlayer(initialBufferBlock);
        await playerManager.play({ timeDelta: timeDeltaMs });

        streamBlocks.push(initialBufferBlock);
        initializationData.startingTimepoint += initialBufferBlock.duration;

        // Construct remaining stream blocks
        const remainingStreamBlocks = constructStream(
          iterationTimePoint,
          initializationData.endOfTimeWindow,
          initializationData.selectedFirstMedia.tags || [],
          initializationData.activeHolidayTags,
          streamConstructionOptions,
          iterationFirstMediaBlock,
          initializationData.progressionMap
        );

        // Create backfill buffer between firstBlock and first remaining block
        if (remainingStreamBlocks.length > 0) {
          await createAndPushBackfillBuffer(
            initialBufferBlock,
            remainingStreamBlocks[0],
            initializationData.activeHolidayTags
          );
        }

        // Add remaining stream blocks to streamBlocks
        streamBlocks.push(...remainingStreamBlocks);
      }
    } else {
      // ============================================================================
      // CADENCE: FALSE
      // ============================================================================
      const initialBufferBlock = createMediaBlock(
        [],
        initializationData.selectedFirstMedia as Movie | Episode,
        initializationData.startingTimepoint
      );
      // Push firstBlock immediately to player
      const timeDeltaMs = Date.now() - constructionStartTime;
      await playerManager.addMediaBlockToPlayer(initialBufferBlock);
      await playerManager.play({ timeDelta: timeDeltaMs });

      streamBlocks.push(initialBufferBlock);
      initializationData.startingTimepoint += initialBufferBlock.duration;

      // Construct remaining stream blocks
      const remainingStreamBlocks = constructStream(
        initializationData.startingTimepoint,
        initializationData.endOfTimeWindow,
        initializationData.selectedFirstMedia.tags || [],
        initializationData.activeHolidayTags,
        dateString,
        streamConstructionOptions,
        initializationData.progressionMap
      );

      // Create backfill buffer between firstBlock and first remaining block
      if (remainingStreamBlocks.length > 0) {
        await createAndPushBackfillBuffer(
          initialBufferBlock,
          remainingStreamBlocks[0],
          initializationData.activeHolidayTags
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createInitializationData(
  incomingTimepoint: number,
  streamConstructionOptions: StreamConstructionOptions
): StreamInitializationData {
  const fullDateString = new Date(incomingTimepoint * 1000).toISOString();
  const dateString = fullDateString.split("T")[0]; // Extract YYYY-MM-DD
  const activeHolidayTags =
    tagRepository.findActiveHolidaysByDate(fullDateString);

  // Calculate end of day
  const endOfDayDate = endOfDay(new Date(incomingTimepoint * 1000));
  const endOfDayUnix = Math.floor(endOfDayDate.getTime() / 1000);

  // TODO: Check for scheduled blocks
  const nextScheduledBlock: ScheduledBlock | null = null;

  // Calculate end of timewindow
  let endOfTimeWindow = endOfDayUnix
  
  if (nextScheduledBlock && nextScheduledBlock.scheduledStartTime < endOfDayUnix) {
    endOfTimeWindow = nextScheduledBlock.scheduledStartTime;
  }

  // Find how many multiples of 30 minutes fit into endOfTimeWindow - timepoint
  const iterationDuration =
    Math.floor((endOfTimeWindow - incomingTimepoint) / (30 * 60)) * 30 * 60;
  let progressionMap: Map<string, number | undefined> =
    getProgressionsByStreamType(streamConstructionOptions.StreamType);

  const selectedFirstMedia = selectRandomMediaForStream(
    incomingTimepoint,
    iterationDuration,
    progressionMap,
    []
  );

  return {
    activeHolidayTags: activeHolidayTags,
    progressionMap: progressionMap,
    startingTimepoint: incomingTimepoint,
    iterationDuration: iterationDuration,
    endOfTimeWindow: endOfTimeWindow,
    selectedFirstMedia: selectedFirstMedia,
    nextScheduledBlock: nextScheduledBlock,
  };
}

function continuousStreamInitialization() {}

/**
 * Determines if a unix timestamp matches any holiday date in the provided tags
 * @param unixSeconds Unix timestamp in seconds
 * @param holidays Array of holiday tags to check
 * @returns True if date matches a holiday's exact date
 */
function isHolidayDate(unixSeconds: number, holidays: Tag[]): boolean {
  const date = new Date(unixSeconds * 1000);
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

  for (const holiday of holidays) {
    if (holiday.holidayDates && holiday.holidayDates.includes(dateString)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines if a unix timestamp falls within any holiday's season span
 * @param incomingTimepoint Unix timestamp in seconds
 * @param holidays Array of holiday tags to check
 * @returns True if date falls within a holiday's season span
 */
function isHolidaySeason(incomingTimepoint: number, holidays: Tag[]): boolean {
  const date = new Date(incomingTimepoint * 1000);
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
 * Gets current episode numbers for all shows in a given stream type
 * Returns a Map keyed by showItemId for O(1) lookup performance
 * @param streamType The stream type to query
 * @returns Map with showItemId as key and currentEpisodeNumber as value
 */
function getProgressionsByStreamType(
  streamType: StreamType
): Map<string, number | undefined> {
  const progressions =
    episodeProgressionRepository.findByStreamType(streamType);
  const progressionMap: Map<string, number | undefined> = new Map<
    string,
    number | undefined
  >();

  for (const progression of progressions) {
    progressionMap.set(
      progression.showItemId,
      progression.currentEpisodeNumber
    );
  }

  return progressionMap;
}

/**
 * Checks if a show's next episode (based on progression) fits within available duration
 * Handles both regular and overDuration episodes efficiently
 *
 * @param show The show to check
 * @param progressionMap Temporary progression tracking during stream construction (showItemId -> episodeNumber)
 * @param availableDuration The remaining duration in seconds
 * @returns true if the next episode fits, false otherwise
 */
function doesNextEpisodeFitDuration(
  show: Show,
  progressionMap: Map<string, number | undefined>,
  availableDuration: number
): boolean {
  if (show.episodes.length === 0) {
    return false;
  }
  // Get the next episode number from progression map
  const nextEpisodeNum = progressionMap.get(show.mediaItemId) || 1;
  const nextEpisode = show.episodes[nextEpisodeNum - 1];

  return nextEpisode.duration <= availableDuration;
}

/**
 * Increments the episode progression for a show in the temp progression map
 * Handles wraparound to episode 1 when the last episode is reached
 *
 * @param show The show being selected
 * @param progressionMap Temporary progression map to update (showItemId -> episodeNumber)
 */
function incrementShowProgression(
  show: Show,
  progressionMap: Map<string, number | undefined>
): void {
  const currentNum = progressionMap.get(show.mediaItemId) || 1;
  const nextNum = currentNum < show.episodes.length ? currentNum + 1 : 1;
  progressionMap.set(show.mediaItemId, nextNum);
}

/**
 * Constructs remaining media blocks until end of day
 * Handles themed vs random selection with holiday content awareness
 */
function constructStream(
  incomingTimepoint: number,
  endOfTimeWindow: number,
  firstMediaTags: Tag[],
  activeHolidayTags: Tag[],
  streamConstructionOptions: StreamConstructionOptions,
  iterationFirstMediaBlock: MediaBlock,
  progressionMap?: Map<string, number | undefined>
): MediaBlock[] {
  // Create a copy of progressionMap if it exists, else create a new empty map
  if (!progressionMap) {
    progressionMap = new Map<string, number | undefined>();
  } else {
    // Create a copy of the existing progressionMap to avoid mutating the original
    progressionMap = new Map(progressionMap);
  }

  const iterationBlocks: MediaBlock[] = [];

  iterationBlocks.push(iterationFirstMediaBlock);

  let timepoint = incomingTimepoint + iterationFirstMediaBlock.duration;

  const segmentedTags = segmentTags(firstMediaTags);

  // Determine if today is a holiday date or within a holiday season
  const todayIsHolidayDate = isHolidayDate(
    incomingTimepoint,
    activeHolidayTags
  );
  const todayIsHolidaySeason =
    !todayIsHolidayDate &&
    isHolidaySeason(incomingTimepoint, activeHolidayTags);

  while (timepoint < endOfTimeWindow) {
    const remainingDuration = endOfTimeWindow - timepoint;
    if (remainingDuration <= 0) {
      break;
    }
    const nextMedia = streamConstructionOptions.Themed
      ? selectThemedMediaForStream(
          segmentedTags,
          timepoint,
          remainingDuration,
          progressionMap,
          activeHolidayTags,
          todayIsHolidayDate,
          todayIsHolidaySeason
        )
      : selectRandomMediaForStream(
          timepoint,
          remainingDuration,
          progressionMap,
          []
        );

    const block = createMediaBlock([], nextMedia as Movie | Episode, timepoint);
    iterationBlocks.push(block);
    timepoint += block.duration;

    // TODO Track holiday media plays if on holiday date
  }

  return iterationBlocks;
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
 * Selects a random media item for stream construction
 * Randomly chooses between shows and movies, respecting episode progression for shows
 * Cleans up expired recently-used media records before selection
 */
function selectRandomMediaForStream(
  timepoint: number,
  duration: number,
  progressionMap: Map<string, number | undefined>,
  ageGroups: Tag[]
): Movie | Episode | null {
  // Clean up expired media records first
  recentlyUsedMediaRepository.deleteExpired(timepoint);

  // If duration is above an hour and a half (5400 seconds), flip a coin to choose show or movie
  // Otherwise default to a show for shorter durations
  const chooseMovie = duration >= 5400 ? Math.random() < 0.5 : false;
  if (chooseMovie) {
    // Select random movie
    const movie: Movie | null = movieRepository.findRandomMovieUnderDuration(
      duration,
      ageGroups
    );
    if (movie) {
      return movie;
    } else {
      // Fallback to show if no movie found
      const shows = showRepository.findAllShowsUnderDuration(duration);
      return getEpisodeFromShowCandidates(shows, progressionMap, duration);
    }
  } else {
    const shows = showRepository.findAllShowsUnderDuration(duration);
    return getEpisodeFromShowCandidates(shows, progressionMap, duration);
  }
}

export function getEpisodeFromShowCandidates(
  shows: Show[],
  progressionMap: Map<string, number | undefined>,
  duration: number
): Episode | null {
  // shuffle shows for randomness
  for (let i = shows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shows[i], shows[j]] = [shows[j], shows[i]];
  }

  for (const show of shows) {
    if (doesNextEpisodeFitDuration(show, progressionMap, duration)) {
      // Increment progression for next selection
      incrementShowProgression(show, progressionMap);
      const nextEpisodeNum = progressionMap.get(show.mediaItemId) || 1;
      return show.episodes[nextEpisodeNum - 1];
    }
  }

  return null;
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
  specialtyTags: Tag[],
  ageGroupTags: Tag[],
  duration: number,
  progressionMap: Map<string, number | undefined>
): Movie | Episode | null {
  if (specialtyTags.length === 0) {
    return null;
  }

  // Find all media that have any of these specialty tags
  const moviesWithSpecialty =
    movieRepository.findByTagsAndAgeGroupsUnderDuration(
      specialtyTags,
      ageGroupTags,
      duration
    );

  return null;
}

export function selectThemedMediaForStream(
  segmentedTags: SegmentedTags,
  timepoint: number,
  duration: number,
  progressionMap: Map<string, number | undefined>,
  activeHolidayTags: Tag[],
  isHolidayDate: boolean,
  isHolidaySeason: boolean
): Movie | Episode | null {
  // PATH 1: HOLIDAY DATE - Saturate with holiday content
  if (isHolidayDate) {
    // TODO: Smart Shuffle saturated holiday content selection so movies do not play back to back
    // Collect all movies and episodes from all active holiday tags (not blacklisted)
    const availableMovies: Movie[] = [];
    const availableEpisodes: Episode[] = [];

    for (const holidayTag of activeHolidayTags) {
      // Get movies with this holiday tag
      const moviesWithTag = movieRepository.findByTags([holidayTag.tagId]);
      for (const movie of moviesWithTag) {
        availableMovies.push(movie);
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
      // TODO
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
  }

  // PATH 3: NON-HOLIDAY - Select specialty/facet-adjacent media
  // Strategy: Coin flip between specialty-adjacent or facet-adjacent
  // Fallback: Facet-adjacent if specialty yields no results

  // Attempt specialty-adjacent selection if specialty tags exist
  if (segmentedTags.specialtyTags.length > 0 && Math.random() < 0.5) {
    const selectedMedia = selectSpecialtyAdjacentMedia(
      segmentedTags.specialtyTags,
      duration,
      progressionMap
    );
    if (selectedMedia) {
      return selectedMedia;
    }
  }

  // Fall back to facet-adjacent selection
  // This becomes the preferred fallback if specialty fails or we lost the coin flip
  const selectedMedia = selectFacetAdjacentMedia(
    segmentedTags,
    duration,
    progressionMap
  );
  // if still no media found, select random media as last resort
  if (!selectedMedia) {
    return selectRandomMediaForStream(
      timepoint,
      duration,
      progressionMap,
      segmentedTags.ageGroupTags
    );
  }
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
      lastPlayedDate: new Date(0).toISOString(), // Epoch - nothing played yet
    });
  }

  // Get current episode or default to first
  const episodeNum = progression.currentEpisodeNumber || 1;
  const currentEpisode = show.episodes[episodeNum - 1];

  return currentEpisode || null;
}
