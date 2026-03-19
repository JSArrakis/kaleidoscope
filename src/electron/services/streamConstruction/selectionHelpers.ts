import { episodeProgressionRepository } from "../../repositories/episodeProgressionRepository.js";
import { movieRepository } from "../../repositories/movieRepository.js";
import { showRepository } from "../../repositories/showRepository.js";
import * as streamManager from "../streamManager.js";

/**
 * Determines if a unix timestamp matches any holiday date in the provided tags
 * @param unixSeconds Unix timestamp in seconds
 * @param holidays Array of holiday tags to check
 * @returns True if date matches a holiday's exact date (compares MM/DD only)
 */
export function isHolidayDate(unixSeconds: number, holidays: Tag[]): boolean {
  const date = new Date(unixSeconds * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${month}-${day}`; // MM-DD format

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
 * @returns True if date falls within a holiday's season span (compares MM/DD only)
 */
export function isHolidaySeason(
  incomingTimepoint: number,
  holidays: Tag[],
): boolean {
  const date = new Date(incomingTimepoint * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${month}-${day}`; // MM-DD format

  for (const holiday of holidays) {
    if (holiday.seasonStartDate && holiday.seasonEndDate) {
      if (holiday.seasonStartDate <= holiday.seasonEndDate) {
        // Normal range (e.g., "10-01" to "12-31")
        if (
          dateString >= holiday.seasonStartDate &&
          dateString <= holiday.seasonEndDate
        ) {
          return true;
        }
      } else {
        // Year-wrap range (e.g., "11-15" to "01-05")
        if (
          dateString >= holiday.seasonStartDate ||
          dateString <= holiday.seasonEndDate
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Extracts local calendar date string from unix timestamp (seconds)
 * Uses local timezone, not UTC
 * @param unixSeconds Unix timestamp in seconds
 * @returns Local date string in format YYYY-MM-DD (user's perceived date)
 */
export function getDateString(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets current episode numbers for all shows in a given stream type
 * Returns a Map keyed by showItemId for O(1) lookup performance
 * @param streamType The stream type to query
 * @returns Map with showItemId as key and currentEpisodeNumber as value
 */
export function getProgressionsByStreamType(
  streamType: StreamType,
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
      progression.currentEpisodeNumber,
    );
  }

  return progressionMap;
}

/**
 * Checks if a show's next episode (based on progression) fits within available duration
 * Handles both regular and overDuration episodes efficiently
 *
 * @param show The show to check
 * @param availableDuration The remaining duration in seconds
 * @returns Episode number if the next episode fits, null otherwise
 */
export function doesNextEpisodeFitDuration(
  show: Show,
  availableDuration: number,
): number | null {
  if (show.episodes.length === 0) {
    return null;
  }
  // Get the next episode number from stream manager's progression map
  const progressionMap = streamManager.getProgressionMap();
  const nextEpisodeNum = progressionMap.get(show.mediaItemId) || 1;

  // Check if next episode exists
  let nextEpisode = show.episodes[nextEpisodeNum - 1];

  // If next episode doesn't exist, we're wrapping back to episode 1
  if (!nextEpisode) {
    nextEpisode = show.episodes[0];
  }

  if (!nextEpisode) {
    return null;
  }

  return nextEpisode.duration <= availableDuration ? nextEpisodeNum : null;
}

/**
 * Gets episode from a shuffled list of shows, respecting progression and duration
 * Increments progression when an episode is selected
 *
 * @param shows Array of shows to choose from
 * @param duration Available duration in seconds
 * @returns Selected episode or null if none fit
 */
export function getEpisodeFromShowCandidates(
  shows: Show[],
  duration: number,
): Episode | null {
  // Shuffle shows for randomness
  const shuffled = [...shows];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (const show of shuffled) {
    const nextEpisodeNum = doesNextEpisodeFitDuration(show, duration); // VERIFIED
    if (nextEpisodeNum !== null) {
      const selectedEpisode = show.episodes[nextEpisodeNum - 1];

      // Increment progression for next selection AFTER we've identified the episode
      streamManager.updateProgression(show.mediaItemId, nextEpisodeNum); // VERIFIED

      return selectedEpisode;
    }
  }

  return null;
}

function trySelectMovie(
  tags: Tag[],
  ageGroups: Tag[],
  duration: number,
  timepoint: number,
): Movie | null {
  const movies = filterRecentlyUsedMovies(
    movieRepository.findByTagsAndAgeGroupsUnderDuration(
      tags,
      ageGroups,
      duration,
    ),
    timepoint,
  );
  if (movies.length === 0) return null;
  return movies.sort(() => 0.5 - Math.random())[0];
}

function trySelectEpisode(
  tags: Tag[],
  ageGroups: Tag[],
  duration: number,
): Episode | null {
  const shows = showRepository.findByTagsAndAgeGroupsUnderDuration(
    tags,
    ageGroups,
    duration,
  );
  return getEpisodeFromShowCandidates(shows, duration);
}

export function selectMovieOrShow(
  tags: Tag[],
  ageGroups: Tag[],
  duration: number,
  timepoint: number,
): Movie | Episode | null {
  const tryMovieFirst = Math.random() < 0.5;

  if (tryMovieFirst) {
    return (
      trySelectMovie(tags, ageGroups, duration, timepoint) ??
      trySelectEpisode(tags, ageGroups, duration)
    );
  } else {
    return (
      trySelectEpisode(tags, ageGroups, duration) ??
      trySelectMovie(tags, ageGroups, duration, timepoint)
    );
  }
}

const THREE_HOURS_IN_SECONDS = 3 * 60 * 60;
const TWENTY_FOUR_HOURS_IN_SECONDS = 24 * 60 * 60;
const TWO_DAYS_IN_SECONDS = 2 * 24 * 60 * 60;

/**
 * Filters commercials by removing recently used entries from the stream manager,
 * then returns only commercials that are not in the recently used map.
 *
 * 1. Prunes entries from the recentlyUsedCommercials map that are older than
 *    3 hours before the given timepoint.
 * 2. Returns commercials whose mediaItemId does not appear in the remaining map.
 *
 * @param commercials List of candidate commercials
 * @param timepoint Unix timestamp in seconds representing the current point in time
 * @returns Commercials that have not been recently used within the last 3 hours
 */
export function filterRecentlyUsedCommercials(
  commercials: Commercial[],
  timepoint: number,
): Commercial[] {
  const recentlyUsedMap = streamManager.getRecentlyUsedCommercials();
  const cutoff = timepoint - THREE_HOURS_IN_SECONDS;

  // Remove entries older than 3 hours before the timepoint
  for (const [key, usedTime] of recentlyUsedMap) {
    if (usedTime < cutoff) {
      streamManager.removeRecentlyUsedCommercial(key);
    }
  }

  // Return commercials not present in the recently used map
  return commercials.filter(
    (commercial) => !recentlyUsedMap.has(commercial.mediaItemId),
  );
}

/**
 * Filters shorts by removing recently used entries from the stream manager,
 * then returns only shorts that are not in the recently used map.
 *
 * 1. Prunes entries from the recentlyUsedShorts map that are older than
 *    24 hours before the given timepoint.
 * 2. Returns shorts whose mediaItemId does not appear in the remaining map.
 *
 * @param shorts List of candidate shorts
 * @param timepoint Unix timestamp in seconds representing the current point in time
 * @returns Shorts that have not been recently used within the last 24 hours
 */
export function filterRecentlyUsedShorts(
  shorts: Short[],
  timepoint: number,
): Short[] {
  const recentlyUsedMap = streamManager.getRecentlyUsedShorts();
  const cutoff = timepoint - TWENTY_FOUR_HOURS_IN_SECONDS;

  // Remove entries older than 24 hours before the timepoint
  for (const [key, usedTime] of recentlyUsedMap) {
    if (usedTime < cutoff) {
      streamManager.removeRecentlyUsedShort(key);
    }
  }

  // Return shorts not present in the recently used map
  return shorts.filter((short) => !recentlyUsedMap.has(short.mediaItemId));
}

/**
 * Filters music by removing recently used entries from the stream manager,
 * then returns only music that is not in the recently used map.
 *
 * 1. Prunes entries from the recentlyUsedMusic map that are older than
 *    24 hours before the given timepoint.
 * 2. Returns music whose mediaItemId does not appear in the remaining map.
 *
 * @param music List of candidate music items
 * @param timepoint Unix timestamp in seconds representing the current point in time
 * @returns Music that has not been recently used within the last 24 hours
 */
export function filterRecentlyUsedMusic(
  music: Music[],
  timepoint: number,
): Music[] {
  const recentlyUsedMap = streamManager.getRecentlyUsedMusic();
  const cutoff = timepoint - TWENTY_FOUR_HOURS_IN_SECONDS;

  // Remove entries older than 24 hours before the timepoint
  for (const [key, usedTime] of recentlyUsedMap) {
    if (usedTime < cutoff) {
      streamManager.removeRecentlyUsedMusic(key);
    }
  }

  // Return music not present in the recently used map
  return music.filter((item) => !recentlyUsedMap.has(item.mediaItemId));
}

/**
 * Filters movies by removing recently used entries from the stream manager,
 * then returns only movies that are not in the recently used map.
 *
 * 1. Prunes entries from the recentlyUsedMovies map that are older than
 *    24 hours before the given timepoint.
 * 2. Returns movies whose mediaItemId does not appear in the remaining map.
 *
 * @param movies List of candidate movies
 * @param timepoint Unix timestamp in seconds representing the current point in time
 * @returns Movies that have not been recently used within the last 24 hours
 */
export function filterRecentlyUsedMovies(
  movies: Movie[],
  timepoint: number,
): Movie[] {
  const recentlyUsedMap = streamManager.getRecentlyUsedMovies();
  const cutoff = timepoint - TWO_DAYS_IN_SECONDS;

  // Remove entries older than 48 hours before the timepoint
  for (const [key, usedTime] of recentlyUsedMap) {
    if (usedTime < cutoff) {
      streamManager.removeRecentlyUsedMovie(key);
    }
  }

  // Return movies not present in the recently used map
  return movies.filter((movie) => !recentlyUsedMap.has(movie.mediaItemId));
}
