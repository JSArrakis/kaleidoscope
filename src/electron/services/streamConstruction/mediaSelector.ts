import { movieRepository } from "../../repositories/movieRepository.js";
import { showRepository } from "../../repositories/showRepository.js";
import { holidayIntentCacheManager } from "../holidayIntentCacheManager.js";
import {
  selectFacetRelationship,
  findMatchingFacets,
} from "../../prisms/facets.js";
import {
  getEpisodeFromShowCandidates,
  selectMovieOrShow,
} from "./selectionHelpers.js";
import * as streamManager from "../streamManager.js";
/**
 * Selects random anchor media (movies or shows)
 * Randomly chooses between shows and movies, respecting episode progression
 */
export function selectRandomShowOrMovie(
  timepoint: number,
  duration: number,
  ageGroupTags: Tag[],
): Movie | Episode | null {
  // If duration is above an hour and a half (5400 seconds), flip a coin to choose show or movie
  // Otherwise default to a show for shorter durations
  const chooseMovie = duration >= 5400 ? Math.random() < 0.5 : false;
  if (chooseMovie) {
    const recentlyUsedMovieIds =
      streamManager.getActiveRecentlyUsedMovieIds(timepoint);
    // Select random movie
    let movie: Movie | null =
      movieRepository.findRandomMovieUnderDurationExcluding(
        duration,
        ageGroupTags,
        recentlyUsedMovieIds,
      ); // VERIFIED

    if (!movie) {
      movie = movieRepository.findRandomMovieUnderDuration(
        duration,
        ageGroupTags,
      ); // VERIFIED
    }

    if (movie) {
      return movie;
    } else {
      // Fallback to show if no movie found
      const shows = showRepository.findAllShowsUnderDuration(duration); // VERIFIED
      return getEpisodeFromShowCandidates(shows, duration); // VERIFIED
    }
  } else {
    const shows = showRepository.findAllShowsUnderDuration(duration); // VERIFIED
    return getEpisodeFromShowCandidates(shows, duration); // VERIFIED
  }
}

/**
 * Selects media with a specific holiday tag
 * Gathers movies and episodes tagged with the holiday, then randomly selects from combined pool
 */
export function selectMediaWithHolidayTag(
  holidayTagId: string,
  duration: number,
): Movie | Episode | null {
  // Get movies and episodes with this holiday tag that fit the duration
  const moviesWithTag = movieRepository.findByTagsAndAgeGroupsUnderDuration(
    [{ tagId: holidayTagId } as Tag],
    [],
    duration,
  );

  // Step 1: Find shows that have episodes with the holiday tag
  const showsWithTag = showRepository.findByEpisodeTags([holidayTagId]);

  // Step 2 & 3: Gather all matching episodes and filter them by duration
  const candidateEpisodes: Episode[] = [];
  for (const show of showsWithTag) {
    if (show.episodes) {
      for (const episode of show.episodes) {
        if (
          episode.duration <= duration &&
          episode.tags &&
          episode.tags.some((t) => t.tagId === holidayTagId)
        ) {
          candidateEpisodes.push(episode);
        }
      }
    }
  }

  // Combine pools
  const totalAvailable = moviesWithTag.length + candidateEpisodes.length;

  if (totalAvailable === 0) {
    return null;
  }

  // Randomly choose between movie and episode pool
  const useMovie = Math.random() < moviesWithTag.length / totalAvailable;

  if (useMovie && moviesWithTag.length > 0) {
    return moviesWithTag[Math.floor(Math.random() * moviesWithTag.length)];
  } else if (candidateEpisodes.length > 0) {
    // Step 4: Randomly select one from the filtered list
    return candidateEpisodes[
      Math.floor(Math.random() * candidateEpisodes.length)
    ];
  } else if (moviesWithTag.length > 0) {
    // Fallback to movie if no episodes were chosen or available
    return moviesWithTag[Math.floor(Math.random() * moviesWithTag.length)];
  }

  return null;
}

/**
 * Selects media based on specialty tag relationships
 * Finds other media that share specialty tags with the current content
 * Coin-flips between movies and shows, falling back to the other if none found
 */
export function selectSpecialtyAdjacentMedia(
  specialtyTags: Tag[],
  ageGroupTags: Tag[],
  duration: number,
  timepoint: number,
): Movie | Episode | null {
  if (specialtyTags.length === 0) {
    return null;
  }

  return selectMovieOrShow(specialtyTags, ageGroupTags, duration, timepoint); // VERIFIED
}

export function selectFacetAdjacentMedia(
  segmentedTags: SegmentedTags,
  duration: number,
  timepoint: number,
): Movie | Episode | null {
  const matchedFacets = findMatchingFacets(segmentedTags);

  if (matchedFacets.length === 0) {
    return null;
  }

  // Flatten all facet relationships from all matched facets into a single pool
  // Deduplicate by genre/aesthetic pairing, keeping the closest distance
  const relationshipMap = new Map<string, FacetRelationshipItem>();
  for (const facet of matchedFacets) {
    for (const relationship of facet.facetRelationships) {
      const key = `${relationship.genre?.tagId}|${relationship.aesthetic?.tagId}`;
      const existing = relationshipMap.get(key);

      // Keep this relationship if it's new or has a closer distance
      if (!existing || relationship.distance < existing.distance) {
        relationshipMap.set(key, relationship);
      }
    }
  }

  const allRelationships = Array.from(relationshipMap.values());

  if (allRelationships.length === 0) {
    return null;
  }

  // Try relationships from the pool using weighted distance selection
  // Remove attempted relationships to avoid retrying
  let unattemptedRelationships = [...allRelationships];

  while (unattemptedRelationships.length > 0) {
    // Select a relationship using weighted distance selection
    const relationship = selectFacetRelationship(unattemptedRelationships); // VERIFIED

    // Try to find media with this relationship
    const selectedMedia = selectMovieOrShow(
      [relationship.genre!, relationship.aesthetic!],
      segmentedTags.ageGroupTags,
      duration,
      timepoint,
    ); // VERIFIED

    if (selectedMedia) {
      return selectedMedia;
    }

    // Remove the attempted relationship from the pool and try again
    unattemptedRelationships = unattemptedRelationships.filter(
      (r) => r !== relationship,
    );
  }

  return null;
}

/**
 * Selects themed media based on holiday context and tag relationships
 * Three algorithmic paths:
 *
 * PATH 1 - HOLIDAY DATE: Saturate with holiday content
 *   - All movies/episodes tagged with active holiday tags play
 *   - Weighted random selection between movies and episodes
 *   - Completely bypasses other selection logic
 *
 * PATH 2 - HOLIDAY SEASON: Respect 3-day distribution
 *   - Checks budget with holidayIntentCacheManager
 *   - Selects holiday-tagged media if budget available
 *   - Falls through to PATH 3 if budget exhausted
 *
 * PATH 3 - NON-HOLIDAY: Sequential fallback chain
 *   - Step 1: specialty-adjacent (50% chance to attempt; skipped or no result → Step 2)
 *   - Step 2: facet-adjacent (requires both genre + aesthetic; no result → Step 3)
 *   - Step 3: direct tag match (genre or aesthetic only; no result → Step 4)
 *   - Step 4: random fallback (always returns something if DB has content)
 *
 * @param segmentedTags Tags from first media of the day (segmented by type)
 * @param timepoint Unix timestamp (seconds)
 * @param duration Available duration in seconds
 * @param progressionMap Episode progression tracking
 * @param activeHolidayTags Active holiday tags for today
 * @param isHolidayDate True if today is an exact holiday date
 * @param isHolidaySeason True if today is within a holiday season span
 * @param previousAnchorType MediaType of the previous anchor (for smart shuffle)
 * @returns Selected movie/episode or null if none available
 */
export function selectThemedMedia(
  segmentedTags: SegmentedTags,
  timepoint: number,
  duration: number,
  activeHolidayTags: Tag[],
  isHolidayDate: boolean,
  isHolidaySeason: boolean,
  dateString: string,
  previousAnchorType?: MediaType,
): Movie | Episode | null {
  // PATH 1: HOLIDAY DATE - Saturate with holiday content
  if (isHolidayDate) {
    // Collect all movies and episodes from all active holiday tags
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
            // Any episode tagged with this holiday plays, regardless of blacklist
            if (
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

    if (totalAvailable > 0) {
      // Smart Shuffle: alternate between movies and episodes to prevent
      // movies playing back-to-back. When both pools are available, bias
      // 80% toward the opposite type of whatever played last.
      let movieChance = availableMovies.length / totalAvailable;

      if (
        previousAnchorType &&
        availableMovies.length > 0 &&
        availableEpisodes.length > 0
      ) {
        // If previous was a movie, heavily favor episodes (and vice versa)
        movieChance = previousAnchorType === MediaType.Movie ? 0.2 : 0.8;
      }

      const useMovie = Math.random() < movieChance;

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
  }

  // PATH 2: HOLIDAY SEASON - Respect 3-day distribution
  if (isHolidaySeason) {
    // Try each active holiday tag to see if we have budget for more content
    for (const holidayTag of activeHolidayTags) {
      // Check if we can add more content for this holiday today
      if (
        holidayIntentCacheManager.canAddMoreContent(
          holidayTag.tagId,
          dateString,
        ) // VERIFIED
      ) {
        // Try to select media with this holiday tag
        const selectedMedia = selectMediaWithHolidayTag(
          holidayTag.tagId,
          duration,
        );

        if (selectedMedia) {
          // Track the selected minutes (duration is in seconds, convert to minutes)
          const durationMinutes = Math.floor(
            (selectedMedia.duration || 0) / 60,
          );
          holidayIntentCacheManager.trackSelectedMinutes(
            holidayTag.tagId,
            durationMinutes,
            dateString,
          );
          return selectedMedia;
        }
      }
    }

    // If no holiday content available or all budgets exhausted, fall through to PATH 3
  }

  // PATH 3: NON-HOLIDAY - Sequential fallback chain
  // Step 1: specialty-adjacent (50% chance) → Step 2: facet-adjacent → Step 3: direct tag match → Step 4: random

  // Attempt specialty-adjacent selection if specialty tags exist
  if (segmentedTags.specialtyTags.length > 0 && Math.random() < 0.5) {
    const selectedMedia = selectSpecialtyAdjacentMedia(
      segmentedTags.specialtyTags,
      segmentedTags.ageGroupTags,
      duration,
      timepoint,
    ); // VERIFIED
    if (selectedMedia) {
      return selectedMedia;
    }
  }

  if (
    segmentedTags.genreTags.length > 0 &&
    segmentedTags.aestheticTags.length > 0
  ) {
    const selectedMedia = selectFacetAdjacentMedia(
      segmentedTags,
      duration,
      timepoint,
    ); // VERIFIED
    if (selectedMedia) {
      return selectedMedia;
    }
  } else if (
    segmentedTags.genreTags.length > 0 ||
    segmentedTags.aestheticTags.length > 0
  ) {
    const selectedMedia = selectMovieOrShow(
      [...segmentedTags.genreTags, ...segmentedTags.aestheticTags],
      segmentedTags.ageGroupTags,
      duration,
      timepoint,
    ); // VERIFIED
    if (selectedMedia) {
      return selectedMedia;
    }
  }

  // If still no media found, select random media as last resort
  return selectRandomShowOrMovie(
    timepoint,
    duration,
    segmentedTags.ageGroupTags,
  ); // VERIFIED
}
