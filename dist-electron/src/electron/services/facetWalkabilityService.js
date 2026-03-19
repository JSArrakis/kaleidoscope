import { facetRepository } from "../repositories/facetRepository.js";
/**
 * Determines if the current facet system can support "walking" streams
 * by checking if facets are sufficiently connected.
 *
 * A facet system is considered walkable if the largest connected component
 * of facets (connected through genre/aesthetic relationships) represents
 * at least the specified percentile of all facets in the system.
 *
 * @param percentile Minimum percentage of facets that must be in the largest connected component (0-100)
 * @returns true if facets can support walking, false otherwise
 */
export function canFacetsWalk(percentile = 80) {
    const allFacets = facetRepository.findAll();
    if (allFacets.length === 0) {
        return false;
    }
    // Build adjacency map: facetId -> Set of connected facetIds
    const adjacencyMap = new Map();
    for (const facet of allFacets) {
        if (!adjacencyMap.has(facet.facetId)) {
            adjacencyMap.set(facet.facetId, new Set());
        }
        // Connect to all facets that share genre or aesthetic
        for (const relationship of facet.facetRelationships) {
            // Find facets that match the relationship's genre and aesthetic
            for (const otherFacet of allFacets) {
                if (otherFacet.facetId === facet.facetId)
                    continue;
                // Connect if they share a genre or aesthetic
                const shareGenre = (facet.genre?.tagId === otherFacet.genre?.tagId &&
                    facet.genre?.tagId) ||
                    (facet.genre?.tagId === relationship.genre?.tagId &&
                        facet.genre?.tagId) ||
                    (otherFacet.genre?.tagId === relationship.genre?.tagId &&
                        otherFacet.genre?.tagId);
                const shareAesthetic = (facet.aesthetic?.tagId === otherFacet.aesthetic?.tagId &&
                    facet.aesthetic?.tagId) ||
                    (facet.aesthetic?.tagId === relationship.aesthetic?.tagId &&
                        facet.aesthetic?.tagId) ||
                    (otherFacet.aesthetic?.tagId === relationship.aesthetic?.tagId &&
                        otherFacet.aesthetic?.tagId);
                if (shareGenre || shareAesthetic) {
                    adjacencyMap.get(facet.facetId).add(otherFacet.facetId);
                    if (!adjacencyMap.has(otherFacet.facetId)) {
                        adjacencyMap.set(otherFacet.facetId, new Set());
                    }
                    adjacencyMap.get(otherFacet.facetId).add(facet.facetId);
                }
            }
        }
    }
    // Find largest connected component using DFS
    const visited = new Set();
    let largestComponentSize = 0;
    for (const facet of allFacets) {
        if (visited.has(facet.facetId))
            continue;
        // DFS to find component size
        const componentSize = dfsComponentSize(facet.facetId, adjacencyMap, visited);
        largestComponentSize = Math.max(largestComponentSize, componentSize);
        // Early exit: if we've found a component >= percentile threshold
        if ((largestComponentSize / allFacets.length) * 100 >= percentile) {
            return true;
        }
    }
    // Check if largest component meets threshold
    const percentageConnected = (largestComponentSize / allFacets.length) * 100;
    return percentageConnected >= percentile;
}
/**
 * DFS helper to find the size of a connected component
 *
 * @param facetId Starting facet ID
 * @param adjacencyMap Graph of connections
 * @param visited Set to track visited facets
 * @returns Size of the connected component
 */
function dfsComponentSize(facetId, adjacencyMap, visited) {
    if (visited.has(facetId)) {
        return 0;
    }
    visited.add(facetId);
    let size = 1;
    const neighbors = adjacencyMap.get(facetId) || new Set();
    for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
            size += dfsComponentSize(neighborId, adjacencyMap, visited);
        }
    }
    return size;
}
