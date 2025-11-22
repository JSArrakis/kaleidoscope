"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTagNames = extractTagNames;
exports.findMatchingFacets = findMatchingFacets;
exports.pickFacet = pickFacet;
exports.chooseControlledChaosRelationship = chooseControlledChaosRelationship;
exports.gatherCandidatesForFacet = gatherCandidatesForFacet;
exports.pickMediaCandidateWithPreference = pickMediaCandidateWithPreference;
exports.pickMediaCandidate = pickMediaCandidate;
exports.PickMediaFromFacet = PickMediaFromFacet;
exports.logBridge = logBridge;
exports.refractFromMedia = refractFromMedia;
const facetRepository_1 = require("../repositories/facetRepository.cjs");
const movieRepository_1 = require("../repositories/movieRepository.cjs");
const showRepository_1 = require("../repositories/showRepository.cjs");
const recentlyUsedMediaRepository_1 = require("../repositories/recentlyUsedMediaRepository.cjs");
const progressionManager = __importStar(require("../services/progressionManager.cjs"));
const streamTypes_1 = require("../models/enum/streamTypes.cjs");
const core_1 = require("./core.cjs");
const mediaTypes_1 = require("../models/enum/mediaTypes.cjs");
function extractTagNames(media) {
    if (!media || !Array.isArray(media.tags))
        return [];
    return (media.tags || []).map((t) => (0, core_1.getTagName)(t));
}
function findMatchingFacets(tagNames) {
    const allFacets = facetRepository_1.facetRepository.findAll();
    return allFacets.filter(f => tagNames.includes(f.genre.name) && tagNames.includes(f.aesthetic.name));
}
// Simple selector: pick one facet (placeholder for more advanced selection)
function pickFacet(facets) {
    if (!facets || facets.length === 0)
        return null;
    const idx = Math.floor(Math.random() * facets.length);
    const safeIdx = Math.min(idx, facets.length - 1);
    return facets[safeIdx];
}
// Choose a relationship using controlled chaos - not always closest, but avoid too distant
function chooseControlledChaosRelationship(sourceFacetId, options = {}) {
    const { maxDistance = 0.7, minDistance = 0.05 } = options;
    const distances = facetRepository_1.facetRepository.findAllDistancesFrom(sourceFacetId);
    if (!distances || distances.length === 0)
        return null;
    // Keep only distances with finite numeric values within our chaos range
    const valid = distances.filter(d => typeof d.distance === 'number' &&
        Number.isFinite(d.distance) &&
        d.distance >= minDistance &&
        d.distance <= maxDistance);
    if (valid.length === 0) {
        // Fallback: if no valid distances in range, use closest available
        const allValid = distances.filter(d => typeof d.distance === 'number' && Number.isFinite(d.distance));
        if (allValid.length === 0)
            return null;
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
async function gatherCandidatesForFacet(facet, options = {}) {
    if (!facet)
        return [];
    const { maxDurationMinutes, usageContext = 'main_content' } = options;
    const movies = movieRepository_1.movieRepository.findAll();
    const shows = showRepository_1.showRepository.findAll();
    const candidates = [];
    // Get recently used media IDs to exclude
    const recentMovieIds = recentlyUsedMediaRepository_1.recentlyUsedMediaRepository.getRecentlyUsedMediaIds('movie', usageContext, 24);
    const recentShowIds = recentlyUsedMediaRepository_1.recentlyUsedMediaRepository.getRecentlyUsedMediaIds('show', usageContext, 24);
    const pushMatches = async (items, mediaType) => {
        const recentIds = mediaType === 'movie' ? recentMovieIds : recentShowIds;
        for (const m of items) {
            // Skip recently used media
            if (recentIds.includes(m.mediaItemId))
                continue;
            const names = (m.tags || []).map((t) => (0, core_1.getTagName)(t));
            if (!names.includes(facet.genre.name) ||
                !names.includes(facet.aesthetic.name)) {
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
                    const progression = await progressionManager.GetShowProgression(m.mediaItemId, streamTypes_1.StreamType.Cont);
                    if (progression?.nextEpisodeOverDuration) {
                        continue; // Next episode is too long based on existing progression logic
                    }
                }
                catch (error) {
                    // If progression check fails, allow the show but log it
                    console.warn(`Failed to check progression for show ${m.mediaItemId}:`, error);
                }
            }
            candidates.push(m);
        }
    };
    await pushMatches(movies, 'movie');
    await pushMatches(shows, 'show');
    return candidates;
}
// Pick a media candidate with coin flip preference between shows and movies
function pickMediaCandidateWithPreference(movieCandidates, showCandidates, options = {}) {
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
    }
    else if (!preferShows && movieCandidates.length > 0) {
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
    }
    else if (!preferShows && showCandidates.length > 0) {
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
function pickMediaCandidate(candidates) {
    if (!candidates || candidates.length === 0)
        return null;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
}
function PickMediaFromFacet(facet, streamType) {
    // Use existing gatherCandidatesForFacet function to find matching media
    const candidates = [];
    gatherCandidatesForFacet(facet).then(media => {
        candidates.push(...media);
    });
    if (candidates.length === 0) {
        return null;
    }
    const pickedMedia = pickMediaCandidate(candidates);
    // Use existing pickMediaCandidate function to select one
    if (pickedMedia.type === mediaTypes_1.MediaType.Show) {
        // It's a Show - select first episode
        const episodes = pickedMedia.episodes;
        if (episodes && episodes.length > 0) {
            return progressionManager.GetNextEpisode(pickedMedia, streamType);
        }
        else {
            return null;
        }
    }
    else {
        return pickedMedia;
    }
}
// Logging helper
function logBridge(entry) {
    //TODO: Implement database logging for bridge events for user feedback
    void entry;
}
// Main refract orchestrator with controlled chaos and duration awareness
async function refractFromMedia(media, options = {}, bridgeLogger = logBridge) {
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
    const chosenRelationship = chooseControlledChaosRelationship(selectedFacet.facetId, options);
    if (!chosenRelationship) {
        return {
            sourceFacetId: selectedFacet.facetId,
            selectedMedia: null,
            chosenRelationship: null,
            selectionReason: 'No valid target facets found within distance constraints',
        };
    }
    // Find the target facet to gather candidates from
    const targetFacet = facetRepository_1.facetRepository.findByFacetId(chosenRelationship.targetFacetId);
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
    const movieCandidates = candidates.filter((c) => 
    // Check if it came from movieRepository by looking for movie-specific properties
    c.alias !== undefined || c.imdb !== undefined);
    const showCandidates = candidates.filter((c) => 
    // Check if it came from showRepository by looking for show-specific properties
    c.episodes !== undefined || c.episodeCount !== undefined);
    // Use enhanced selection with coin flip
    const selectionResult = pickMediaCandidateWithPreference(movieCandidates, showCandidates, options);
    // Record usage if media was selected
    if (selectionResult.media && options.usageContext) {
        // Determine if the selected media is a show or movie
        const isShow = (media) => {
            return 'episodes' in media || 'episodeCount' in media;
        };
        const mediaType = isShow(selectionResult.media) ? 'show' : 'movie';
        recentlyUsedMediaRepository_1.recentlyUsedMediaRepository.recordUsage(selectionResult.media.mediaItemId, mediaType, options.usageContext, options.streamSessionId);
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
            ? selectionResult.media
            : null,
        selectionReason: selectionResult.reason,
    };
}
exports.default = {
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
