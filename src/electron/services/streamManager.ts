import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../types/StreamType.js";
import { IStreamRequest } from "../types/StreamRequest.js";

/**
 * StreamManager Singleton
 * Maintains persistent stream state across the application lifecycle
 * Initialized when the background service starts and remains active until stopped
 */
class StreamManager {
  private upcoming: MediaBlock[] = [];
  private onDeck: MediaBlock[] = [];
  private continuousStream = false;
  private args: IStreamRequest | null = null;
  private streamVarianceInSeconds = 0;
  private nextIterationTimepoint = 0;
  private nextIterationFirstMedia: Episode | Movie | null = null;
  private progressionMap: Map<string, number | undefined> = new Map();
  private recentlyUsedMovies: Map<string, number> = new Map();
  private recentlyUsedCommercials: Map<string, number> = new Map();
  private recentlyUsedShorts: Map<string, number> = new Map();
  private recentlyUsedMusic: Map<string, number> = new Map();

  constructor() {
    console.log("[StreamManager] Singleton instance created");
  }

  // Getters and setters for internal state
  getUpcoming(): MediaBlock[] {
    return this.upcoming;
  }

  setUpcoming(blocks: MediaBlock[]): void {
    this.upcoming = blocks;
  }

  getOnDeck(): MediaBlock[] {
    return this.onDeck;
  }

  setOnDeck(blocks: MediaBlock[]): void {
    this.onDeck = blocks;
  }

  isContinuous(): boolean {
    return this.continuousStream;
  }

  setContinuous(value: boolean): void {
    this.continuousStream = value;
  }

  getArgs(): IStreamRequest | null {
    return this.args;
  }

  setArgs(value: IStreamRequest | null): void {
    this.args = value;
  }

  getVariance(): number {
    return this.streamVarianceInSeconds;
  }

  setVariance(value: number): void {
    this.streamVarianceInSeconds = value;
  }

  setNextIterationTimepoint(value: number): void {
    this.nextIterationTimepoint = value;
  }
  getNextIterationTimepoint(): number {
    return this.nextIterationTimepoint;
  }

  setNextIterationFirstMedia(value: Episode | Movie | null): void {
    this.nextIterationFirstMedia = value;
  }

  getNextIterationFirstMedia(): Episode | Movie | null {
    return this.nextIterationFirstMedia;
  }

  getProgressionMap(): Map<string, number | undefined> {
    return this.progressionMap;
  }

  setProgressionMap(value: Map<string, number | undefined>): void {
    this.progressionMap = value;
  }

  updateProgression(mediaItemId: string, episodeNumber: number): void {
    this.progressionMap.set(mediaItemId, episodeNumber);
  }

  getRecentlyUsedMovies(): Map<string, number> {
    return this.recentlyUsedMovies;
  }

  setRecentlyUsedMovies(value: Map<string, number>): void {
    this.recentlyUsedMovies = value;
  }

  addRecentlyUsedMovie(movieId: string, unixTime: number): void {
    this.recentlyUsedMovies.set(movieId, unixTime);
  }

  removeRecentlyUsedMovie(movieId: string): void {
    this.recentlyUsedMovies.delete(movieId);
  }

  getRecentlyUsedCommercials(): Map<string, number> {
    return this.recentlyUsedCommercials;
  }

  setRecentlyUsedCommercials(value: Map<string, number>): void {
    this.recentlyUsedCommercials = value;
  }

  addRecentlyUsedCommercial(commercialId: string, unixTime: number): void {
    this.recentlyUsedCommercials.set(commercialId, unixTime);
  }

  removeRecentlyUsedCommercial(commercialId: string): void {
    this.recentlyUsedCommercials.delete(commercialId);
  }

  getRecentlyUsedShorts(): Map<string, number> {
    return this.recentlyUsedShorts;
  }

  setRecentlyUsedShorts(value: Map<string, number>): void {
    this.recentlyUsedShorts = value;
  }

  addRecentlyUsedShort(shortId: string, unixTime: number): void {
    this.recentlyUsedShorts.set(shortId, unixTime);
  }

  removeRecentlyUsedShort(shortId: string): void {
    this.recentlyUsedShorts.delete(shortId);
  }

  getRecentlyUsedMusic(): Map<string, number> {
    return this.recentlyUsedMusic;
  }

  setRecentlyUsedMusic(value: Map<string, number>): void {
    this.recentlyUsedMusic = value;
  }

  addRecentlyUsedMusic(musicId: string, unixTime: number): void {
    this.recentlyUsedMusic.set(musicId, unixTime);
  }

  removeRecentlyUsedMusic(musicId: string): void {
    this.recentlyUsedMusic.delete(musicId);
  }

  /**
   * Reset all state when stopping the stream
   */
  reset(): void {
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
let upcoming: MediaBlock[] = [];
let onDeck: MediaBlock[] = [];
let continuousStream = false;
let args: IStreamRequest | null = null;
let streamVarianceInSeconds = 0;

export interface StreamStatus {
  isContinuous: boolean;
  hasUpcomingStream: boolean;
  onDeckLength: number;
  upcomingLength: number;
  streamArgs: {
    title?: string;
    hasPassword: boolean;
  } | null;
}

/**
 * Initializes a continuous stream, populating onDeck with initial media blocks
 * and upcoming with the constructed stream up to end of day
 */
export async function initializeStream(
  streamArgs: IStreamRequest,
  streamType: StreamType = StreamType.Cont,
) {}

/**
 * Populates onDeck with upcoming media blocks
 * Typically called when onDeck drops below a certain threshold
 */
export function initializeOnDeckStream(): void {
  for (let i = 0; i < 2; i++) {
    if (upcoming.length > 0) {
      const selectedBlock = upcoming.shift();
      if (selectedBlock) {
        onDeck.push(selectedBlock);
      }
    }
  }
}

export function addItemToOnDeck(mediaBlocks: MediaBlock[]): void {
  onDeck.push(...mediaBlocks);
}

export function removeFirstItemFromOnDeck(): MediaBlock | undefined {
  return onDeck.shift();
}

export function removeFirstItemFromUpcoming(): MediaBlock | undefined {
  return upcoming.shift();
}

export function addToUpcomingStream(mediaBlocks: MediaBlock[]): void {
  upcoming.push(...mediaBlocks);
}

export function getUpcomingStream(): MediaBlock[] {
  return upcoming;
}

export function getOnDeckStream(): MediaBlock[] {
  return onDeck;
}

export function getOnDeckStreamLength(): number {
  return onDeck.length;
}

export function isContinuousStream(): boolean {
  return continuousStream;
}

export function setContinuousStream(value: boolean): void {
  continuousStream = value;
}

export function getContinuousStreamArgs(): IStreamRequest | null {
  return args;
}

export function setContinuousStreamArgs(value: IStreamRequest): void {
  args = value;
}

export function getStreamVariationInSeconds(): number {
  return streamVarianceInSeconds;
}

export function setStreamVariationInSeconds(value: number): void {
  streamVarianceInSeconds = value;
}

export function getStreamStatus(): StreamStatus {
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

export function stopContinuousStream(): void {
  continuousStream = false;
  upcoming = [];
  onDeck = [];
  streamManagerInstance.reset();
  // TODO: Handle VLC or Electron player cleanup
}

/**
 * Add a recently used movie to the stream manager
 */
export function addRecentlyUsedMovie(movieId: string, unixTime: number): void {
  streamManagerInstance.addRecentlyUsedMovie(movieId, unixTime);
}

export function removeRecentlyUsedMovie(movieId: string): void {
  streamManagerInstance.removeRecentlyUsedMovie(movieId);
}

export function getRecentlyUsedMovies(): Map<string, number> {
  return streamManagerInstance.getRecentlyUsedMovies();
}

export function setRecentlyUsedMovies(value: Map<string, number>): void {
  streamManagerInstance.setRecentlyUsedMovies(value);
}

export function addRecentlyUsedCommercial(
  commercialId: string,
  unixTime: number,
): void {
  streamManagerInstance.addRecentlyUsedCommercial(commercialId, unixTime);
}

export function removeRecentlyUsedCommercial(commercialId: string): void {
  streamManagerInstance.removeRecentlyUsedCommercial(commercialId);
}

export function getRecentlyUsedCommercials(): Map<string, number> {
  return streamManagerInstance.getRecentlyUsedCommercials();
}

export function setRecentlyUsedCommercials(value: Map<string, number>): void {
  streamManagerInstance.setRecentlyUsedCommercials(value);
}

export function addRecentlyUsedShort(shortId: string, unixTime: number): void {
  streamManagerInstance.addRecentlyUsedShort(shortId, unixTime);
}

export function removeRecentlyUsedShort(shortId: string): void {
  streamManagerInstance.removeRecentlyUsedShort(shortId);
}

export function getRecentlyUsedShorts(): Map<string, number> {
  return streamManagerInstance.getRecentlyUsedShorts();
}

export function setRecentlyUsedShorts(value: Map<string, number>): void {
  streamManagerInstance.setRecentlyUsedShorts(value);
}

export function addRecentlyUsedMusic(musicId: string, unixTime: number): void {
  streamManagerInstance.addRecentlyUsedMusic(musicId, unixTime);
}

export function removeRecentlyUsedMusic(musicId: string): void {
  streamManagerInstance.removeRecentlyUsedMusic(musicId);
}

export function getRecentlyUsedMusic(): Map<string, number> {
  return streamManagerInstance.getRecentlyUsedMusic();
}

export function setRecentlyUsedMusic(value: Map<string, number>): void {
  streamManagerInstance.setRecentlyUsedMusic(value);
}

export function getUpcoming(): MediaBlock[] {
  return streamManagerInstance.getUpcoming();
}

export function setUpcoming(blocks: MediaBlock[]): void {
  streamManagerInstance.setUpcoming(blocks);
}

export function getOnDeck(): MediaBlock[] {
  return streamManagerInstance.getOnDeck();
}

export function setOnDeck(blocks: MediaBlock[]): void {
  streamManagerInstance.setOnDeck(blocks);
}

export function getArgs(): IStreamRequest | null {
  return streamManagerInstance.getArgs();
}

export function setArgs(value: IStreamRequest | null): void {
  streamManagerInstance.setArgs(value);
}

export function getVariance(): number {
  return streamManagerInstance.getVariance();
}

export function setVariance(value: number): void {
  streamManagerInstance.setVariance(value);
}

export function getNextIterationTimepoint(): number {
  return streamManagerInstance.getNextIterationTimepoint();
}

export function setNextIterationTimepoint(value: number): void {
  streamManagerInstance.setNextIterationTimepoint(value);
}

export function getNextIterationFirstMedia(): Episode | Movie | null {
  return streamManagerInstance.getNextIterationFirstMedia();
}

export function setNextIterationFirstMedia(
  value: Episode | Movie | null,
): void {
  streamManagerInstance.setNextIterationFirstMedia(value);
}

export function getProgressionMap(): Map<string, number | undefined> {
  return streamManagerInstance.getProgressionMap();
}

export function setProgressionMap(
  value: Map<string, number | undefined>,
): void {
  streamManagerInstance.setProgressionMap(value);
}

export function updateProgression(
  mediaItemId: string,
  episodeNumber: number,
): void {
  streamManagerInstance.updateProgression(mediaItemId, episodeNumber);
}

/**
 * Adds initial media blocks to the player's playlist
 * TODO: Replace VLC-specific logic with Electron player integration
 */
export async function addInitialMediaBlocks(): Promise<void> {
  // TODO: Implement with Electron player API
  // for (const item of onDeck) {
  //   await VLCService.addMediaBlockToPlaylist(item);
  // }
}

/**
 * Get the StreamManager singleton instance
 * Use this for direct access to the singleton throughout the app
 */
export function getStreamManager(): StreamManager {
  return streamManagerInstance;
}
