import { episodeProgressionRepository } from "../../repositories/episodeProgressionRepository.js";
import { movieRepository } from "../../repositories/movieRepository.js";
import { recentlyUsedMediaRepository } from "../../repositories/recentlyUsedMediaRepository.js";
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
      // Compare as strings since MM-DD format works lexicographically
      // e.g., "10-01" <= "12-25" <= "12-31"
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
 * Extracts ISO date string from unix timestamp (seconds)
 * @param unixSeconds Unix timestamp in seconds
 * @returns ISO date string in format YYYY-MM-DD
 */
export function getDateString(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  return date.toISOString().split("T")[0];
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
  const progressionMap = streamManager.getStreamManager().getProgressionMap();
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
 * Cleans up expired recently-used media records
 * Should be called before media selection to ensure fresh data
 *
 * @param timepoint Unix timestamp in seconds
 * @returns Number of deleted records
 */
export function cleanupExpiredRecentlyUsed(timepoint: number): number {
  const unixSeconds = Math.floor(timepoint);
  return recentlyUsedMediaRepository.deleteExpired(unixSeconds); // VERIFIED
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
      streamManager
        .getStreamManager()
        .updateProgression(show.mediaItemId, nextEpisodeNum); // VERIFIED

      return selectedEpisode;
    }
  }

  return null;
}

export function selectMovieOrShow(
  tags: Tag[],
  ageGroups: Tag[],
  duration: number,
): Movie | Episode | null {
  let selectedMedia: Movie | Episode | null = null;
  const tryMovieFirst = Math.random() < 0.5;

  // Try the randomly selected type first, then fall back to the other
  for (let attempt = 0; attempt < 2; attempt++) {
    const shouldTryMovie = attempt === 0 ? tryMovieFirst : !tryMovieFirst;

    if (shouldTryMovie) {
      // Movie path
      const movies = movieRepository.findByTagsAndAgeGroupsUnderDuration(
        tags,
        ageGroups,
        duration,
      );
      if (movies.length > 0) {
        // Shuffle movies for randomness
        const shuffledMovies = movies.sort(() => 0.5 - Math.random());
        selectedMedia = shuffledMovies[0];
        break;
      }
    } else {
      // Show path
      const shows = showRepository.findByTagsAndAgeGroupsUnderDuration(
        tags,
        ageGroups,
        duration,
      );
      const episode = getEpisodeFromShowCandidates(shows, duration);
      if (episode) {
        selectedMedia = episode;
        break;
      }
    }
  }

  return selectedMedia;
}
