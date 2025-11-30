import { MediaBlock } from '../models/mediaBlock';
import { constructStream } from './streamConstructor';
import { Config } from '../models/config';
import { IStreamRequest } from '../models/streamRequest';
import { StreamType } from '../models/enum/streamTypes';
import moment from 'moment';
import { Tag } from '../models/tag';
import { Movie } from '../models/movie';
import { Episode } from '../models/show';
import { createBuffer } from './bufferEngine';
import { getActiveHolidaysFromDB } from './holidayService';
import { facetRepository } from '../repositories/facetRepository';
import { tagRepository } from '../repositories/tagsRepository';
import { movieRepository } from '../repositories/movieRepository';
import { showRepository } from '../repositories/showRepository';
import { GetNextEpisode } from './progressionManager';
import { PickMediaFromFacet } from '../prisms/refract';
import * as vlcService from './vlcService';
import { findNextCadenceTime } from '../utils/common';

let upcoming: MediaBlock[] = [];
let onDeck: MediaBlock[] = [];
let continuousStream = false;
let args: IStreamRequest;
let streamVarianceInSeconds = 0;
let startOfDay: number;

// Helper function to convert tag names to Tag objects
function getTagByName(tagName: string): Tag | null {
  return tagRepository.findByName(tagName);
}

function getTagsByNames(tagNames: string[]): Tag[] {
  return tagNames
    .map(name => getTagByName(name))
    .filter((tag): tag is Tag => tag !== null);
}

// Helper function to pick a random show or movie from the database
// Flips a coin to decide between show and movie, then returns a random one
// Accounts for cases where one type may not have any entries in the database
// Respects show progression to return the appropriate episode for the stream type
function getRandomShowOrMovie(streamType: StreamType): Movie | Episode | null {
  // Check how many shows and movies exist
  const showCount = showRepository.count();
  const movieCount = movieRepository.count();

  // If neither exists, return null
  if (showCount === 0 && movieCount === 0) {
    return null;
  }

  // If only one type exists, use that
  if (showCount === 0) {
    return movieRepository.findRandomMovie();
  }
  if (movieCount === 0) {
    const randomShow = showRepository.findRandomShow();
    if (randomShow) {
      // Use progressionManager to get the next episode based on show progression
      return GetNextEpisode(randomShow, streamType);
    }
    return null;
  }

  // Both types exist, flip a coin
  const coinFlip = Math.random() < 0.5; // true = show, false = movie

  if (coinFlip) {
    const randomShow = showRepository.findRandomShow();
    if (randomShow) {
      // Use progressionManager to get the next episode based on show progression
      return GetNextEpisode(randomShow, streamType);
    }
    // Fall back to a random movie if something unexpected happens
    return movieRepository.findRandomMovie();
  } else {
    return movieRepository.findRandomMovie();
  }
}

async function initializeStream(
  config: Config,
  streamArgs: IStreamRequest,
  streamType: StreamType,
  cadence: boolean = false,
): Promise<string> {
  // Constructs the stream based on the config, continuous stream args, and available media
  // The stream is assigned to upcoming stream which the background service will use to populate the on deck stream
  // The stream is constructed to fill the time until 12:00am
  // The background service will run construct stream again 30 minutes before the end of the day to fill the time until 12:00am the next day
  // Step 1: Find the first time point where a media block happens (:00 or :30)

  const now: number = moment().unix();
  let endTime: number;
  // const nextProgrammingBlock = getNextProgrammingBlock();
  if (streamType === StreamType.Cont) {
    endTime = moment().endOf('day').unix();
  } else {
    endTime = streamArgs.EndTime || moment().endOf('day').unix();
  }

  const alignedTime = findNextCadenceTime(now);

  // Step 2: Pick a random show or movie from the database
  const firstMedia = getRandomShowOrMovie(streamType);
  if (!firstMedia) {
    return 'No movies or shows found in the database';
  }

  let initialMediaBlock: MediaBlock | undefined;

  // Step 4: Create an initial buffer if there is time between now and the first time point
  if (cadence && alignedTime > now) {
    const bufferDuration = alignedTime - now;

    // Create buffer using tags from the selected media
    const halfATags: Tag[] = [];
    const halfBTags = firstMedia.tags || [];
    const activeHolidayTags = getActiveHolidaysFromDB();

    const bufferResult = createBuffer(
      bufferDuration,
      halfATags,
      halfBTags,
      activeHolidayTags,
    );

    // Step 5: Push that first initial buffer as a media block without a main show or movie
    const initialBufferBlock = new MediaBlock(
      bufferResult.buffer, // buffer
      undefined, // mainBlock (no main media for buffer-only block)
      now, // startTime
    );

    initialMediaBlock = initialBufferBlock;
  } else if (!cadence) {
    initialMediaBlock = new MediaBlock(
      [], // buffer
      firstMedia as Movie | Episode, // episode or movie
      now, // startTime
    );
  }

  if (initialMediaBlock !== undefined) {
    onDeck.push(initialMediaBlock);
  } else {
    return 'Failed to create initial media block for stream initialization';
  }

  // Add media to VLC playlist and start playback immediately so there is less delay
  // between "now" and when media starts playing.
  // This is to reduce to timing drift, so we dont have correct alignment later.

  // TODO Create Module for this and put it in a switch for upcoming integrations with
  // Plex and Jellyfin
  await vlcService.initializeVLCService(getContinuousStreamArgs().Password);
  await addInitialMediaBlocks();
  await vlcService.playVLC();

  const constructedStream: [MediaBlock[], string] = constructStream(
    StreamType.Cont,
    alignedTime > now ? alignedTime : now, // Start construction at aligned time or now
    cadence,
    firstMedia, // Pass the selected first media
  );

  if (constructedStream[1] !== '') {
    return constructedStream[1];
  }

  upcoming.push(...constructedStream[0]);

  return '';
}

function initializeOnDeckStream(): void {
  for (let i = 0; i < 2; i++) {
    if (upcoming.length > 0) {
      let selectedObject = upcoming.shift();
      if (selectedObject != null || selectedObject != undefined) {
        onDeck.push(selectedObject);
      }
    }
  }
}

function addItemToOnDeck(mediaBlocks: MediaBlock[]): void {
  onDeck.push(...mediaBlocks);
}

function removeFirstItemFromOnDeck(): MediaBlock | undefined {
  return onDeck.shift();
}

function removeFirstItemFromUpcoming(): MediaBlock | undefined {
  return upcoming.shift();
}

function addToUpcomingStream(mediaBlocks: MediaBlock[]): void {
  upcoming.push(...mediaBlocks);
}

function getUpcomingStream(): MediaBlock[] {
  return upcoming;
}

function getOnDeckStream(): MediaBlock[] {
  return onDeck;
}

function getOnDeckStreamLength(): number {
  return onDeck.length;
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
    hasUpcomingStream: upcoming.length > 0,
    onDeckLength: onDeck.length,
    upcomingLength: upcoming.length,
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
  upcoming = [];
  onDeck = [];
  // Note: VLC client cleanup should be handled separately
}

async function addInitialMediaBlocks() {
  for (const item of onDeck) {
    await vlcService.addMediaBlockToPlaylist(item);
  }
}

export {
  initializeStream,
  initializeOnDeckStream,
  addItemToOnDeck,
  removeFirstItemFromOnDeck,
  addToUpcomingStream,
  getUpcomingStream,
  getOnDeckStream,
  getOnDeckStreamLength,
  isContinuousStream,
  setContinuousStream,
  getContinuousStreamArgs,
  setContinuousStreamArgs,
  addInitialMediaBlocks,
  removeFirstItemFromUpcoming,
  setStreamVariationInSeconds,
  getStreamVariationInSeconds,
  getStreamStatus,
  stopContinuousStream,
};
