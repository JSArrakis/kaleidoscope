import { facetRepository } from '../repositories/facetRepository';
import { movieRepository } from '../repositories/movieRepository';
import { showRepository } from '../repositories/showRepository';
import { BaseMedia } from '../models/mediaInterface';
import { getTagName } from './core';

export interface RefractResult {
  sourceFacetId?: string;
  chosenRelationship?: { targetFacetId: string; distance: number } | null;
  selectedMedia?: BaseMedia | null;
}

// Small helper: extract tag names from a media object
export function extractTagNames(media: BaseMedia): string[] {
  if (!media || !Array.isArray(media.tags)) return [];
  return (media.tags || []).map((t: any) => getTagName(t)) as any;
}

// Find facets where both genre and aesthetic are present in the provided tag names
export function findMatchingFacets(tagNames: string[]) {
  const allFacets = facetRepository.findAll();
  return allFacets.filter(
    f => tagNames.includes(f.genre) && tagNames.includes(f.aesthetic),
  );
}

// Simple selector: pick one facet (placeholder for more advanced selection)
export function pickFacet(facets: any[]) {
  if (!facets || facets.length === 0) return null;
  const idx = Math.floor(Math.random() * facets.length);
  const safeIdx = Math.min(idx, facets.length - 1);
  return facets[safeIdx];
}

// Choose the closest relationship (lowest distance) from facet distances
export function chooseClosestRelationship(sourceFacetId: string) {
  const distances = facetRepository.findAllDistancesFrom(sourceFacetId);
  if (!distances || distances.length === 0) return null;
  // Keep only distances with a finite numeric distance value
  const valid = distances.filter(
    d => typeof d.distance === 'number' && Number.isFinite(d.distance),
  );
  if (valid.length === 0) return null;
  valid.sort((a, b) => a.distance - b.distance);
  return {
    targetFacetId: valid[0].targetFacetId,
    distance: valid[0].distance,
  };
}

// Gather candidate media items (movies and shows) that match a facet's genre+aesthetic
export function gatherCandidatesForFacet(facet: any): BaseMedia[] {
  if (!facet) return [];
  const movies = movieRepository.findAll();
  const shows = showRepository.findAll();
  const candidates: BaseMedia[] = [];

  const pushMatches = (items: any[]) => {
    items.forEach(m => {
      const names = (m.tags || []).map((t: any) => getTagName(t));
      if (names.includes(facet.genre) && names.includes(facet.aesthetic))
        candidates.push(m as BaseMedia);
    });
  };

  pushMatches(movies as any[]);
  pushMatches(shows as any[]);

  return candidates;
}

// Pick a random media candidate
export function pickMediaCandidate(candidates: BaseMedia[]) {
  if (!candidates || candidates.length === 0) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  const safeIdx = Math.min(idx, candidates.length - 1);
  return candidates[safeIdx];
}

// Logging helper
export function logBridge(entry: any) {
  //TODO: Implement database logging for bridge events for user feedback
  void entry;
}

// Orchestrator: original refract behavior, built from the small helpers above
export function refractFromMedia(
  media: BaseMedia,
  bridgeLogger: (entry: any) => void = logBridge,
): RefractResult {
  const tagNames = extractTagNames(media);
  if (tagNames.length === 0)
    return { selectedMedia: null, chosenRelationship: null };

  const matchingFacets = findMatchingFacets(tagNames);
  const selectedFacet = pickFacet(matchingFacets);
  if (!selectedFacet) return { selectedMedia: null, chosenRelationship: null };

  const chosenRelationship = chooseClosestRelationship(selectedFacet.facetId);

  const candidates = gatherCandidatesForFacet(selectedFacet);
  const selectedMedia = pickMediaCandidate(candidates);

  bridgeLogger({
    timestamp: new Date().toISOString(),
    sourceFacet: selectedFacet.facetId,
    chosenRelationship,
    chosenMediaId: selectedMedia ? selectedMedia.mediaItemId : null,
    chosenMediaTitle: selectedMedia ? selectedMedia.title : null,
    mediaAnalyzed: { mediaItemId: media.mediaItemId, title: media.title },
  });

  return {
    sourceFacetId: selectedFacet.facetId,
    chosenRelationship,
    selectedMedia,
  };
}

export default {
  refractFromMedia,
  extractTagNames,
  findMatchingFacets,
  pickFacet,
  chooseClosestRelationship,
  gatherCandidatesForFacet,
  pickMediaCandidate,
  logBridge,
};
