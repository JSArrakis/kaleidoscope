import { tagRepository } from "../repositories/tagsRepository.js";
import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";
import { recentlyUsedMediaRepository } from "../repositories/recentlyUsedMediaRepository.js";

/**
 * Gets adjacent age group tags based on a base age group
 * Returns the base age group plus adjacent ones (lower and higher sequence)
 * Used for selecting media appropriate for age groups
 *
 * @param ageGroupTags Array of age group tags (typically will have 1)
 * @returns Array with base age group and adjacent age groups by sequence
 */
export function getAgeGroupAdjacency(ageGroupTags: Tag[]): Tag[] {
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

/**
 * Cleans up expired recently-used media records
 * Should be called before media selection to ensure we're working with fresh data
 *
 * @param timepoint Unix timestamp in seconds
 * @returns Number of deleted records
 */
export function cleanupExpiredRecentlyUsed(timepoint: number): number {
  const unixSeconds = Math.floor(timepoint);
  return recentlyUsedMediaRepository.deleteExpired(unixSeconds);
}

/**
 * Checks if a show's next episode will fit within the available duration
 * Handles both normal episodes and overDuration episodes
 *
 * DURATION LOGIC:
 * - Normal episodes fit within show.durationLimit (e.g., 1800 = 30 min block, 3600 = 1 hour block)
 * - OverDuration episodes are individually specified and may exceed durationLimit
 * - If next episode is overDuration, it must fit within the available duration parameter
 * - If next episode is normal, it will fit as long as duration >= show.durationLimit
 *
 * @param show The show to check
 * @param nextEpisodeNumber The episode number to check (1-indexed)
 * @param availableDuration The available time in seconds
 * @returns true if the next episode fits, false otherwise
 */
export function willEpisodeFitInDuration(
  show: Show,
  nextEpisodeNumber: number,
  availableDuration: number
): boolean {
  if (!show.episodes || show.episodes.length === 0) {
    return false;
  }

  // Get the next episode (1-indexed)
  const episode = show.episodes[nextEpisodeNumber - 1];
  if (!episode) {
    return false;
  }

  // Check if episode has overDuration
  if (episode.isOverDuration && episode.duration) {
    // OverDuration episodes must fit exactly within available duration
    return episode.duration <= availableDuration;
  }

  // Normal episodes fit within show's durationLimit
  const durationLimit = show.durationLimit || 0;
  return availableDuration >= durationLimit;
}

/**
 * Gets the next episode for a show, checking episode progression
 * Creates new progression if it doesn't exist
 * Respects episode duration constraints vs available duration
 *
 * Does NOT increment progression (that happens when the episode actually airs)
 * Progression is held temporarily during stream construction for deduplication
 *
 * @param show The show to get an episode from
 * @param streamType The stream type (continuous, adhoc, etc.)
 * @param availableDuration The duration available for this media block
 * @returns The next episode that fits, or null if none available
 */
export function getNextEpisodeForShow(
  show: Show,
  streamType: StreamType,
  availableDuration: number
): Episode | null {
  if (!show.episodes || show.episodes.length === 0) {
    return null;
  }

  // Get or create progression for this show/stream type combination
  let progression = episodeProgressionRepository.findByShowAndStreamType(
    show.mediaItemId,
    streamType
  );

  if (!progression) {
    // Create new progression starting at episode 1
    const progressionId = `prog-${show.mediaItemId}-${streamType}`;
    progression = episodeProgressionRepository.create({
      episodeProgressionId: progressionId,
      showItemId: show.mediaItemId,
      streamType: streamType,
      currentEpisodeNumber: 1,
      totalEpisodes: show.episodes.length,
      lastPlayedDate: new Date().toISOString(),
    });
  }

  // Get current episode number
  const episodeNum = progression.currentEpisodeNumber || 1;

  // Check if next episode fits in available duration
  if (!willEpisodeFitInDuration(show, episodeNum, availableDuration)) {
    return null;
  }

  // Return the current episode (don't increment - that happens on actual playback)
  return show.episodes[episodeNum - 1] || null;
}

/**
 * Selects a random movie or show that fits within available duration and age group constraints
 *
 * SELECTION LOGIC:
 * 1. Cleans up expired recently-used media
 * 2. Gets age group adjacency (safer age groups)
 * 3. Randomly chooses between shows and movies
 * 4. For shows: ensures next episode fits duration, creates progression if needed
 * 5. For movies: checks if movie fits duration
 *
 * @param ageGroupTags Age group tags for filtering (empty = no age restriction)
 * @param duration Available duration in seconds
 * @param timepoint Unix timestamp in seconds (for expired media cleanup)
 * @returns Selected movie/episode or null if none available
 */
export function selectRandomEpisodeOrMovie(
  ageGroupTags: Tag[],
  duration: number,
  timepoint: number
): Movie | Episode | null {
  // Clean up expired recently-used media
  cleanupExpiredRecentlyUsed(timepoint);

  // Get age group adjacency for filtering
  const ageAdjacencyTags = getAgeGroupAdjacency(ageGroupTags);

  // Get counts from repositories
  // TODO: Filter by age group if ageAdjacencyTags provided
  const showCount = showRepository.count();
  const movieCount = movieRepository.count();

  // If neither exists, return null
  if (showCount === 0 && movieCount === 0) {
    return null;
  }

  // If only movies exist
  if (showCount === 0) {
    // TODO: Get a random movie that fits duration and age group
    return null;
  }

  // If only shows exist
  if (movieCount === 0) {
    // TODO: Get a random show with next episode fitting duration and age group
    return null;
  }

  // Both exist - randomly choose between them (50/50)
  const useShow = Math.random() < 0.5;

  if (useShow) {
    // TODO: Get a random show with next episode fitting duration and age group
    // Fall back to movie if show selection fails
    return null;
  } else {
    // TODO: Get a random movie that fits duration and age group
    return null;
  }
}
