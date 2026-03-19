import { facetRepository } from "../repositories/facetRepository.js";
/**
 * Selects a facet relationship from a list using weighted distance selection
 * Closer relationships (lower distance) have higher probability of selection
 * Uses inverse distance weighting: weight = 1 - distance
 *
 * Duplicates in the relationship list naturally increase their selection probability
 *
 * @param relationships Array of FacetRelationshipItems to select from
 * @returns Selected FacetRelationshipItem, or null if none available
 */
export function selectFacetRelationship(relationships) {
    // Build weighted selection from relationships using inverse distance
    const weightedRelationships = [];
    let totalWeighting = 0;
    for (const relationship of relationships) {
        const weight = 1 - relationship.distance;
        weightedRelationships.push({ relationship, weight });
        totalWeighting += weight;
    }
    // Select a relationship using weighted random
    let random = Math.random() * totalWeighting;
    for (const { relationship, weight } of weightedRelationships) {
        if (random < weight) {
            return relationship;
        }
        random -= weight;
    }
    // Fallback: return last relationship (shouldn't reach here)
    return weightedRelationships[weightedRelationships.length - 1].relationship;
}
/**
 * Finds matching facets based on genre and aesthetic tags
 * Returns facets and a boolean indicating if they are full genre/aesthetic pairs
 *
 * FACETS AS RELATIONSHIP MAPS
 * ===========================
 * A facet (genre + aesthetic pairing) creates a signature identity. For example, Blade Runner
 * is Noir (aesthetic) + Sci-Fi (genre). This specific combination creates a unique thematic voice
 * that is recognizable for its narrative themes and subjects and the way it presents those themes or subjects.
 *
 * Facets define relationships between these one signature identity and another at varying distances. A full
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
 * 1. If both genres and aesthetics exist, find facets matching all genre-aesthetic pairings
 * 2. If only genres exist, find facets sharing those genres
 * 3. If only aesthetics exist, find facets sharing those aesthetics
 * 4. Return facets and boolean indicating if they are full pairs
 *
 * @param segmentedTags SegmentedTags with genre and aesthetic tag arrays
 * @returns Object with facets array and isFullPair boolean
 */
export function findMatchingFacets(segmentedTags) {
    // If no genres and no aesthetics, can't find any facets
    if (segmentedTags.genreTags.length === 0 ||
        segmentedTags.aestheticTags.length === 0) {
        return [];
    }
    // Both genres and aesthetics - find facets matching all pairings
    const genreTagIds = segmentedTags.genreTags.map((t) => t.tagId);
    const aestheticTagIds = segmentedTags.aestheticTags.map((t) => t.tagId);
    // Find facets matching all genre-aesthetic pairings
    const matchedFacets = [];
    for (const genreTagId of genreTagIds) {
        for (const aestheticTagId of aestheticTagIds) {
            const facet = facetRepository.findByGenreAndAestheticId(genreTagId, aestheticTagId);
            if (facet) {
                matchedFacets.push(facet);
            }
        }
    }
    return matchedFacets;
}
