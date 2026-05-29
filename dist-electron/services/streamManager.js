import { StreamType } from "../types/StreamType.js";
import { getDB } from "../db/sqlite.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";
import { collectionMovieProgressionRepository } from "../repositories/collectionMovieProgressionRepository.js";
import { MediaType } from "../models.js";
/**
 * StreamManager Singleton
 * Maintains persistent stream state across the application lifecycle
 * Initialized when the background service starts and remains active until stopped
 */
class StreamManager {
    upcoming = [];
    onDeck = [];
    continuousStream = false;
    adhocStream = false;
    adhocEndTimepoint = 0;
    args = null;
    streamVarianceInSeconds = 0;
    nextIterationTimepoint = 0;
    nextIterationFirstMedia = null;
    progressionMap = new Map();
    collectionProgressionMap = new Map();
    recentlyUsedMovies = new Map();
    recentlyUsedCommercials = new Map();
    recentlyUsedShorts = new Map();
    recentlyUsedMusic = new Map();
    remainderTimeInSeconds = 0;
    randomEpisodeStart = false;
    anchorContentReadinessStatus = null;
    facetWalkabilityReadinessStatus = null;
    cadenceBufferReadinessStatus = null;
    constructor() {
        console.log("[StreamManager] Singleton instance created");
    }
    // Getters and setters for internal state
    getUpcoming() {
        return this.upcoming;
    }
    setUpcoming(blocks) {
        this.upcoming = blocks;
    }
    getOnDeck() {
        return this.onDeck;
    }
    setOnDeck(blocks) {
        this.onDeck = blocks;
    }
    isContinuous() {
        return this.continuousStream;
    }
    setContinuous(value) {
        this.continuousStream = value;
    }
    isAdhoc() {
        return this.adhocStream;
    }
    setAdhoc(value) {
        this.adhocStream = value;
    }
    getAdhocEndTimepoint() {
        return this.adhocEndTimepoint;
    }
    setAdhocEndTimepoint(value) {
        this.adhocEndTimepoint = value;
    }
    isActive() {
        return this.continuousStream || this.adhocStream;
    }
    getArgs() {
        return this.args;
    }
    setArgs(value) {
        this.args = value;
    }
    getVariance() {
        return this.streamVarianceInSeconds;
    }
    setVariance(value) {
        this.streamVarianceInSeconds = value;
    }
    setNextIterationTimepoint(value) {
        this.nextIterationTimepoint = value;
    }
    getNextIterationTimepoint() {
        return this.nextIterationTimepoint;
    }
    setNextIterationFirstMedia(value) {
        this.nextIterationFirstMedia = value;
    }
    getNextIterationFirstMedia() {
        return this.nextIterationFirstMedia;
    }
    getProgressionMap() {
        return this.progressionMap;
    }
    setProgressionMap(value) {
        this.progressionMap = value;
    }
    updateProgression(mediaItemId, episodeNumber) {
        this.progressionMap.set(mediaItemId, episodeNumber);
    }
    getCollectionProgressionMap() {
        return this.collectionProgressionMap;
    }
    setCollectionProgressionMap(value) {
        this.collectionProgressionMap = value;
    }
    getCollectionProgression(scopeKey, collectionId) {
        return this.collectionProgressionMap.get(`${scopeKey}::${collectionId}`);
    }
    setCollectionProgression(scopeKey, collectionId, value) {
        this.collectionProgressionMap.set(`${scopeKey}::${collectionId}`, value);
    }
    getCollectionProgressionForScope(scopeKey) {
        const scoped = new Map();
        const prefix = `${scopeKey}::`;
        for (const [key, value] of this.collectionProgressionMap.entries()) {
            if (key.startsWith(prefix)) {
                const collectionId = key.slice(prefix.length);
                scoped.set(collectionId, value);
            }
        }
        return scoped;
    }
    setCollectionProgressionForScope(scopeKey, value) {
        const prefix = `${scopeKey}::`;
        for (const key of Array.from(this.collectionProgressionMap.keys())) {
            if (key.startsWith(prefix)) {
                this.collectionProgressionMap.delete(key);
            }
        }
        for (const [collectionId, state] of value.entries()) {
            this.collectionProgressionMap.set(`${scopeKey}::${collectionId}`, state);
        }
    }
    getRecentlyUsedMovies() {
        return this.recentlyUsedMovies;
    }
    setRecentlyUsedMovies(value) {
        this.recentlyUsedMovies = value;
    }
    addRecentlyUsedMovie(movieId, unixTime) {
        this.recentlyUsedMovies.set(movieId, unixTime);
    }
    removeRecentlyUsedMovie(movieId) {
        this.recentlyUsedMovies.delete(movieId);
    }
    /**
     * Clears recently used movies that are 2 days or older than the provided timepoint
     * Returns array of media IDs that remain in the recently used map
     * @param timepoint Unix timestamp (seconds) to measure age against
     * @returns Array of media IDs still in the recently used movies map
     */
    getActiveRecentlyUsedMovieIds(timepoint) {
        const twoDaysInSeconds = 2 * 24 * 60 * 60; // 172,800 seconds
        // Remove entries that are 2 days or older
        for (const [movieId, usedTime] of this.recentlyUsedMovies.entries()) {
            if (timepoint - usedTime >= twoDaysInSeconds) {
                this.recentlyUsedMovies.delete(movieId);
            }
        }
        // Return remaining movie IDs as array
        return Array.from(this.recentlyUsedMovies.keys());
    }
    getRecentlyUsedCommercials() {
        return this.recentlyUsedCommercials;
    }
    setRecentlyUsedCommercials(value) {
        this.recentlyUsedCommercials = value;
    }
    addRecentlyUsedCommercial(commercialId, unixTime) {
        this.recentlyUsedCommercials.set(commercialId, unixTime);
    }
    removeRecentlyUsedCommercial(commercialId) {
        this.recentlyUsedCommercials.delete(commercialId);
    }
    getRecentlyUsedShorts() {
        return this.recentlyUsedShorts;
    }
    setRecentlyUsedShorts(value) {
        this.recentlyUsedShorts = value;
    }
    addRecentlyUsedShort(shortId, unixTime) {
        this.recentlyUsedShorts.set(shortId, unixTime);
    }
    removeRecentlyUsedShort(shortId) {
        this.recentlyUsedShorts.delete(shortId);
    }
    getRecentlyUsedMusic() {
        return this.recentlyUsedMusic;
    }
    setRecentlyUsedMusic(value) {
        this.recentlyUsedMusic = value;
    }
    addRecentlyUsedMusic(musicId, unixTime) {
        this.recentlyUsedMusic.set(musicId, unixTime);
    }
    removeRecentlyUsedMusic(musicId) {
        this.recentlyUsedMusic.delete(musicId);
    }
    getRemainderTimeInSeconds() {
        return this.remainderTimeInSeconds;
    }
    setRemainderTimeInSeconds(value) {
        this.remainderTimeInSeconds = value;
    }
    isRandomEpisodeStart() {
        return this.randomEpisodeStart;
    }
    setRandomEpisodeStart(value) {
        this.randomEpisodeStart = value;
    }
    getAnchorContentReadinessStatus() {
        return this.anchorContentReadinessStatus;
    }
    setAnchorContentReadinessStatus(value) {
        this.anchorContentReadinessStatus = value;
    }
    getFacetWalkabilityReadinessStatus() {
        return this.facetWalkabilityReadinessStatus;
    }
    setFacetWalkabilityReadinessStatus(value) {
        this.facetWalkabilityReadinessStatus = value;
    }
    getCadenceBufferReadinessStatus() {
        return this.cadenceBufferReadinessStatus;
    }
    setCadenceBufferReadinessStatus(value) {
        this.cadenceBufferReadinessStatus = value;
    }
    getStartupReadinessStatus() {
        const anchorContent = this.anchorContentReadinessStatus;
        const facetWalkability = this.facetWalkabilityReadinessStatus;
        const cadenceBuffer = this.cadenceBufferReadinessStatus;
        if (!anchorContent && !facetWalkability && !cadenceBuffer) {
            return null;
        }
        return {
            completedAt: Date.now(),
            anchorContent: anchorContent ?? {
                passed: false,
                detail: "Warning: Startup readiness has not been run yet.",
            },
            facetWalkability: facetWalkability ?? {
                passed: false,
                detail: "Warning: Startup readiness has not been run yet.",
            },
            cadenceBuffer: cadenceBuffer ?? {
                passed: false,
                detail: "Warning: Startup readiness has not been run yet.",
            },
            warnings: [
                ...(anchorContent && !anchorContent.passed
                    ? [anchorContent.detail]
                    : []),
                ...(facetWalkability && !facetWalkability.passed
                    ? [facetWalkability.detail]
                    : []),
                ...(cadenceBuffer && !cadenceBuffer.passed
                    ? [cadenceBuffer.detail]
                    : []),
            ],
        };
    }
    /**
     * Reset all state when stopping the stream
     */
    reset() {
        this.upcoming = [];
        this.onDeck = [];
        this.continuousStream = false;
        this.adhocStream = false;
        this.adhocEndTimepoint = 0;
        this.args = null;
        this.streamVarianceInSeconds = 0;
        this.nextIterationTimepoint = 0;
        this.nextIterationFirstMedia = null;
        this.progressionMap.clear();
        this.collectionProgressionMap.clear();
        this.recentlyUsedMovies.clear();
        this.recentlyUsedCommercials.clear();
        this.recentlyUsedShorts.clear();
        this.recentlyUsedMusic.clear();
        this.remainderTimeInSeconds = 0;
        this.randomEpisodeStart = false;
        this.anchorContentReadinessStatus = null;
        this.facetWalkabilityReadinessStatus = null;
        this.cadenceBufferReadinessStatus = null;
    }
}
// Singleton instance - created once and persists for the app lifetime
const streamManagerInstance = new StreamManager();
/**
 * Initializes a continuous stream, populating onDeck with initial media blocks
 * and upcoming with the constructed stream up to end of day
 */
export async function initializeStream(streamArgs, streamType = StreamType.Cont) {
    // Placeholder — stream init is handled by buildContinuousStream today.
    // Future: consolidate init logic here.
}
/**
 * Populates onDeck with upcoming media blocks
 * Typically called when onDeck drops below a certain threshold
 */
export function initializeOnDeckStream() {
    const upcoming = streamManagerInstance.getUpcoming();
    const onDeck = streamManagerInstance.getOnDeck();
    for (let i = 0; i < 2; i++) {
        if (upcoming.length > 0) {
            const selectedBlock = upcoming.shift();
            if (selectedBlock) {
                onDeck.push(selectedBlock);
            }
        }
    }
}
export function addItemToOnDeck(mediaBlocks) {
    streamManagerInstance.getOnDeck().push(...mediaBlocks);
}
export function removeFirstItemFromOnDeck() {
    return streamManagerInstance.getOnDeck().shift();
}
/**
 * Records a movie to the recently_used_movies DB table after it has finished playing.
 * Called when a block is pruned from On Deck.
 * @param mediaBlock The block that just finished playing
 */
export function recordPlayedMovie(mediaBlock) {
    if (mediaBlock.anchorMedia &&
        mediaBlock.anchorMedia.type === MediaType.Movie) {
        const db = getDB();
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + TWO_DAYS_MS).toISOString();
        db.prepare(`INSERT INTO recently_used_movies (mediaItemId, expiresAt) VALUES (?, ?)`).run(mediaBlock.anchorMedia.mediaItemId, expiresAt);
        console.log(`[StreamManager] Recorded recently played movie: "${mediaBlock.anchorMedia.title}"`);
    }
}
/**
 * Loads recently used movies from the DB into the in-memory map.
 * Only movies need DB persistence (restart protection).
 * Buffer media (commercials, shorts, music) is session-only — their maps start empty.
 *
 * Reads from `recently_used_movies` table, which is written to by
 * `recordPlayedMovie()` when blocks are pruned from On Deck.
 * Rows with `expiresAt` at or before the timepoint are cleaned up and skipped.
 * @param timepoint Unix timestamp in seconds to evaluate expiration against
 */
export function loadRecentlyUsedMovies(timepoint) {
    const db = getDB();
    const timepointISO = new Date(timepoint * 1000).toISOString();
    // Clean up expired rows
    db.prepare(`DELETE FROM recently_used_movies WHERE expiresAt <= ?`).run(timepointISO);
    // Load non-expired movies into the in-memory map
    const rows = db
        .prepare(`SELECT mediaItemId, expiresAt FROM recently_used_movies WHERE expiresAt > ?`)
        .all(timepointISO);
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    for (const row of rows) {
        // Derive the original usage timestamp from expiresAt for consistency with
        // the in-memory eviction logic in getActiveRecentlyUsedMovieIds()
        const expiresAtMs = new Date(row.expiresAt).getTime();
        const usedAtSeconds = Math.floor((expiresAtMs - TWO_DAYS_MS) / 1000);
        streamManagerInstance.addRecentlyUsedMovie(row.mediaItemId, usedAtSeconds);
    }
}
/**
 * Persists episode progression to the DB after an episode has finished playing.
 * Called when a block is pruned from On Deck (proof of playback).
 * Uses UPSERT so repeated plays of the same show update the existing row.
 * @param mediaBlock The block that just finished playing
 */
export function recordPlayedEpisodeProgression(mediaBlock) {
    // Adhoc progressions are ephemeral — no DB persistence.
    if (streamManagerInstance.isAdhoc()) {
        return;
    }
    if (mediaBlock.anchorMedia &&
        mediaBlock.anchorMedia.type === MediaType.Episode) {
        const episode = mediaBlock.anchorMedia;
        episodeProgressionRepository.upsertByShowAndStreamType(episode.showItemId, StreamType.Cont, episode.episodeNumber);
        console.log(`[StreamManager] Recorded episode progression: "${episode.title}" (ep ${episode.episodeNumber}) for show ${episode.showItemId}`);
    }
}
function getPrimaryCollectionId(movie) {
    if (!movie.collections || movie.collections.length === 0) {
        return null;
    }
    const sortedCollections = [...movie.collections].sort((a, b) => a.sequence - b.sequence);
    return sortedCollections[0]?.collectionId ?? null;
}
function getCollectionProgressionScopeFromMediaBlock(mediaBlock) {
    const programmingBlockId = mediaBlock.sourceContext?.programmingBlockId;
    if (programmingBlockId) {
        return {
            scopeKey: `programmingBlock:${programmingBlockId}`,
            scopeType: "ProgrammingBlock",
            shouldPersist: true,
        };
    }
    if (streamManagerInstance.isAdhoc()) {
        return {
            scopeKey: `stream:${StreamType.Adhoc}`,
            scopeType: "Stream",
            shouldPersist: false,
        };
    }
    return {
        scopeKey: `stream:${StreamType.Cont}`,
        scopeType: "Stream",
        shouldPersist: true,
    };
}
/**
 * Records collection progression to memory and optionally DB after a movie has finished playing.
 * Adhoc progression remains in-memory only.
 */
export function recordPlayedCollectionProgression(mediaBlock) {
    if (!mediaBlock.anchorMedia ||
        mediaBlock.anchorMedia.type !== MediaType.Movie) {
        return;
    }
    const movie = mediaBlock.anchorMedia;
    const collectionId = getPrimaryCollectionId(movie);
    if (!collectionId) {
        return;
    }
    const { scopeKey, scopeType, shouldPersist } = getCollectionProgressionScopeFromMediaBlock(mediaBlock);
    const now = Math.floor(Date.now() / 1000);
    streamManagerInstance.setCollectionProgression(scopeKey, collectionId, {
        lastMovieItemId: movie.mediaItemId,
        lastPlayedTimestamp: now,
    });
    if (shouldPersist) {
        collectionMovieProgressionRepository.upsert(scopeKey, scopeType, collectionId, movie.mediaItemId, now);
    }
    console.log(`[StreamManager] Recorded collection progression: "${movie.title}" in ${scopeKey}`);
}
export function loadCollectionProgressionForScope(scopeKey) {
    const rows = collectionMovieProgressionRepository.findByScopeKey(scopeKey);
    const map = new Map();
    for (const row of rows) {
        map.set(row.collectionId, {
            lastMovieItemId: row.lastMovieItemId,
            lastPlayedTimestamp: row.lastPlayedTimestamp,
        });
    }
    streamManagerInstance.setCollectionProgressionForScope(scopeKey, map);
}
export function clearCollectionProgressionForScope(scopeKey) {
    streamManagerInstance.setCollectionProgressionForScope(scopeKey, new Map());
}
export function getCollectionProgression(scopeKey, collectionId) {
    return streamManagerInstance.getCollectionProgression(scopeKey, collectionId);
}
export function setCollectionProgression(scopeKey, collectionId, lastMovieItemId, lastPlayedTimestamp) {
    streamManagerInstance.setCollectionProgression(scopeKey, collectionId, {
        lastMovieItemId,
        lastPlayedTimestamp,
    });
}
export function removeFirstItemFromUpcoming() {
    return streamManagerInstance.getUpcoming().shift();
}
export function addToUpcomingStream(mediaBlocks) {
    streamManagerInstance.getUpcoming().push(...mediaBlocks);
}
export function getUpcomingStream() {
    return streamManagerInstance.getUpcoming();
}
export function getOnDeckStream() {
    return streamManagerInstance.getOnDeck();
}
export function getOnDeckStreamLength() {
    return streamManagerInstance.getOnDeck().length;
}
export function isContinuousStream() {
    return streamManagerInstance.isContinuous();
}
export function setContinuousStream(value) {
    streamManagerInstance.setContinuous(value);
}
export function isAdhocStream() {
    return streamManagerInstance.isAdhoc();
}
export function setAdhocStream(value) {
    streamManagerInstance.setAdhoc(value);
}
export function getAdhocStreamEndTimepoint() {
    return streamManagerInstance.getAdhocEndTimepoint();
}
export function setAdhocStreamEndTimepoint(value) {
    streamManagerInstance.setAdhocEndTimepoint(value);
}
export function isRandomEpisodeStart() {
    return streamManagerInstance.isRandomEpisodeStart();
}
export function getStartupReadinessStatus() {
    return streamManagerInstance.getStartupReadinessStatus();
}
export function getAnchorContentReadinessStatus() {
    return streamManagerInstance.getAnchorContentReadinessStatus();
}
export function setAnchorContentReadinessStatus(value) {
    streamManagerInstance.setAnchorContentReadinessStatus(value);
}
export function getFacetWalkabilityReadinessStatus() {
    return streamManagerInstance.getFacetWalkabilityReadinessStatus();
}
export function setFacetWalkabilityReadinessStatus(value) {
    streamManagerInstance.setFacetWalkabilityReadinessStatus(value);
}
export function getCadenceBufferReadinessStatus() {
    return streamManagerInstance.getCadenceBufferReadinessStatus();
}
export function setCadenceBufferReadinessStatus(value) {
    streamManagerInstance.setCadenceBufferReadinessStatus(value);
}
export function setRandomEpisodeStart(value) {
    streamManagerInstance.setRandomEpisodeStart(value);
}
export function isActiveStream() {
    return streamManagerInstance.isActive();
}
export function getContinuousStreamArgs() {
    return streamManagerInstance.getArgs();
}
export function setContinuousStreamArgs(value) {
    streamManagerInstance.setArgs(value);
}
export function getStreamVariationInSeconds() {
    return streamManagerInstance.getVariance();
}
export function setStreamVariationInSeconds(value) {
    streamManagerInstance.setVariance(value);
}
export function getStreamStatus() {
    const args = streamManagerInstance.getArgs();
    return {
        isContinuous: streamManagerInstance.isContinuous(),
        hasUpcomingStream: streamManagerInstance.getUpcoming().length > 0,
        onDeckLength: streamManagerInstance.getOnDeck().length,
        upcomingLength: streamManagerInstance.getUpcoming().length,
        streamArgs: args
            ? {
                title: args.Title,
                hasPassword: !!args.Password,
            }
            : null,
    };
}
export function stopContinuousStream() {
    streamManagerInstance.reset();
    // TODO: Handle VLC or Electron player cleanup
}
/**
 * Add a recently used movie to the stream manager
 */
export function addRecentlyUsedMovie(movieId, unixTime) {
    streamManagerInstance.addRecentlyUsedMovie(movieId, unixTime);
}
export function removeRecentlyUsedMovie(movieId) {
    streamManagerInstance.removeRecentlyUsedMovie(movieId);
}
export function getRecentlyUsedMovies() {
    return streamManagerInstance.getRecentlyUsedMovies();
}
export function setRecentlyUsedMovies(value) {
    streamManagerInstance.setRecentlyUsedMovies(value);
}
export function getActiveRecentlyUsedMovieIds(timepoint) {
    return streamManagerInstance.getActiveRecentlyUsedMovieIds(timepoint);
}
export function addRecentlyUsedCommercial(commercialId, unixTime) {
    streamManagerInstance.addRecentlyUsedCommercial(commercialId, unixTime);
}
export function removeRecentlyUsedCommercial(commercialId) {
    streamManagerInstance.removeRecentlyUsedCommercial(commercialId);
}
export function getRecentlyUsedCommercials() {
    return streamManagerInstance.getRecentlyUsedCommercials();
}
export function setRecentlyUsedCommercials(value) {
    streamManagerInstance.setRecentlyUsedCommercials(value);
}
export function addRecentlyUsedShort(shortId, unixTime) {
    streamManagerInstance.addRecentlyUsedShort(shortId, unixTime);
}
export function removeRecentlyUsedShort(shortId) {
    streamManagerInstance.removeRecentlyUsedShort(shortId);
}
export function getRecentlyUsedShorts() {
    return streamManagerInstance.getRecentlyUsedShorts();
}
export function setRecentlyUsedShorts(value) {
    streamManagerInstance.setRecentlyUsedShorts(value);
}
export function addRecentlyUsedMusic(musicId, unixTime) {
    streamManagerInstance.addRecentlyUsedMusic(musicId, unixTime);
}
export function removeRecentlyUsedMusic(musicId) {
    streamManagerInstance.removeRecentlyUsedMusic(musicId);
}
export function getRecentlyUsedMusic() {
    return streamManagerInstance.getRecentlyUsedMusic();
}
export function setRecentlyUsedMusic(value) {
    streamManagerInstance.setRecentlyUsedMusic(value);
}
export function getUpcoming() {
    return streamManagerInstance.getUpcoming();
}
export function setUpcoming(blocks) {
    streamManagerInstance.setUpcoming(blocks);
}
export function getOnDeck() {
    return streamManagerInstance.getOnDeck();
}
export function setOnDeck(blocks) {
    streamManagerInstance.setOnDeck(blocks);
}
export function getArgs() {
    return streamManagerInstance.getArgs();
}
export function setArgs(value) {
    streamManagerInstance.setArgs(value);
}
export function getVariance() {
    return streamManagerInstance.getVariance();
}
export function setVariance(value) {
    streamManagerInstance.setVariance(value);
}
export function getNextIterationTimepoint() {
    return streamManagerInstance.getNextIterationTimepoint();
}
export function setNextIterationTimepoint(value) {
    streamManagerInstance.setNextIterationTimepoint(value);
}
export function getNextIterationFirstMedia() {
    return streamManagerInstance.getNextIterationFirstMedia();
}
export function setNextIterationFirstMedia(value) {
    streamManagerInstance.setNextIterationFirstMedia(value);
}
export function getProgressionMap() {
    return streamManagerInstance.getProgressionMap();
}
export function setProgressionMap(value) {
    streamManagerInstance.setProgressionMap(value);
}
export function updateProgression(mediaItemId, episodeNumber) {
    streamManagerInstance.updateProgression(mediaItemId, episodeNumber);
}
export function getRemainderTimeInSeconds() {
    return streamManagerInstance.getRemainderTimeInSeconds();
}
export function setRemainderTimeInSeconds(value) {
    streamManagerInstance.setRemainderTimeInSeconds(value);
}
/**
 * Adds initial media blocks to the player's playlist
 * TODO: Replace VLC-specific logic with Electron player integration
 */
export async function addInitialMediaBlocks() {
    // TODO: Implement with Electron player API
    // for (const item of onDeck) {
    //   await VLCService.addMediaBlockToPlaylist(item);
    // }
}
/**
 * Get the StreamManager singleton instance
 * Use this for direct access to the singleton throughout the app
 */
export function getStreamManager() {
    return streamManagerInstance;
}
