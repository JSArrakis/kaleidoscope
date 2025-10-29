import moment from 'moment';
import * as fs from 'fs';
import { constructStream } from './streamConstructor';
import * as streamMan from './streamManager';
import { MediaBlock } from '../models/mediaBlock';
import * as VLC from 'vlc-client';
import { ContStreamRequest } from '../models/streamRequest';
import { StreamType } from '../models/enum/streamTypes';
import { getStreamType } from './mediaService';
import { getConfig } from '../config/configService';

const intervalInSeconds: number = 300;
let vlc: VLC.Client;
let endOfDayMarker: number = 0;
let tomorrow: number = 0;
let initialStart: boolean = true;
let currentHolidays: string[] = []; // This will hold the current holidays, if any
let cachedTimedMediaItems: TimedMediaItem[] = []; // Global cache of timed media items

function calculateDelayToNextInterval(intervalInSeconds: number): number {
  // Get the current Unix timestamp
  const now = moment().unix();
  console.log(`Current Unix Timestamp: ${now}`);
  // Calculate the seconds until the next interval
  // The interval in seconds equals 5 minutes (300 seconds)
  const secondsToNextInterval = intervalInSeconds - (now % intervalInSeconds);
  console.log(`Seconds to next interval: ${secondsToNextInterval}`);
  return secondsToNextInterval * 1000; // Convert seconds to milliseconds
}

function setEndOfDayMarker() {
  endOfDayMarker = moment().set({ hour: 23, minute: 30, second: 0 }).unix();
}

function setTomorrow() {
  tomorrow = moment()
    .add(1, 'days')
    .set({ hour: 0, minute: 0, second: 0 })
    .unix();
}

interface TimedMediaItem {
  path: string;
  title: string;
  startTime: number;
  mediaType: 'initialBuffer' | 'mainBlock' | 'buffer';
  blockTitle: string;
}

function rebuildTimedMediaItemsCache(): void {
  // Clear the existing cache
  cachedTimedMediaItems = [];

  // Get items from on deck stream to analyze
  const onDeck: MediaBlock[] = streamMan.getOnDeckStream();

  // Convert MediaBlocks to individual timed media items
  onDeck.forEach(mediaBlock => {
    if (!mediaBlock.startTime) return;

    let currentTime = mediaBlock.startTime;
    const blockTitle = mediaBlock.featureMedia?.title || 'Unknown Block';

    // Add initial buffer items
    if (mediaBlock.initialBuffer && mediaBlock.initialBuffer.length > 0) {
      mediaBlock.initialBuffer.forEach(bufferItem => {
        cachedTimedMediaItems.push({
          path: bufferItem.path,
          title: bufferItem.title,
          startTime: currentTime,
          mediaType: 'initialBuffer',
          blockTitle: blockTitle,
        });
        currentTime += bufferItem.duration;
      });
    }

    // Add main block
    if (mediaBlock.featureMedia) {
      cachedTimedMediaItems.push({
        path: mediaBlock.featureMedia.path,
        title: mediaBlock.featureMedia.title,
        startTime: currentTime,
        mediaType: 'mainBlock',
        blockTitle: blockTitle,
      });
      currentTime += mediaBlock.featureMedia.duration;
    }

    // Add post buffer items
    if (mediaBlock.buffer && mediaBlock.buffer.length > 0) {
      mediaBlock.buffer.forEach(bufferItem => {
        cachedTimedMediaItems.push({
          path: bufferItem.path,
          title: bufferItem.title,
          startTime: currentTime,
          mediaType: 'buffer',
          blockTitle: blockTitle,
        });
        currentTime += bufferItem.duration;
      });
    }
  });

  console.log(
    `[Media Cache] Rebuilt cache with ${cachedTimedMediaItems.length} timed media items`,
  );
}

function validateUpcomingMediaFiles(currentUnixTimestamp: number): void {
  // Get the time window for validation (current time + interval)
  const validationEndTime = currentUnixTimestamp + intervalInSeconds;

  // Filter cached items that should start within the current interval
  const upcomingItems = cachedTimedMediaItems.filter(
    item =>
      item.startTime >= currentUnixTimestamp &&
      item.startTime <= validationEndTime,
  );

  // Validate each upcoming media file
  upcomingItems.forEach(item => {
    try {
      // TODO: When a file is missing we need to add or rearrange buffers to cover the missing file
      // to keep the stream seamless
      // If it is a show that is missing we will have to add more shorts or music videos than we previously would for a normal buffer to fill the time
      // If it is a movie that is missing we should fill as much as we can with shows at the proper time points (:00 or :30) keeping in mind to stick to the same tags that the movie had.
      // If there are no shows that have the same tags use facets and find the closest facet distance matching and the closest age group etc until the gap is filled.
      // The first 30 minutes will have to be just on theme shorts and music videos with an appropriate smattering of commercials. This is due to the media block already starting. And commercial run time would have already started.
      // So the goal is to just keep everything on the time point. We have some time to reconfigure the stream to account for the new gap because the buffer that was meant to play after the missing media should be playing now in sequence.
      // But we should also do an emergency check of all the buffer media in this block to make sure there arent any more gaps that need to be addressed.
      if (!fs.existsSync(item.path)) {
        console.log(
          `TODO: Set adjustments on missing file - ${item.mediaType}: "${item.title}" ` +
            `from block "${item.blockTitle}" at path: ${item.path} ` +
            `(scheduled for ${new Date(item.startTime * 1000).toISOString()})`,
        );
      }
    } catch (error) {
      console.log(
        `TODO: Set adjustments on missing file - Error checking ${item.mediaType}: "${item.title}" ` +
          `from block "${item.blockTitle}" at path: ${item.path} ` +
          `(Error: ${error})`,
      );
    }
  });

  // Log validation summary if there were upcoming items
  if (upcomingItems.length > 0) {
    console.log(
      `[Media Validation] Checked ${upcomingItems.length} media files scheduled for next ${intervalInSeconds}s interval`,
    );
  }
}

async function cycleCheck() {
  // BACKGROUND SERVICE OPERATIONS:
  // - Monitors and manages current/ondeck playlists for ALL stream types (continuous, adhoc, block)
  // - Transitions media blocks at scheduled times for ALL stream types
  // - Generates next day's stream ONLY for continuous streams (adhoc streams end and stop)

  // Get the current Unix timestamp
  const currentUnixTimestamp = moment().unix();
  console.log(`Current Unix Timestamp: ${currentUnixTimestamp}`);

  // Validate upcoming media files that should play within the next interval
  validateUpcomingMediaFiles(currentUnixTimestamp);

  // Gets the items currently loaded into the on deck array
  let onDeck: MediaBlock[] = streamMan.getOnDeckStream();

  // Logging statement to show when the next item in the on deck stream is scheduled to start
  if (onDeck.length >= 2) {
    console.log('Target Unix Timestamp: ' + onDeck[1].startTime);
  } else {
    console.log(
      'There arent enough items in the on deck stream to check for a new item',
    );
  }

  // Logging statement to display that the next item from the ondeck stream should be starting now
  if (onDeck.length >= 1 && currentUnixTimestamp === onDeck[0].startTime) {
    console.log(onDeck[0].featureMedia?.title + ' is starting now');
  }

  // This is the mechanism that will remove the first item from the on deck stream and add the next item from the upcoming stream
  // This operation will only initiate if the stream is continuous and there are at least 2 items in the on deck stream
  if (streamMan.isContinuousStream() && onDeck.length > 1) {
    // If there is a second item in the on deck stream and the current time is greater than or equal to the start time of the second item
    if (onDeck[1].startTime && currentUnixTimestamp >= onDeck[1].startTime) {
      // Remove the first item from the on deck stream
      let removed = streamMan.removeFromOnDeckStream();
      // Logs the item that was removed from the on deck stream
      if (removed != null || removed != undefined) {
        console.log(
          'Removing ' +
            removed.featureMedia?.title +
            ' and post buffer from On Deck Stream',
        );
      }
      // Gets amd removes the first item from the upcoming stream
      let added = streamMan.removeFromUpcomingStream();

      // Logs the item that will be added to the on deck stream
      if (added != null || added != undefined) {
        console.log(
          'Adding ' + added.featureMedia?.title + ' to On Deck Stream',
        );
      }
      // If the item is not null or undefined, add it to the on deck stream and the VLC playlist
      if (added != null || added != undefined) {
        // The item must be in an array to be added to the on deck stream (to reuse the addToOnDeckStream function)
        streamMan.addToOnDeckStream([added]);
        // Rebuild the timed media items cache since the on deck stream changed
        rebuildTimedMediaItemsCache();
        // Adds the block (the media item and its buffer) to the VLC playlist
        await addMediaBlock(added);
      }
    }
  }

  // If the current Unix timestamp is greater than or equal to the tomorrow marker, set the tomorrow marker to the new value (being the next instance of 12:00am)
  if (currentUnixTimestamp >= tomorrow) {
    setTomorrow();
  }

  // Prepares the next day's stream if the current Unix timestamp is greater than or equal to the end of day marker
  if (currentUnixTimestamp >= endOfDayMarker) {
    // Sets the new end of day marker to the next instance of 11:30pm (this is important to ensure this operation does not run multiple times in a day)
    setEndOfDayMarker();

    // Generate next day's stream ONLY for continuous streams
    // Adhoc streams run until their scheduled end time and then stop - no next day generation needed
    const currentStreamType = getStreamType();
    if (currentStreamType === StreamType.Cont) {
      //
      // Get the current continuous stream arguments from the stream service
      let continuousStreamArgs: ContStreamRequest =
        streamMan.getContinuousStreamArgs();
      // Create a new StreamArgs object with the same password as the current continuous stream arguments
      // This piece is here for future development to allow for different arguments for the next day's stream if we so choose
      // Create a safer copy of the continuous args for tomorrow. Many of these
      // fields may be empty when the continuous endpoint is password-only,
      // so default to empty arrays or existing values to avoid crashes.
      let tomorrowsContinuousStreamArgs = new ContStreamRequest(
        continuousStreamArgs.Password,
      );
      tomorrowsContinuousStreamArgs.Title =
        continuousStreamArgs.Title || 'Default';
      tomorrowsContinuousStreamArgs.Env = continuousStreamArgs.Env || 'default';
      tomorrowsContinuousStreamArgs.Movies = continuousStreamArgs.Movies || [];
      tomorrowsContinuousStreamArgs.Tags = continuousStreamArgs.Tags || [];
      tomorrowsContinuousStreamArgs.MultiTags =
        continuousStreamArgs.MultiTags || [];
      tomorrowsContinuousStreamArgs.Blocks = continuousStreamArgs.Blocks || [];
      tomorrowsContinuousStreamArgs.StartTime = tomorrow;
      // Constructs the stream for the next day and adds it to the upcoming stream
      const stream: [MediaBlock[], string] = constructStream(
        getConfig(),
        tomorrowsContinuousStreamArgs,
        getStreamType(),
        tomorrow, // Pass the calculated tomorrow time
        false, // No alignment needed for next day's stream
      );
      // Add tomorrow's stream to the upcoming stream buffer (not on-deck to prevent memory issues)
      // This ensures continuous operation while keeping the on-deck stream limited to 2 items
      streamMan.addToUpcomingStream(stream[0]);
      // Note: We don't rebuild cache here since tomorrow's stream goes to upcoming, not on-deck
    }
  }

  // Calculate the delay until the next interval mark and set it as the new interval
  // Intervals will always be set to the next 5 minute mark based on the world clock (i.e. 12:00:00, 12:05:00, 12:10:00, etc.)
  const nextDelay = calculateDelayToNextInterval(intervalInSeconds);
  setTimeout(cycleCheck, nextDelay);
}

function startBackgroundProcess() {
  console.log('Starting background process');
  // Initialize the timed media items cache
  rebuildTimedMediaItemsCache();
  // Start the initial check after a delay
  const initialDelay = calculateDelayToNextInterval(intervalInSeconds);
  setTimeout(cycleCheck, initialDelay);
}

function setVLCClient(client: VLC.Client) {
  vlc = client;
}

async function playVLC() {
  try {
    // vlc.next() plays the next item in the playlist, which is the first item in the playlist as it is not already playing
    await vlc.next();
  } catch (error) {
    console.error('An error occurred when playing stream:', error);
  }
}

async function addMediaBlock(item: MediaBlock | undefined): Promise<void> {
  if (item != null || item != undefined) {
    try {
      //If item has a initial Buffer (buffer that plays before the media), add it to the playlist
      // initial buffers are only when launching the stream to make sure the first media item starts at the next 30 minute interval

      // Adds the main media item to the vlc playlist
      if (
        item.featureMedia?.path != null ||
        item.featureMedia?.path != undefined
      ) {
        console.log('Adding ' + item.featureMedia.title + ' to playlist');
        await vlc.addToPlaylist(item.featureMedia.path);
      }

      //If item has a post Buffer (buffer that plays after the media), add it to the playlist
      item.buffer.forEach(async element => {
        await vlc.addToPlaylist(element.path);
      });
    } catch (error) {
      console.error('An error occurred when adding to Playlist:', error);
    }
  } else {
    console.log('Item was null or undefined');
  }
}

function getVLCStatus(): any {
  if (!vlc) {
    return { connected: false, error: 'VLC client not initialized' };
  }

  try {
    return {
      connected: true,
      client: !!vlc,
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown VLC error',
    };
  }
}

export {
  cycleCheck,
  startBackgroundProcess,
  setVLCClient,
  playVLC,
  addMediaBlock,
  calculateDelayToNextInterval,
  setEndOfDayMarker,
  setTomorrow,
  getVLCStatus,
  validateUpcomingMediaFiles,
  rebuildTimedMediaItemsCache,
};
