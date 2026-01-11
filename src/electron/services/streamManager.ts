import { MediaBlock } from "../types/MediaBlock.js";
import { createStream } from "./streamConstructor.js";
import { StreamType } from "../types/StreamType.js";
import { IStreamRequest } from "../types/StreamRequest.js";
import { getUnixTime } from "date-fns";
import * as VLCService from "./vlcService.js"; // TODO: Implement or replace with Electron player
import { findNextCadenceTime } from "../utils/common.js";

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
    console.log("[StreamManager] State reset");
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
  streamType: StreamType = StreamType.Cont
): Promise<string> {
  try {
    setContinuousStreamArgs(streamArgs);
    setContinuousStream(true);

    const now = getUnixTime(new Date());
    const alignedTime = findNextCadenceTime(now);

    // TODO: Implement firstMedia selection via refract system
    // For now, pass undefined and let stream constructor handle it
    const [constructedBlocks, error] = await createStream(
      streamType,
      {
        Cadence: streamArgs.Cadence || false,
        Themed: streamArgs.Themed || false,
      },
      alignedTime > now ? alignedTime : now
    );

    if (error) {
      return error;
    }

    // Add initial blocks to onDeck
    onDeck.push(...constructedBlocks.slice(0, 2));

    // Add remaining to upcoming
    upcoming.push(...constructedBlocks.slice(2));

    // TODO: Initialize VLC or Electron player
    // await VLCService.initializeVLCService(streamArgs.Password);
    // await addInitialMediaBlocks();
    // await VLCService.playVLC();

    console.log(
      `[StreamManager] Stream initialized: ${onDeck.length} on deck, ${upcoming.length} upcoming`
    );
    return "";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[StreamManager] Stream initialization failed: ${message}`);
    return message;
  }
}

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
