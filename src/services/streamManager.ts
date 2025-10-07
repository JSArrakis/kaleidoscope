import { MediaBlock } from '../models/mediaBlock';
import { constructStream } from './streamConstructor';
import { Config } from '../models/config';
import { Media } from '../models/media';
import { addMediaBlock } from './backgroundService';
import { IStreamRequest } from '../models/streamRequest';
import { StreamType } from '../models/enum/streamTypes';
import { Mosaic } from '../models/mosaic';

let upcomingStream: MediaBlock[] = [];
let onDeckStream: MediaBlock[] = [];
let continuousStream = false;
let args: IStreamRequest;
let streamVarianceInSeconds = 0;

function initializeStream(
  config: Config,
  streamArgs: IStreamRequest,
  media: Media,
  mosaics: Mosaic[],
  streamType: StreamType,
  alignStart: boolean = false,
): string {
  // Constructs the stream based on the config, continuous stream args, and available media
  // The stream is assigned to upcoming stream which the background service will use to populate the on deck stream
  // The stream is constructed to fill the time until 12:00am
  // The background service will run construct stream again 30 minutes before the end of the day to fill the time until 12:00am the next day
  let upcomingStreamResponse: [MediaBlock[], string] = constructStream(
    config,
    streamArgs,
    media,
    mosaics,
    streamType,
    undefined,
    alignStart,
  );
  if (upcomingStreamResponse[1] !== '') {
    return upcomingStreamResponse[1];
  }
  upcomingStream = upcomingStreamResponse[0];
  return '';
}

function initializeOnDeckStream(): void {
  for (let i = 0; i < 2; i++) {
    if (upcomingStream.length > 0) {
      let selectedObject = upcomingStream.shift();
      if (selectedObject != null || selectedObject != undefined) {
        onDeckStream.push(selectedObject);
      }
    }
  }
}

function addToOnDeckStream(mediaBlocks: MediaBlock[]): void {
  onDeckStream.push(...mediaBlocks);
}

function removeFromOnDeckStream(): MediaBlock | undefined {
  return onDeckStream.shift();
}

function removeFromUpcomingStream(): MediaBlock | undefined {
  return upcomingStream.shift();
}

function addToUpcomingStream(mediaBlocks: MediaBlock[]): void {
  upcomingStream.push(...mediaBlocks);
}

function getUpcomingStream(): MediaBlock[] {
  return upcomingStream;
}

function getOnDeckStream(): MediaBlock[] {
  return onDeckStream;
}

function getOnDeckStreamLength(): number {
  return onDeckStream.length;
}

function isContinuousStream(): boolean {
  return continuousStream;
}

function setContinuousStream(value: boolean): void {
  continuousStream = value;
}

function getContinuousStreamArgs(): IStreamRequest {
  return args;
}

function setContinuousStreamArgs(value: IStreamRequest): void {
  args = value;
}

function getStreamVariationInSeconds(): number {
  return streamVarianceInSeconds;
}

function setStreamVariationInSeconds(value: number): void {
  streamVarianceInSeconds = value;
}

function getStreamStatus() {
  return {
    isContinuous: continuousStream,
    hasUpcomingStream: upcomingStream.length > 0,
    onDeckLength: onDeckStream.length,
    upcomingLength: upcomingStream.length,
    streamArgs: args
      ? {
          title: args.Title,
          env: args.Env,
          hasPassword: !!args.Password,
        }
      : null,
  };
}

function stopContinuousStream(): void {
  continuousStream = false;
  upcomingStream = [];
  onDeckStream = [];
  // Note: VLC client cleanup should be handled separately
}

async function addInitialMediaBlocks() {
  for (const item of onDeckStream) {
    await addMediaBlock(item);
  }
}

export {
  initializeStream,
  initializeOnDeckStream,
  addToOnDeckStream,
  removeFromOnDeckStream,
  addToUpcomingStream,
  getUpcomingStream,
  getOnDeckStream,
  getOnDeckStreamLength,
  isContinuousStream,
  setContinuousStream,
  getContinuousStreamArgs,
  setContinuousStreamArgs,
  addInitialMediaBlocks,
  removeFromUpcomingStream,
  setStreamVariationInSeconds,
  getStreamVariationInSeconds,
  getStreamStatus,
  stopContinuousStream,
};
