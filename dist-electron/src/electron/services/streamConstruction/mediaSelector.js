import { movieRepository } from "../../repositories/movieRepository.js";
import { showRepository } from "../../repositories/showRepository.js";
import { holidayIntentCacheManager } from "../holidayIntentCacheManager.js";
import { selectFacetRelationship, findMatchingFacets, } from "../../prisms/facets.js";
import { cleanupExpiredRecentlyUsed, getEpisodeFromShowCandidates, selectMovieOrShow, } from "./selectionHelpers.js";
/**
 * Selects random anchor media (movies or shows)
 * Randomly chooses between shows and movies, respecting episode progression
 * Cleans up expired recently-used media records before selection
 */
export function selectRandomShowOrMovie(timepoint, duration, ageGroupTags) {
    // Clean up expired media records first
    cleanupExpiredRecentlyUsed(timepoint); // VERIFIED
    // If duration is above an hour and a half (5400 seconds), flip a coin to choose show or movie
    // Otherwise default to a show for shorter durations
    const chooseMovie = duration >= 5400 ? Math.random() < 0.5 : false;
    if (chooseMovie) {
        // Select random movie
        const movie = movieRepository.findRandomMovieUnderDuration(duration, ageGroupTags); // VERIFIED
        if (movie) {
            return movie;
        }
        else {
            // Fallback to show if no movie found
            const shows = showRepository.findAllShowsUnderDuration(duration); // VERIFIED
            return getEpisodeFromShowCandidates(shows, duration); // VERIFIED
        }
    }
    else {
        const shows = showRepository.findAllShowsUnderDuration(duration); // VERIFIED
        return getEpisodeFromShowCandidates(shows, duration); // VERIFIED
    }
}
/**
 * Selects media with a specific holiday tag
 * Gathers movies and episodes tagged with the holiday, then randomly selects from combined pool
 */
export function selectHolidayMediaForTag(holidayTagId, duration) {
    // Get movies and episodes with this holiday tag that fit the duration
    const moviesWithTag = movieRepository.findByTagsAndAgeGroupsUnderDuration([{ tagId: holidayTagId }], [], duration);
    // Step 1: Find shows that have episodes with the holiday tag
    const showsWithTag = showRepository.findByEpisodeTags([holidayTagId]);
    // Step 2 & 3: Gather all matching episodes and filter them by duration
    const candidateEpisodes = [];
    for (const show of showsWithTag) {
        if (show.episodes) {
            for (const episode of show.episodes) {
                if (episode.duration <= duration &&
                    episode.tags &&
                    episode.tags.some((t) => t.tagId === holidayTagId)) {
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
    }
    else if (candidateEpisodes.length > 0) {
        // Step 4: Randomly select one from the filtered list
        return candidateEpisodes[Math.floor(Math.random() * candidateEpisodes.length)];
    }
    else if (moviesWithTag.length > 0) {
        // Fallback to movie if no episodes were chosen or available
        return moviesWithTag[Math.floor(Math.random() * moviesWithTag.length)];
    }
    return null;
}
/**
 * Selects media based on specialty tag relationships
 * Finds other media that share specialty tags with the current content
 *
 * TODO: Implement full specialty adjacent logic
 * Currently stubbed - returns null
 */
export function selectSpecialtyAdjacentMedia(specialtyTags, ageGroupTags, duration, progressionMap) {
    if (specialtyTags.length === 0) {
        return null;
    }
    // Find all media that have any of these specialty tags
    const moviesWithSpecialty = movieRepository.findByTagsAndAgeGroupsUnderDuration(specialtyTags, ageGroupTags, duration);
    // TODO: Implement selection logic from moviesWithSpecialty
    return null;
}
export function selectFacetAdjacentMedia(segmentedTags, duration, progressionMap) {
    const matchedFacets = findMatchingFacets(segmentedTags);
    if (matchedFacets.length === 0) {
        return null;
    }
    let selectedMedia = null;
    // Full genre-aesthetic pairs exist - use relationship maps
    for (const facet of matchedFacets) {
        const relationship = selectFacetRelationship(facet.facetRelationships);
        selectedMedia = selectMovieOrShow([relationship.genre, relationship.aesthetic], segmentedTags.ageGroupTags, duration);
        if (selectedMedia) {
            break;
        }
    }
    return selectedMedia;
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
 * PATH 3 - NON-HOLIDAY: Select specialty/facet-adjacent media
 *   - Coin flip: 50% specialty-adjacent, 50% facet-adjacent
 *   - Fallback chain: specialty → facet → random
 *
 * @param segmentedTags Tags from first media of the day (segmented by type)
 * @param timepoint Unix timestamp (seconds)
 * @param duration Available duration in seconds
 * @param progressionMap Episode progression tracking
 * @param activeHolidayTags Active holiday tags for today
 * @param isHolidayDate True if today is an exact holiday date
 * @param isHolidaySeason True if today is within a holiday season span
 * @returns Selected movie/episode or null if none available
 */
export function selectThemedMedia(segmentedTags, timepoint, duration, progressionMap, activeHolidayTags, isHolidayDate, isHolidaySeason, dateString) {
    // PATH 1: HOLIDAY DATE - Saturate with holiday content
    if (isHolidayDate) {
        // TODO: Smart Shuffle saturated holiday content selection so movies do not play back to back
        // Collect all movies and episodes from all active holiday tags
        const availableMovies = [];
        const availableEpisodes = [];
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
                        if (episode.tags &&
                            episode.tags.some((t) => t.tagId === holidayTag.tagId)) {
                            availableEpisodes.push(episode);
                        }
                    }
                }
            }
        }
        // Combine pools
        const totalAvailable = availableMovies.length + availableEpisodes.length;
        if (totalAvailable === 0) {
            // No holiday content available - fall through to PATH 3
            // TODO: Decide if we should force random selection or try facet/specialty
        }
        else {
            // Randomly choose between movie and episode pool
            const useMovie = Math.random() < availableMovies.length / totalAvailable;
            if (useMovie && availableMovies.length > 0) {
                return availableMovies[Math.floor(Math.random() * availableMovies.length)];
            }
            else if (availableEpisodes.length > 0) {
                return availableEpisodes[Math.floor(Math.random() * availableEpisodes.length)];
            }
            else if (availableMovies.length > 0) {
                return availableMovies[Math.floor(Math.random() * availableMovies.length)];
            }
        }
    }
    // PATH 2: HOLIDAY SEASON - Respect 3-day distribution
    if (isHolidaySeason) {
        // Try each active holiday tag to see if we have budget for more content
        for (const holidayTag of activeHolidayTags) {
            // Check if we can add more content for this holiday today
            if (holidayIntentCacheManager.canAddMoreContent(holidayTag.tagId, dateString)) {
                // Try to select media with this holiday tag
                const selectedMedia = selectHolidayMediaForTag(holidayTag.tagId, duration);
                if (selectedMedia) {
                    // Track the selected minutes (duration is in seconds, convert to minutes)
                    const durationMinutes = Math.floor((selectedMedia.duration || 0) / 60);
                    holidayIntentCacheManager.trackSelectedMinutes(holidayTag.tagId, durationMinutes, dateString);
                    return selectedMedia;
                }
            }
        }
        // If no holiday content available or all budgets exhausted, fall through to PATH 3
    }
    // PATH 3: NON-HOLIDAY - Select specialty/facet-adjacent media
    // Strategy: Coin flip between specialty-adjacent or facet-adjacent
    // Fallback: Facet-adjacent if specialty yields no results
    // Attempt specialty-adjacent selection if specialty tags exist
    if (segmentedTags.specialtyTags.length > 0 && Math.random() < 0.5) {
        const selectedMedia = selectSpecialtyAdjacentMedia(segmentedTags.specialtyTags, segmentedTags.ageGroupTags, duration, progressionMap);
        if (selectedMedia) {
            return selectedMedia;
        }
    }
    if (segmentedTags.genreTags.length > 0 &&
        segmentedTags.aestheticTags.length > 0) {
        const selectedMedia = selectFacetAdjacentMedia(segmentedTags, duration, progressionMap);
        if (selectedMedia) {
            return selectedMedia;
        }
    }
    else if (segmentedTags.genreTags.length > 0 ||
        segmentedTags.aestheticTags.length > 0) {
        const selectedMedia = selectMovieOrShow([...segmentedTags.genreTags, ...segmentedTags.aestheticTags], segmentedTags.ageGroupTags, duration);
        if (selectedMedia) {
            return selectedMedia;
        }
    }
    // If still no media found, select random media as last resort
    return selectRandomShowOrMovie(timepoint, duration, segmentedTags.ageGroupTags);
}
