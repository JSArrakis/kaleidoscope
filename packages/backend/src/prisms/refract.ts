import { facetRepository } from '../repositories/facetRepository';
import { movieRepository } from '../repositories/movieRepository';
import { showRepository } from '../repositories/showRepository';
import { recentlyUsedMediaRepository } from '../repositories/recentlyUsedMediaRepository';
import * as progressionManager from '../services/progressionManager';
import { BaseMedia } from '../models/mediaInterface';
import { StreamType } from '../models/enum/streamTypes';
import { getTagName } from './core';
import { Episode, Show } from '../models/show';
import { Movie } from '../models/movie';
import { MediaType } from '../models/enum/mediaTypes';
import { Facet } from '../models/facet';

export interface RefractResult {
  sourceFacetId?: string;
  chosenRelationship?: { targetFacetId: string; distance: number } | null;
  selectedMedia?: BaseMedia | null;
  selectionReason?: string;
}

export interface RefractOptions {
  maxDistance?: number; // Maximum allowed distance (default: 0.7)
  minDistance?: number; // Minimum distance for chaos (default: 0.05)
  preferShowsOverMovies?: boolean; // Coin flip bias (default: 50/50)
  maxDurationMinutes?: number; // Maximum duration constraint
  usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer';
  streamSessionId?: string;
}

export function extractTagNames(media: BaseMedia): string[] {
  if (!media || !Array.isArray(media.tags)) return [];
  return (media.tags || []).map((t: any) => getTagName(t)) as any;
}

export function findMatchingFacets(tagNames: string[]) {
  const allFacets = facetRepository.findAll();
  return allFacets.filter(
    f => tagNames.includes(f.genre.name) && tagNames.includes(f.aesthetic.name),
  );
}

// Simple selector: pick one facet (placeholder for more advanced selection)
export function pickFacet(facets: any[]) {
  if (!facets || facets.length === 0) return null;
  const idx = Math.floor(Math.random() * facets.length);
  const safeIdx = Math.min(idx, facets.length - 1);
  return facets[safeIdx];
}

// Choose a relationship using controlled chaos - not always closest, but avoid too distant
export function chooseControlledChaosRelationship(
  sourceFacetId: string,
  options: RefractOptions = {},
) {
  const { maxDistance = 0.7, minDistance = 0.05 } = options;

  const distances = facetRepository.findAllDistancesFrom(sourceFacetId);
  if (!distances || distances.length === 0) return null;

  // Keep only distances with finite numeric values within our chaos range
  const valid = distances.filter(
    d =>
      typeof d.distance === 'number' &&
      Number.isFinite(d.distance) &&
      d.distance >= minDistance &&
      d.distance <= maxDistance,
  );

  if (valid.length === 0) {
    // Fallback: if no valid distances in range, use closest available
    const allValid = distances.filter(
      d => typeof d.distance === 'number' && Number.isFinite(d.distance),
    );
    if (allValid.length === 0) return null;

    allValid.sort((a, b) => a.distance - b.distance);
    return {
      targetFacetId: allValid[0].targetFacetId,
      distance: allValid[0].distance,
    };
  }

  // Controlled chaos: weight selection toward closer distances but allow randomness
  // Sort by distance for weighted selection
  valid.sort((a, b) => a.distance - b.distance);

  // Use weighted random selection favoring closer distances
  const weights = valid.map((_, index) => Math.pow(valid.length - index, 2));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < valid.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return {
        targetFacetId: valid[i].targetFacetId,
        distance: valid[i].distance,
      };
    }
  }

  // Fallback to last item
  const chosen = valid[valid.length - 1];
  return {
    targetFacetId: chosen.targetFacetId,
    distance: chosen.distance,
  };
}

// Gather candidate media items (movies and shows) that match a facet's genre+aesthetic
// with duration and recent usage filtering
export async function gatherCandidatesForFacet(
  facet: any,
  options: RefractOptions = {},
): Promise<(Show | Movie)[]> {
  if (!facet) return [];

  const { maxDurationMinutes, usageContext = 'main_content' } = options;

  const movies = movieRepository.findAll();
  const shows = showRepository.findAll();
  const candidates: (Show | Movie)[] = [];

  // Get recently used media IDs to exclude
  const recentMovieIds = recentlyUsedMediaRepository.getRecentlyUsedMediaIds(
    'movie',
    usageContext,
    24, // hours back
  );
  const recentShowIds = recentlyUsedMediaRepository.getRecentlyUsedMediaIds(
    'show',
    usageContext,
    24, // hours back
  );

  const pushMatches = async (items: any[], mediaType: 'movie' | 'show') => {
    const recentIds = mediaType === 'movie' ? recentMovieIds : recentShowIds;

    for (const m of items) {
      // Skip recently used media
      if (recentIds.includes(m.mediaItemId)) continue;

      const names = (m.tags || []).map((t: any) => getTagName(t));
      if (
        !names.includes(facet.genre.name) ||
        !names.includes(facet.aesthetic.name)
      ) {
        continue;
      }

      // Duration filtering
      if (maxDurationMinutes && m.durationMinutes > maxDurationMinutes) {
        continue;
      }

      // For shows, check if next episode would be within duration limits
      if (mediaType === 'show' && maxDurationMinutes) {
        // The nextEpisodeOverDuration flag tells us if the next episode exceeds limits
        try {
          const progression = await progressionManager.GetShowProgression(
            m.mediaItemId,
            StreamType.Cont, // Use continuous stream type for main content
          );

          if (progression?.nextEpisodeOverDuration) {
            continue; // Next episode is too long based on existing progression logic
          }
        } catch (error) {
          // If progression check fails, allow the show but log it
          console.warn(
            `Failed to check progression for show ${m.mediaItemId}:`,
            error,
          );
        }
      }

      candidates.push(m as Show | Movie);
    }
  };

  await pushMatches(movies as any[], 'movie');
  await pushMatches(shows as any[], 'show');

  return candidates;
}

// Pick a media candidate with coin flip preference between shows and movies
export function pickMediaCandidateWithPreference(
  movieCandidates: Movie[],
  showCandidates: Show[],
  options: RefractOptions = {},
): { media: Episode | Movie | Show | null; reason: string } {
  const totalCandidates = movieCandidates.length + showCandidates.length;
  if (totalCandidates === 0) {
    return { media: null, reason: 'No candidates available' };
  }

  const { preferShowsOverMovies } = options;

  // Coin flip logic
  const coinFlip = Math.random() < 0.5;
  let preferShows = coinFlip;

  // Apply bias if specified
  if (preferShowsOverMovies !== undefined) {
    preferShows = preferShowsOverMovies;
  }

  // Try preferred type first
  if (preferShows && showCandidates.length > 0) {
    const idx = Math.floor(Math.random() * showCandidates.length);
    return {
      media: showCandidates[idx],
      reason: `Selected show via ${preferShowsOverMovies !== undefined ? 'bias' : 'coin flip'}`,
    };
  } else if (!preferShows && movieCandidates.length > 0) {
    const idx = Math.floor(Math.random() * movieCandidates.length);
    return {
      media: movieCandidates[idx],
      reason: `Selected movie via ${preferShowsOverMovies !== undefined ? 'bias' : 'coin flip'}`,
    };
  }

  // Fallback to any available media if preferred type not available
  if (preferShows && movieCandidates.length > 0) {
    const idx = Math.floor(Math.random() * movieCandidates.length);
    return {
      media: movieCandidates[idx],
      reason: 'Selected movie as fallback (no shows available)',
    };
  } else if (!preferShows && showCandidates.length > 0) {
    const idx = Math.floor(Math.random() * showCandidates.length);
    return {
      media: showCandidates[idx],
      reason: 'Selected show as fallback (no movies available)',
    };
  }

  // Final fallback - should not reach here given total check above
  return { media: null, reason: 'Unexpected fallback case' };
}

// Simple media candidate picker (fallback/utility function)
export function pickMediaCandidate(candidates: (Show | Movie)[]) {
  if (!candidates || candidates.length === 0) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

export function PickMediaFromFacet(
  facet: Facet,
  streamType: StreamType,
): Episode | Movie | null {
  // Use existing gatherCandidatesForFacet function to find matching media
  const candidates: (Movie | Show)[] = [];
  gatherCandidatesForFacet(facet).then(media => {
    candidates.push(...media);
  });
  if (candidates.length === 0) {
    return null;
  }
  const pickedMedia = pickMediaCandidate(candidates);
  // Use existing pickMediaCandidate function to select one

  if (pickedMedia!.type === MediaType.Show) {
    // It's a Show - select first episode
    const episodes = (pickedMedia! as Show).episodes;
    if (episodes && episodes.length > 0) {
      return progressionManager.GetNextEpisode(
        pickedMedia! as Show,
        streamType,
      );
    } else {
      return null;
    }
  } else {
    return pickedMedia as Movie;
  }
}

// Logging helper
export function logBridge(entry: any) {
  //TODO: Implement database logging for bridge events for user feedback
  void entry;
}

// Main refract orchestrator with controlled chaos and duration awareness
export async function refractFromMedia(
  media: BaseMedia,
  options: RefractOptions = {},
  bridgeLogger: (entry: any) => void = logBridge,
): Promise<RefractResult> {
  const tagNames = extractTagNames(media);
  if (tagNames.length === 0) {
    return {
      selectedMedia: null,
      chosenRelationship: null,
      selectionReason: 'No tags found on source media',
    };
  }

  // Find facets matching the source media
  const matchingFacets = findMatchingFacets(tagNames);
  const selectedFacet = pickFacet(matchingFacets);
  if (!selectedFacet) {
    return {
      selectedMedia: null,
      chosenRelationship: null,
      selectionReason: 'No matching source facets found',
    };
  }

  // Use controlled chaos to pick a relationship (target facet)
  const chosenRelationship = chooseControlledChaosRelationship(
    selectedFacet.facetId,
    options,
  );
  if (!chosenRelationship) {
    return {
      sourceFacetId: selectedFacet.facetId,
      selectedMedia: null,
      chosenRelationship: null,
      selectionReason:
        'No valid target facets found within distance constraints',
    };
  }

  // Find the target facet to gather candidates from
  const targetFacet = facetRepository.findByFacetId(
    chosenRelationship.targetFacetId,
  );
  if (!targetFacet) {
    return {
      sourceFacetId: selectedFacet.facetId,
      selectedMedia: null,
      chosenRelationship,
      selectionReason: 'Target facet not found',
    };
  }

  // Gather candidates from the TARGET facet (where we're walking to)
  const candidates = await gatherCandidatesForFacet(targetFacet, options);

  // Separate movies and shows for coin flip selection
  const movieCandidates = candidates.filter(
    (c: any) =>
      // Check if it came from movieRepository by looking for movie-specific properties
      c.alias !== undefined || c.imdb !== undefined,
  ) as Movie[];
  const showCandidates = candidates.filter(
    (c: any) =>
      // Check if it came from showRepository by looking for show-specific properties
      c.episodes !== undefined || c.episodeCount !== undefined,
  ) as Show[];

  // Use enhanced selection with coin flip
  const selectionResult = pickMediaCandidateWithPreference(
    movieCandidates,
    showCandidates,
    options,
  );

  // Record usage if media was selected
  if (selectionResult.media && options.usageContext) {
    // Determine if the selected media is a show or movie
    const isShow = (media: any): media is Show => {
      return 'episodes' in media || 'episodeCount' in media;
    };
    const mediaType = isShow(selectionResult.media) ? 'show' : 'movie';
    recentlyUsedMediaRepository.recordUsage(
      selectionResult.media.mediaItemId,
      mediaType,
      options.usageContext,
      options.streamSessionId,
    );
  }

  bridgeLogger({
    timestamp: new Date().toISOString(),
    sourceFacet: selectedFacet.facetId,
    targetFacet: targetFacet.facetId,
    chosenRelationship,
    distance: chosenRelationship.distance,
    candidateCount: candidates.length,
    movieCandidates: movieCandidates.length,
    showCandidates: showCandidates.length,
    selectionReason: selectionResult.reason,
    chosenMediaId: selectionResult.media
      ? selectionResult.media.mediaItemId
      : null,
    chosenMediaTitle: selectionResult.media
      ? selectionResult.media.title
      : null,
    mediaAnalyzed: { mediaItemId: media.mediaItemId, title: media.title },
  });

  return {
    sourceFacetId: selectedFacet.facetId,
    chosenRelationship,
    selectedMedia: selectionResult.media
      ? (selectionResult.media as unknown as BaseMedia)
      : null,
    selectionReason: selectionResult.reason,
  };
}

export default {
  refractFromMedia,
  extractTagNames,
  findMatchingFacets,
  pickFacet,
  chooseControlledChaosRelationship,
  gatherCandidatesForFacet,
  pickMediaCandidate,
  pickMediaCandidateWithPreference,
  logBridge,
};
