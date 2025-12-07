import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../types/StreamType.js";
import { endOfDay } from "date-fns";
import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";
import { facetRepository } from "../repositories/facetRepository.js";
import { recentlyUsedMediaRepository } from "../repositories/recentlyUsedMediaRepository.js";
import { findNextCadenceTime } from "../utils/common.js";
import { createBuffer } from "./bufferConstructor.js";
import { tagRepository } from "../repositories/tagsRepository.js";
import * as playerManager from "./playerManager.js";

/**
 * Constructs remaining media blocks until end of day
 * Helper function to reduce duplication across stream construction paths
 */
function constructRemainingStream(
  startTime: number,
  endOfDayUnix: number,
  firstMediaTags: Tag[],
  activeHolidayTags: Tag[],
  streamConstructionOptions: StreamConstructionOptions
): MediaBlock[] {
  const remainingStreamBlocks: MediaBlock[] = [];
  let timepoint = startTime;

  while (timepoint < endOfDayUnix) {
    const nextMedia = streamConstructionOptions.Themed
      ? selectedFacetsMedia(firstMediaTags, activeHolidayTags, timepoint)
      : selectRandomMediaForStream(timepoint);
    if (!nextMedia) {
      break;
    }

    if (timepoint + (nextMedia.duration || 0) > endOfDayUnix) {
      break;
    }

    const block = new MediaBlock([], nextMedia as Movie | Episode, timepoint);
    remainingStreamBlocks.push(block);
    timepoint += block.duration;
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
  const backfillStart = mediaBlockA.getEndTime();
  const backfillEnd = mediaBlockB.startTime;
  const backfillDuration = Math.max(0, backfillEnd - backfillStart);

  if (backfillDuration > 0) {
    const tagsA = mediaBlockA.mainBlock?.tags || [];
    const tagsB = mediaBlockB.mainBlock?.tags || [];
    const backfillBuffer = createBuffer(
      backfillDuration,
      tagsA,
      tagsB,
      activeHolidayTags,
      backfillStart
    );
    const backfillBlock = new MediaBlock(
      backfillBuffer.buffer,
      undefined,
      backfillStart
    );
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
    //Get active holiday tags
    const dateString = new Date(timepoint * 1000).toISOString();
    const activeHolidayTags =
      tagRepository.findActiveHolidaysByDate(dateString);

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
        firstBlock = new MediaBlock(
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
        const mediaBlock = new MediaBlock(
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
          streamConstructionOptions
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
        firstBlock = new MediaBlock(
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
          streamConstructionOptions
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
      firstBlock = new MediaBlock(
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
        streamConstructionOptions
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

/**
 * Selects a random facet combination (genre + aesthetic)
 * Used for procedural stream generation
 */
export function selectRandomFacetCombo(): {
  genre: Tag;
  aesthetic: Tag;
} | null {
  const allFacets = facetRepository.findAll();
  if (allFacets.length === 0) {
    return null;
  }

  const randomFacet = allFacets[Math.floor(Math.random() * allFacets.length)];

  if (randomFacet.genre && randomFacet.aesthetic) {
    return {
      genre: randomFacet.genre,
      aesthetic: randomFacet.aesthetic,
    };
  }

  return null;
}

/**
 * Finds media matching a specific facet (genre/aesthetic combination)
 */
export function findMediaWithFacet(facet: {
  genre: Tag;
  aesthetic: Tag;
}): Movie | Show | null {
  // Find movies with both tags
  const moviesWithGenre = movieRepository.findByTag(facet.genre.tagId);
  const moviesWithBoth = moviesWithGenre.filter((movie: Movie) =>
    movie.tags.some((tag: Tag) => tag.tagId === facet.aesthetic.tagId)
  );

  if (moviesWithBoth.length > 0) {
    return moviesWithBoth[Math.floor(Math.random() * moviesWithBoth.length)];
  }

  // Find shows with both tags
  const showsWithGenre = showRepository.findByTag(facet.genre.tagId);
  const showsWithBoth = showsWithGenre.filter((show: Show) =>
    show.tags.some((tag: Tag) => tag.tagId === facet.aesthetic.tagId)
  );

  if (showsWithBoth.length > 0) {
    return showsWithBoth[Math.floor(Math.random() * showsWithBoth.length)];
  }

  return null;
}
