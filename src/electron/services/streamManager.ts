import { MediaBlock } from "../types/MediaBlock.js";
import { constructStream } from "./streamConstructor.js";
import { StreamType } from "../types/StreamType.js";
import { IStreamRequest } from "../types/StreamRequest.js";
import moment from "moment";
import * as VLCService from "./vlcService.js"; // TODO: Implement or replace with Electron player

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
  cadence: boolean = false
): Promise<string> {
  try {
    setContinuousStreamArgs(streamArgs);
    setContinuousStream(true);

    const now = moment().unix();
    const alignedTime = findNextCadenceTime(now);

    // TODO: Implement firstMedia selection via refract system
    // For now, pass undefined and let stream constructor handle it
    const [constructedBlocks, error] = constructStream(
      streamType,
      alignedTime > now ? alignedTime : now,
      cadence
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
 * Finds the next cadence time (00:00 or 30:00 of each minute)
 * Used for aligning media blocks to consistent time boundaries
 */
function findNextCadenceTime(now: number): number {
  const nowMoment = moment.unix(now);
  const minutes = nowMoment.minute();
  const seconds = nowMoment.second();

  // If we're already past :30, next cadence is at :00 of next minute
  if (minutes % 1 === 0 && seconds >= 30) {
    return nowMoment.clone().add(1, "minute").startOf("minute").unix();
  }

  // If we're before :30, next cadence is at :30 of current minute
  if (seconds < 30) {
    return nowMoment.clone().minute(minutes).second(30).unix();
  }

  // Otherwise next cadence is at :00 of next minute
  return nowMoment.clone().add(1, "minute").startOf("minute").unix();
}
