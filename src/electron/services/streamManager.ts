import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../types/StreamType.js";
import { IStreamRequest } from "../types/StreamRequest.js";
import { getDB } from "../db/sqlite.js";
import { episodeProgressionRepository } from "../repositories/episodeProgressionRepository.js";

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
  private remainderTimeInSeconds = 0;

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

  /**
   * Clears recently used movies that are 2 days or older than the provided timepoint
   * Returns array of media IDs that remain in the recently used map
   * @param timepoint Unix timestamp (seconds) to measure age against
   * @returns Array of media IDs still in the recently used movies map
   */
  getActiveRecentlyUsedMovieIds(timepoint: number): string[] {
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

  getRemainderTimeInSeconds(): number {
    return this.remainderTimeInSeconds;
  }

  setRemainderTimeInSeconds(value: number): void {
    this.remainderTimeInSeconds = value;
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
    this.recentlyUsedMovies.clear();
    this.recentlyUsedCommercials.clear();
    this.recentlyUsedShorts.clear();
    this.recentlyUsedMusic.clear();
    this.remainderTimeInSeconds = 0;
  }
}

// Singleton instance - created once and persists for the app lifetime
const streamManagerInstance = new StreamManager();

// All state is now held exclusively in the singleton instance.
// Module-level functions below proxy to the singleton for API compatibility.

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
) {
  // Placeholder — stream init is handled by buildContinuousStream today.
  // Future: consolidate init logic here.
}

/**
 * Populates onDeck with upcoming media blocks
 * Typically called when onDeck drops below a certain threshold
 */
export function initializeOnDeckStream(): void {
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

export function addItemToOnDeck(mediaBlocks: MediaBlock[]): void {
  streamManagerInstance.getOnDeck().push(...mediaBlocks);
}

export function removeFirstItemFromOnDeck(): MediaBlock | undefined {
  return streamManagerInstance.getOnDeck().shift();
}

/**
 * Records a movie to the recently_used_movies DB table after it has finished playing.
 * Called when a block is pruned from On Deck.
 * @param mediaBlock The block that just finished playing
 */
export function recordPlayedMovie(mediaBlock: MediaBlock): void {
  if (
    mediaBlock.anchorMedia &&
    mediaBlock.anchorMedia.type === MediaType.Movie
  ) {
    const db = getDB();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + TWO_DAYS_MS).toISOString();

    db.prepare(
      `INSERT INTO recently_used_movies (mediaItemId, expiresAt) VALUES (?, ?)`,
    ).run(mediaBlock.anchorMedia.mediaItemId, expiresAt);

    console.log(
      `[StreamManager] Recorded recently played movie: "${mediaBlock.anchorMedia.title}"`,
    );
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
export function loadRecentlyUsedMovies(timepoint: number): void {
  const db = getDB();
  const timepointISO = new Date(timepoint * 1000).toISOString();

  // Clean up expired rows
  db.prepare(`DELETE FROM recently_used_movies WHERE expiresAt <= ?`).run(
    timepointISO,
  );

  // Load non-expired movies into the in-memory map
  const rows = db
    .prepare(
      `SELECT mediaItemId, expiresAt FROM recently_used_movies WHERE expiresAt > ?`,
    )
    .all(timepointISO) as { mediaItemId: string; expiresAt: string }[];

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
export function recordPlayedEpisodeProgression(mediaBlock: MediaBlock): void {
  if (
    mediaBlock.anchorMedia &&
    mediaBlock.anchorMedia.type === MediaType.Episode
  ) {
    const episode = mediaBlock.anchorMedia as Episode;

    episodeProgressionRepository.upsertByShowAndStreamType(
      episode.showItemId,
      StreamType.Cont,
      episode.episodeNumber,
    );

    console.log(
      `[StreamManager] Recorded episode progression: "${episode.title}" (ep ${episode.episodeNumber}) for show ${episode.showItemId}`,
    );
  }
}

export function removeFirstItemFromUpcoming(): MediaBlock | undefined {
  return streamManagerInstance.getUpcoming().shift();
}

export function addToUpcomingStream(mediaBlocks: MediaBlock[]): void {
  streamManagerInstance.getUpcoming().push(...mediaBlocks);
}

export function getUpcomingStream(): MediaBlock[] {
  return streamManagerInstance.getUpcoming();
}

export function getOnDeckStream(): MediaBlock[] {
  return streamManagerInstance.getOnDeck();
}

export function getOnDeckStreamLength(): number {
  return streamManagerInstance.getOnDeck().length;
}

export function isContinuousStream(): boolean {
  return streamManagerInstance.isContinuous();
}

export function setContinuousStream(value: boolean): void {
  streamManagerInstance.setContinuous(value);
}

export function getContinuousStreamArgs(): IStreamRequest | null {
  return streamManagerInstance.getArgs();
}

export function setContinuousStreamArgs(value: IStreamRequest): void {
  streamManagerInstance.setArgs(value);
}

export function getStreamVariationInSeconds(): number {
  return streamManagerInstance.getVariance();
}

export function setStreamVariationInSeconds(value: number): void {
  streamManagerInstance.setVariance(value);
}

export function getStreamStatus(): StreamStatus {
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

export function stopContinuousStream(): void {
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

export function getActiveRecentlyUsedMovieIds(timepoint: number): string[] {
  return streamManagerInstance.getActiveRecentlyUsedMovieIds(timepoint);
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

export function getRemainderTimeInSeconds(): number {
  return streamManagerInstance.getRemainderTimeInSeconds();
}

export function setRemainderTimeInSeconds(value: number): void {
  streamManagerInstance.setRemainderTimeInSeconds(value);
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
