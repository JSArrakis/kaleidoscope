import { MediaBlock } from '../models/mediaBlock';
import { constructStream } from './streamConstructor';
import { Config } from '../models/config';
import { addMediaBlock, setVLCClient } from './backgroundService';
import { IStreamRequest } from '../models/streamRequest';
import { StreamType } from '../models/enum/streamTypes';
import moment from 'moment';
import { BaseMedia } from '../models/mediaInterface';
import { Tag } from '../models/tag';
import { createBuffer } from './bufferEngine';
import { getActiveHolidaysFromDB } from './holidayService';
import { facetRepository } from '../repositories/facetRepository';
import { tagRepository } from '../repositories/tagsRepository';
import {
  gatherCandidatesForFacet,
  pickMediaCandidate,
  PickMediaFromFacet,
} from '../prisms/refract';
import { on } from 'node:events';
import { createVLCClient } from './vlcClient';
import { Episode, Show } from '../models/show';
import { Movie } from '../models/movie';

let upcomingStream: MediaBlock[] = [];
let onDeck: MediaBlock[] = [];
let continuousStream = false;
let args: IStreamRequest;
let streamVarianceInSeconds = 0;

// Helper function to convert tag names to Tag objects
function getTagByName(tagName: string): Tag | null {
  return tagRepository.findByName(tagName);
}

function getTagsByNames(tagNames: string[]): Tag[] {
  return tagNames
    .map(name => getTagByName(name))
    .filter((tag): tag is Tag => tag !== null);
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

  const now = moment().unix();
  let endTime: number;
  // const nextProgrammingBlock = getNextProgrammingBlock();
  if (streamType === StreamType.Cont) {
    endTime = moment().endOf('day').unix();
  } else {
    endTime = streamArgs.EndTime || moment().endOf('day').unix();
  }
  const minutes = moment.unix(now).minute();
  const targetMinute = minutes < 30 ? 30 : 60;
  const nextMark = moment
    .unix(now)
    .clone()
    .minute(targetMinute === 60 ? 0 : 30)
    .second(0);
  if (targetMinute === 60) {
    nextMark.add(1, 'hour');
  }
  const alignedTime = nextMark.unix();

  // Step 2: Find the first facet of the first piece of media from existing facets in DB randomly
  const startingFacet = facetRepository.selectValidRandomFacetCombo(
    config.interval,
  );
  if (!startingFacet) {
    return 'No valid genre/aesthetic combinations found with available media in facets database';
  }

  // Step 3: Select the first show or movie for the first media block
  const firstMedia = PickMediaFromFacet(startingFacet, streamType);
  if (!firstMedia) {
    return `No media found with genre ${startingFacet.genre.name} and aesthetic ${startingFacet.aesthetic.name}`;
  }

  // Step 4: Create an initial buffer if there is time between now and the first time point
  if (cadence && alignedTime > now) {
    const bufferDuration = alignedTime - now;

    // Create buffer using starting facet tags from the selected media
    const halfATags: Tag[] = [];
    const halfBTags = getTagsByNames([
      startingFacet.genre.name,
      startingFacet.aesthetic.name,
    ]);
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

    onDeck.push(initialBufferBlock);

    // Set the VLC client to the client created with the password from the request
    // If VLC isnt already running, it will start VLC
    setVLCClient(await createVLCClient(getContinuousStreamArgs().Password));
  } else if (!cadence) {
    onDeck.push(
      new MediaBlock(
        [], // buffer
        firstMedia, // episode or movie
        now, // startTime
      ),
    );
    setVLCClient(await createVLCClient(getContinuousStreamArgs().Password));
  }

  const constructedStream: [MediaBlock[], string] = constructStream(
    config,
    streamArgs,
    StreamType.Cont,
    alignedTime > now ? alignedTime : now, // Start construction at aligned time or now
    false, // alignStart is false since we handled alignment here
    firstMedia, // Pass the selected first media
  );

  if (constructedStream[1] !== '') {
    return constructedStream[1];
  }

  upcomingStream.push(...constructedStream[0]);

  return '';
}

function initializeOnDeckStream(): void {
  for (let i = 0; i < 2; i++) {
    if (upcomingStream.length > 0) {
      let selectedObject = upcomingStream.shift();
      if (selectedObject != null || selectedObject != undefined) {
        onDeck.push(selectedObject);
      }
    }
  }
}

function addToOnDeckStream(mediaBlocks: MediaBlock[]): void {
  onDeck.push(...mediaBlocks);
}

function removeFromOnDeckStream(): MediaBlock | undefined {
  return onDeck.shift();
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
    hasUpcomingStream: upcomingStream.length > 0,
    onDeckLength: onDeck.length,
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
  onDeck = [];
  // Note: VLC client cleanup should be handled separately
}

async function addInitialMediaBlocks() {
  for (const item of onDeck) {
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
