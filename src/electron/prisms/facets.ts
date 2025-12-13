import { facetRepository } from "../repositories/facetRepository.js";
import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";

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

/**
 * Finds matching facets based on genre and aesthetic tags
 * Returns only full pairings (both genre AND aesthetic) - these represent meaningful relationship maps
 *
 * FACETS AS RELATIONSHIP MAPS
 * ===========================
 * A facet (genre + aesthetic pairing) creates a signature identity. For example, Blade Runner
 * is Noir (aesthetic) + Sci-Fi (genre). This specific combination creates a unique thematic voice
 * that speaks to the nature of humanity and our relationship with technology.
 *
 * Facets define relationships between these signature identities at varying distances. A full
 * pairing is required for a meaningful relationship map because the distance is calculated
 * relative to that specific combined identity.
 *
 * BREAKING DETERMINISTIC LOOPS
 * =============================
 * If no full pairings are found, the caller (selectFacetAdjacentMedia) is responsible for
 * fallback logic: finding any media that shares genre OR aesthetic tags directly. This breaks
 * deterministic progressions without compromising the relationship map system.
 *
 * Algorithm:
 * 1. Find facets matching ALL genre-aesthetic pairings from current media
 * 2. Return those full pairings (caller handles fallback to tag-based selection)
 *
 * @param segmentedTags SegmentedTags with genre and aesthetic tag arrays
 * @returns Array of full-pairing facets (empty if none found)
 */
export function findMatchingFacets(segmentedTags: SegmentedTags): Facet[] {
  if (
    segmentedTags.genreTags.length === 0 ||
    segmentedTags.aestheticTags.length === 0
  ) {
    return [];
  }

  const genreTagIds = segmentedTags.genreTags.map((t) => t.tagId);
  const aestheticTagIds = segmentedTags.aestheticTags.map((t) => t.tagId);

  // Find facets matching all genre-aesthetic pairings
  const matchedFacets: Facet[] = [];
  for (const genreTagId of genreTagIds) {
    for (const aestheticTagId of aestheticTagIds) {
      const facet = facetRepository.findByGenreAndAestheticId(
        genreTagId,
        aestheticTagId
      );
      if (facet) {
        matchedFacets.push(facet);
      }
    }
  }

  return matchedFacets;
}

/**
 * Selects media based on facet relationships
 * Uses genre and aesthetic tags to find matching facets, then selects media from those facet-aligned genres/aesthetics
 * This is the preferred fallback when specialty selection fails
 *
 * Falls back to tag-based media selection if no facet relationships exist, breaking deterministic loops
 *
 * @param segmentedTags SegmentedTags with genre and aesthetic tag arrays
 * @returns Movie or Episode from facet-related genres/aesthetics, or null if none found
 */
export function selectFacetAdjacentMedia(
  segmentedTags: SegmentedTags
): Movie | Episode | null {
  // If no genre or aesthetic tags, pick random media
  if (
    segmentedTags.genreTags.length === 0 &&
    segmentedTags.aestheticTags.length === 0
  ) {
    // TODO: Pick a random movie or show
    return null;
  }

  const matchedFacets = findMatchingFacets(segmentedTags);

  // If we have facets with relationships, use 70-30 split
  // (70% facet-based selection, 30% tag-based fallback for variety)
  if (matchedFacets.length > 0) {
    const useFacetPath = Math.random() < 0.7;

    if (useFacetPath) {
      // TODO: Select a facet relationship (considering distance/weighting)
      // TODO: Extract unique genres/aesthetics from selected facet's relationships
      // TODO: Select media from combined pool of matching tags
      return null;
    }
  }

  // FALLBACK: Either no facets with relationships, or we lost the coin flip
  // Find media that shares genre OR aesthetic tags directly
  // This prevents Movie A -> Movie G loops in small libraries
  // TODO: Find any media that shares genre OR aesthetic tags
  return null;
}
