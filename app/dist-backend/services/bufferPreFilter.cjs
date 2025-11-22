"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preFilterBufferMedia = preFilterBufferMedia;
exports.createPrioritizedBufferList = createPrioritizedBufferList;
const tagTypes_1 = require("../models/const/tagTypes.cjs");
const facetRepository_1 = require("../repositories/facetRepository.cjs");
const commercialRepository_1 = require("../repositories/commercialRepository.cjs");
const shortRepository_1 = require("../repositories/shortRepository.cjs");
const musicRepository_1 = require("../repositories/musicRepository.cjs");
/**
 * Pre-filters buffer media based on facet distance and specialty tag matching
 */
async function preFilterBufferMedia(context) {
    const facetRepo = new facetRepository_1.FacetRepository();
    const commercialRepo = new commercialRepository_1.CommercialRepository();
    const shortRepo = new shortRepository_1.ShortRepository();
    const musicRepo = new musicRepository_1.MusicRepository();
    // Extract facet information from main media
    const mainFacetData = extractMainMediaFacetData(context.mainMedia);
    const specialtyTags = extractSpecialtyTags(context.mainMedia);
    const result = {
        exactFacetMatches: [],
        nearFacetMatches: [],
        distantFacetMatches: [],
        specialtyMatches: [],
        fallbackMedia: [],
        sourceGenre: mainFacetData?.genre,
        sourceAesthetic: mainFacetData?.aesthetic,
        sourceSpecialtyTags: specialtyTags,
    };
    // 1. Handle exact facet matches (distance = 0)
    if (mainFacetData) {
        const exactFacet = await findFacetByGenreAesthetic(facetRepo, mainFacetData.genre, mainFacetData.aesthetic);
        if (exactFacet) {
            const exactMatches = await getBufferMediaForFacet(exactFacet, commercialRepo, shortRepo, musicRepo, context.exclusionHours || 2);
            result.exactFacetMatches = exactMatches;
            // 2. Get related facets through distance relationships
            const relatedFacets = await getRelatedFacetsByDistance(facetRepo, exactFacet.facetId, context.maxFacetDistance || 3);
            for (const { facet, distance } of relatedFacets) {
                const relatedMedia = await getBufferMediaForFacet(facet, commercialRepo, shortRepo, musicRepo, context.exclusionHours || 2);
                // Categorize by distance
                if (distance <= 1) {
                    result.nearFacetMatches.push(...relatedMedia);
                }
                else {
                    result.distantFacetMatches.push(...relatedMedia);
                }
            }
        }
    }
    // 3. Handle specialty tag matches
    if (context.includeSpecialtyMatches !== false && specialtyTags.length > 0) {
        const specialtyMatches = await getBufferMediaBySpecialtyTags(specialtyTags, commercialRepo, shortRepo, musicRepo, context.exclusionHours || 2);
        result.specialtyMatches = specialtyMatches;
    }
    // 4. Fallback media (random selection from available buffer media)
    const fallbackMedia = await getRandomBufferMedia(commercialRepo, shortRepo, musicRepo, context.exclusionHours || 2, 100);
    result.fallbackMedia = fallbackMedia;
    return result;
}
/**
 * Extracts genre and aesthetic information from main media
 */
function extractMainMediaFacetData(mainMedia) {
    if (!mainMedia.tags)
        return null;
    let genre = '';
    let aesthetic = '';
    for (const tag of mainMedia.tags) {
        const tagName = getTagName(tag);
        const tagType = getTagType(tag);
        if (tagType === tagTypes_1.TagType.Genre) {
            genre = tagName;
        }
        else if (tagType === tagTypes_1.TagType.Aesthetic) {
            aesthetic = tagName;
        }
        if (genre && aesthetic)
            break;
    }
    return genre && aesthetic ? { genre, aesthetic } : null;
}
/**
 * Extracts specialty tags from main media
 */
function extractSpecialtyTags(mainMedia) {
    if (!mainMedia.tags)
        return [];
    return mainMedia.tags
        .filter(tag => getTagType(tag) === tagTypes_1.TagType.Specialty)
        .map(tag => getTagName(tag));
}
/**
 * Finds a facet by genre and aesthetic combination
 */
async function findFacetByGenreAesthetic(facetRepo, genre, aesthetic) {
    // For now, we'll need to get all facets and filter
    // In the future, you might want to add a specific query method to FacetRepository
    const allFacets = facetRepo.findAll();
    return (allFacets.find(f => f.genre.name === genre && f.aesthetic.name === aesthetic) || null);
}
/**
 * Gets related facets by distance relationships
 */
async function getRelatedFacetsByDistance(facetRepo, sourceFacetId, maxDistance) {
    const distances = facetRepo.findAllDistancesFrom(sourceFacetId);
    const results = [];
    for (const { targetFacetId, distance } of distances) {
        if (distance <= maxDistance) {
            const facet = facetRepo.findByFacetId(targetFacetId);
            if (facet) {
                results.push({ facet, distance });
            }
        }
    }
    return results.sort((a, b) => a.distance - b.distance);
}
/**
 * Gets buffer media for a specific facet
 */
async function getBufferMediaForFacet(facet, commercialRepo, shortRepo, musicRepo, exclusionHours) {
    const tags = [facet.genre.name, facet.aesthetic.name];
    const bufferMedia = [];
    // Get buffer media from each repository
    const commercials = commercialRepo.findBufferCommercialsByTags(tags, exclusionHours);
    const shorts = shortRepo.findBufferShortsByTags(tags, exclusionHours);
    // Note: Music repository might not have the same method yet
    // const music = musicRepo.findBufferMusicByTags(tags, exclusionHours);
    bufferMedia.push(...commercials, ...shorts);
    return bufferMedia;
}
/**
 * Gets buffer media by specialty tags
 */
async function getBufferMediaBySpecialtyTags(specialtyTags, commercialRepo, shortRepo, musicRepo, exclusionHours) {
    const bufferMedia = [];
    // Get media that matches any of the specialty tags
    for (const tag of specialtyTags) {
        const commercials = commercialRepo.findBufferCommercialsByTags([tag], exclusionHours);
        const shorts = shortRepo.findBufferShortsByTags([tag], exclusionHours);
        bufferMedia.push(...commercials, ...shorts);
    }
    // Remove duplicates
    const uniqueMedia = removeDuplicateMedia(bufferMedia);
    return uniqueMedia;
}
/**
 * Gets random buffer media as fallback
 */
async function getRandomBufferMedia(commercialRepo, shortRepo, musicRepo, exclusionHours, limit) {
    const bufferMedia = [];
    // Get random buffer media (without specific tag filtering)
    // This would need new repository methods that don't filter by tags
    // For now, we'll use empty tag arrays which should return random results
    const commercials = commercialRepo.findBufferCommercialsByTags([], exclusionHours);
    const shorts = shortRepo.findBufferShortsByTags([], exclusionHours);
    bufferMedia.push(...commercials, ...shorts);
    // Shuffle and limit
    const shuffled = shuffleArray(bufferMedia);
    return shuffled.slice(0, limit);
}
/**
 * Removes duplicate media items based on mediaItemId
 */
function removeDuplicateMedia(media) {
    const seen = new Set();
    return media.filter(item => {
        if (seen.has(item.mediaItemId)) {
            return false;
        }
        seen.add(item.mediaItemId);
        return true;
    });
}
/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * Creates a prioritized list of buffer media for spectrum processing
 */
function createPrioritizedBufferList(filtered) {
    const prioritized = [];
    // Priority order: exact -> near -> specialty -> distant -> fallback
    prioritized.push(...filtered.exactFacetMatches);
    prioritized.push(...filtered.nearFacetMatches);
    prioritized.push(...filtered.specialtyMatches);
    prioritized.push(...filtered.distantFacetMatches);
    prioritized.push(...filtered.fallbackMedia);
    // Remove duplicates while preserving order
    return removeDuplicateMedia(prioritized);
}
/**
 * Utility function to get tag name regardless of whether it's a string or Tag object
 */
function getTagName(tag) {
    return typeof tag === 'string' ? tag : tag.name;
}
/**
 * Utility function to get tag type
 */
function getTagType(tag) {
    return typeof tag === 'string' ? null : tag.type;
}
