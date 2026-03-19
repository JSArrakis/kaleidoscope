import { StreamType } from "../types/StreamType.js";
/**
 * StreamManager Singleton
 * Maintains persistent stream state across the application lifecycle
 * Initialized when the background service starts and remains active until stopped
 */
class StreamManager {
    upcoming = [];
    onDeck = [];
    continuousStream = false;
    args = null;
    streamVarianceInSeconds = 0;
    nextIterationTimepoint = 0;
    nextIterationFirstMedia = null;
    progressionMap = new Map();
    recentlyUsedMovies = new Map();
    recentlyUsedCommercials = new Map();
    recentlyUsedShorts = new Map();
    recentlyUsedMusic = new Map();
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
    /**
     * Reset all state when stopping the stream
     */
    reset() {
        this.upcoming = [];
        this.onDeck = [];
        this.continuousStream = false;
        this.args = null;
        this.streamVarianceInSeconds = 0;
        this.nextIterationTimepoint = 0;
        this.nextIterationFirstMedia = null;
        this.progressionMap.clear();
        this.recentlyUsedCommercials.clear();
        this.recentlyUsedShorts.clear();
        this.recentlyUsedMusic.clear();
    }
}
// Singleton instance - created once and persists for the app lifetime
const streamManagerInstance = new StreamManager();
// Legacy module-level state for backwards compatibility during migration
let upcoming = [];
let onDeck = [];
let continuousStream = false;
let args = null;
let streamVarianceInSeconds = 0;
/**
 * Initializes a continuous stream, populating onDeck with initial media blocks
 * and upcoming with the constructed stream up to end of day
 */
export async function initializeStream(streamArgs, streamType = StreamType.Cont) { }
/**
 * Populates onDeck with upcoming media blocks
 * Typically called when onDeck drops below a certain threshold
 */
export function initializeOnDeckStream() {
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
    onDeck.push(...mediaBlocks);
}
export function removeFirstItemFromOnDeck() {
    return onDeck.shift();
}
export function removeFirstItemFromUpcoming() {
    return upcoming.shift();
}
export function addToUpcomingStream(mediaBlocks) {
    upcoming.push(...mediaBlocks);
}
export function getUpcomingStream() {
    return upcoming;
}
export function getOnDeckStream() {
    return onDeck;
}
export function getOnDeckStreamLength() {
    return onDeck.length;
}
export function isContinuousStream() {
    return continuousStream;
}
export function setContinuousStream(value) {
    continuousStream = value;
}
export function getContinuousStreamArgs() {
    return args;
}
export function setContinuousStreamArgs(value) {
    args = value;
}
export function getStreamVariationInSeconds() {
    return streamVarianceInSeconds;
}
export function setStreamVariationInSeconds(value) {
    streamVarianceInSeconds = value;
}
export function getStreamStatus() {
    return {
        isContinuous: continuousStream,
        hasUpcomingStream: upcoming.length > 0,
        onDeckLength: onDeck.length,
        upcomingLength: upcoming.length,
        streamArgs: args
            ? {
                title: args.Title,
                hasPassword: !!args.Password,
            }
            : null,
    };
}
export function stopContinuousStream() {
    continuousStream = false;
    upcoming = [];
    onDeck = [];
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
