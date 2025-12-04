import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../types/StreamType.js";
import { endOfDay } from "date-fns";
import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";
import { facetRepository } from "../repositories/facetRepository.js";
import { findNextCadenceTime } from "../utils/common.js";

/**
 * Main stream constructor entry point
 * Determines construction approach based on stream type
 */
export function constructStream(
  streamType: StreamType,
  rightNow: number,
  cadence: boolean = false,
  firstMedia?: Episode | Movie
): [MediaBlock[], string] {
  switch (streamType) {
    case StreamType.Cont:
      return constructContinuousStream(rightNow, cadence, firstMedia);
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
function constructContinuousStream(
  rightNow: number,
  cadence: boolean = false,
  firstMedia?: Episode | Movie
): [MediaBlock[], string] {
  const streamBlocks: MediaBlock[] = [];

  try {
    // Select first media if not provided
    let selectedFirstMedia = firstMedia || selectRandomMediaForStream();

    if (!selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    // Calculate end of day
    const endOfDayDate = endOfDay(new Date(rightNow * 1000));
    const endOfDayUnix = Math.floor(endOfDayDate.getTime() / 1000);
    let currentTime = rightNow;

    let firstBlock: MediaBlock;

    if (cadence) {
      // Check if there is any time between current time and next cadence point
      const nextCadenceTime = findNextCadenceTime(currentTime);
      if (nextCadenceTime > currentTime) {
        // Create a filler block to align to cadence
        const fillerDuration = nextCadenceTime - currentTime;
        firstBlock = new MediaBlock([], undefined, currentTime);
        streamBlocks.push(firstBlock);
        currentTime += fillerDuration;
      } else {
        // Already at cadence, use selected first media
        firstBlock = new MediaBlock(
          [],
          selectedFirstMedia as Movie | Episode,
          currentTime
        );
        streamBlocks.push(firstBlock);
        currentTime += firstBlock.duration;
      }
    } else {
      firstBlock = new MediaBlock(
        [],
        selectedFirstMedia as Movie | Episode,
        currentTime
      );
      streamBlocks.push(firstBlock);
      currentTime += firstBlock.duration;
      
    }

    // Continue filling stream until end of day
    while (currentTime < endOfDayUnix) {
      const nextMedia = selectRandomMediaForStream();
      if (!nextMedia) {
        // No more media available, stop here
        break;
      }

      // Skip if media would extend past end of day
      if (currentTime + (nextMedia.duration || 0) > endOfDayUnix) {
        break;
      }

      const mediaBlock = new MediaBlock(
        [],
        nextMedia as Movie | Episode,
        currentTime
      );
      streamBlocks.push(mediaBlock);
      currentTime += mediaBlock.duration;
    }

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
 */
function selectRandomMediaForStream(): Movie | Episode | null {
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
