import { endOfDay } from "date-fns";
import { tagRepository } from "../../repositories/tagsRepository.js";
import { findNextCadenceTime, segmentTags } from "../../utils/common.js";

import { recentlyUsedMediaRepository } from "../../repositories/recentlyUsedMediaRepository.js";
import { createBuffer } from "../bufferConstructor.js";
import * as playerManager from "../playerManager.js";
import * as streamManager from "../streamManager.js";
import { createMediaBlock } from "../../../../factories/mediaBlock.factory.js";
import { MediaBlock } from "../../types/MediaBlock.js";
import {
  getDateString,
  getProgressionsByStreamType,
  isHolidayDate,
  isHolidaySeason,
} from "./selectionHelpers.js";
import { selectThemedMedia } from "./mediaSelector.js";
import { selectRandomShowOrMovie } from "./mediaSelector.js";

/**
 * Builds a continuous stream
 * Constructs media blocks from startTimepoint until end of day
 * Supports Cadenced and UnCadenced modes with Themed and Random selection
 *
 * Continuous streams are meant to run indefinitely, repeating daily
 *
 * MODES:
 * - Cadence TRUE: Uses buffers to align anchor media to :00/:30 marks
 * - Cadence FALSE: Back-to-back media with no buffers
 * - Themed TRUE: Uses prisms/facets/holiday system for selection
 * - Themed FALSE: Random media selection
 *
 * @param streamConstructionOptions Configuration for stream (Cadence, Themed, etc)
 * @param startTimepoint Unix timestamp in seconds (usually current time)
 * @returns Tuple of [MediaBlock[], errorMessage]
 */
export async function buildContinuousStream(
  streamConstructionOptions: StreamConstructionOptions,
  startTimepoint: number,
): Promise<[MediaBlock[], string]> {
  const streamBlocks: MediaBlock[] = [];
  const constructionStartTime = Date.now();
  let mediaBlocks: MediaBlock[] = [];

  try {
    // Initialize stream data
    const initData = initializeContinuousStream(
      startTimepoint,
      streamConstructionOptions,
    ); // VERIFIED

    if (!initData.selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    const dateString = getDateString(startTimepoint); // VERIFIED
    const todayIsHolidayDate = isHolidayDate(
      startTimepoint,
      initData.activeHolidayTags,
    ); // VERIFIED
    const todayIsHolidaySeason = isHolidaySeason(
      startTimepoint,
      initData.activeHolidayTags,
    ); // VERIFIED

    if (streamConstructionOptions.Cadence) {
      // CADENCED MODE: Use buffers and align to :00/:30 marks
      mediaBlocks = await buildCadencedContinuousStream(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
        constructionStartTime,
      );
    } else {
      return [[], "Uncadenced continuous streams not yet implemented"];
    }

    streamBlocks.push(...mediaBlocks);

    console.log(
      `[ContinuousStreamBuilder] Created ${streamBlocks.length} media blocks`,
    );
    return [streamBlocks, ""];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[ContinuousStreamBuilder] Stream construction failed: ${message}`,
    );
    return [[], message];
  }
}

/**
 * Initializes stream with necessary data
 * Calculates end-of-day timestamp, loads active holidays, gets progression map, selects first media
 */
function initializeContinuousStream(
  incomingTimepoint: number,
  streamConstructionOptions: StreamConstructionOptions,
): StreamInitializationData {
  const fullDateString = new Date(incomingTimepoint * 1000)
    .toISOString()
    .substring(0, 10); // Get only YYYY-MM-DD

  // Get all recently used media to from DB
  const recentlyUsedMedia: RecentlyUsedMedia[] =
    recentlyUsedMediaRepository.findAll();
  for (const media of recentlyUsedMedia) {
    if (media.mediaType === MediaType.Movie) {
      if (media.lastUsedDate) {
        const unixTime = Math.floor(
          new Date(media.lastUsedDate).getTime() / 1000,
        );
        // only add movies if theyve been used in the last 48 hours (configurable?)
        if (unixTime >= incomingTimepoint - 48 * 3600) {
          streamManager.addRecentlyUsedMovie(media.mediaItemId, unixTime);
        }
      }
    }
    if (media.mediaType === MediaType.Commercial) {
      if (media.lastUsedDate) {
        const unixTime = Math.floor(
          new Date(media.lastUsedDate).getTime() / 1000,
        );
        // only add commercials if theyve been used in the last 3 hours (configurable?)
        if (unixTime >= incomingTimepoint - 3 * 3600) {
          streamManager.addRecentlyUsedCommercial(media.mediaItemId, unixTime);
        }
      }
    }
    if (media.mediaType === MediaType.Short) {
      if (media.lastUsedDate) {
        const unixTime = Math.floor(
          new Date(media.lastUsedDate).getTime() / 1000,
        );
        // only add shorts if theyve been used in the last 24 hours (configurable?)
        if (unixTime >= incomingTimepoint - 24 * 3600) {
          streamManager.addRecentlyUsedShort(media.mediaItemId, unixTime);
        }
      }
    }
    if (media.mediaType === MediaType.Music) {
      if (media.lastUsedDate) {
        const unixTime = Math.floor(
          new Date(media.lastUsedDate).getTime() / 1000,
        );
        // only add music if theyve been used in the last 24 hours (configurable?)
        if (unixTime >= incomingTimepoint - 24 * 3600) {
          streamManager.addRecentlyUsedMusic(media.mediaItemId, unixTime);
        }
      }
    }
  }

  const activeHolidayTags =
    tagRepository.findActiveHolidaysByDate(fullDateString); // VERIFIED

  // Calculate end of day
  const endOfDayDate = endOfDay(new Date(incomingTimepoint * 1000));
  const endOfDayUnix = Math.floor(endOfDayDate.getTime() / 1000);

  // TODO: Check for scheduled blocks
  const nextScheduledBlock: ScheduledBlock | null = null;

  // Calculate end of timewindow
  let endOfTimeWindow = endOfDayUnix;
  // TODO: Check for scheduled blocks
  // if (
  //   nextScheduledBlock &&
  //   nextScheduledBlock.scheduledStartTime < endOfDayUnix
  // ) {
  //   endOfTimeWindow = nextScheduledBlock.scheduledStartTime;
  // }

  // Calculate iteration duration (how many 30-min blocks fit)
  const iterationDuration =
    Math.floor((endOfTimeWindow - incomingTimepoint) / (30 * 60)) * 30 * 60;

  // Get progression map for this stream type and set it on the stream manager
  const progressionMap = getProgressionsByStreamType(
    streamConstructionOptions.StreamType,
  ); // VERIFIED
  streamManager.getStreamManager().setProgressionMap(progressionMap); // VERIFIED

  // Select first random media as fallback
  const selectedFirstMedia = selectRandomShowOrMovie(
    incomingTimepoint,
    iterationDuration,
    [],
  ); // VERIFIED

  return {
    activeHolidayTags,
    progressionMap,
    startingTimepoint: incomingTimepoint,
    iterationDuration,
    endOfTimeWindow,
    selectedFirstMedia,
    nextScheduledBlock,
  };
}

/**
 * Builds cadenced continuous stream (with buffers)
 * Aligns anchor media to :00/:30 marks using buffers
 */
async function buildCadencedContinuousStream(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string, // Date without time (YYYY-MM-DD) for holiday tag matching
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  constructionStartTime: number,
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [];

  // Check if there's time before next cadence point
  const nextCadenceTime = findNextCadenceTime(initData.startingTimepoint); // VERIFIED

  if (nextCadenceTime > initData.startingTimepoint) {
    // CASE 1: Initial buffer needed before cadence point
    streamBlocks.push(
      ...buildCadencedWithInitialBuffer(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
        nextCadenceTime,
        constructionStartTime,
      ),
    );
  } else {
    // CASE 2: No initial buffer needed
    streamBlocks.push(
      ...buildCadencedWithoutInitialBuffer(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
        constructionStartTime,
      ),
    );
  }

  return streamBlocks;
}

/**
 * Builds cadenced stream with initial buffer before first cadence point
 *
 * Flow:
 * 1. Create initial buffer media block (no mainBlock, just filler content)
 * 2. Push buffer to player immediately (occupies time while constructing)
 * 3. Create first anchor media block at nextCadenceTime
 * 4. Push first anchor to player
 * 5. Add both to onDeck list
 * 6. Select second anchor (informed by first anchor's tags)
 * 7. Create backfill buffer between first and second anchors
 * 8. Inject backfill into first anchor's buffer array
 * 9. Pass second anchor to stream constructor for remaining blocks
 */
function buildCadencedWithInitialBuffer(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string, // Date without time (YYYY-MM-DD) for holiday tag matching
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  nextCadenceTime: number,
  constructionStartTime: number,
): MediaBlock[] {
  const streamBlocks: MediaBlock[] = [];

  // Defensive check: ensure selectedFirstMedia exists
  if (!initData.selectedFirstMedia) {
    console.error(
      "[ContinuousStreamBuilder] No media available for stream construction",
    );
    return streamBlocks;
  }

  // STEP 1: Calculate initial buffer duration
  const initialBufferDuration = nextCadenceTime - initData.startingTimepoint;

  if (initialBufferDuration > 0) {
    // STEP 2: Create initial buffer (no mainBlock, just filler content)
    const firstMediaTags = initData.selectedFirstMedia?.tags || [];
    const initialBufferResult = createBuffer(
      initialBufferDuration,
      [],
      firstMediaTags,
      initData.activeHolidayTags,
      initData.startingTimepoint,
    );

    const initialBufferBlock = createMediaBlock(
      initialBufferResult.buffer,
      undefined, // No mainBlock for initial buffer
      initData.startingTimepoint,
    );

    // STEP 3: Push buffer to player immediately
    const timeDeltaMs = Date.now() - constructionStartTime;
    playerManager.addMediaBlockToPlayer(initialBufferBlock);
    playerManager.play({ timeDelta: timeDeltaMs });

    // STEP 4: Add initial buffer to onDeck
    streamManager.addItemToOnDeck([initialBufferBlock]);
    streamBlocks.push(initialBufferBlock);
  }

  // STEP 5: Create first anchor media block at cadence point
  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    nextCadenceTime,
  );

  // STEP 6: Push first anchor to player
  playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

  // STEP 7: Add first anchor to onDeck
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);
  streamBlocks.push(firstAnchorMediaBlock);

  // STEP 8-12: Use shared logic to select second anchor and build remaining stream
  const [remainingStreamBlocks] = selectSecondAnchorAndBuildStream(
    streamConstructionOptions,
    initData,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
    firstAnchorMediaBlock,
    nextCadenceTime,
  );

  streamBlocks.push(...remainingStreamBlocks);
  return streamBlocks;
}

/**
 * Builds cadenced stream without initial buffer (starts exactly at cadence point)
 *
 * Flow:
 * 1. Create first anchor media block
 * 2. Push to player immediately (to buy construction time)
 * 3. Add to onDeck list
 * 4. Select second anchor media (themed or random)
 * 5. Create backfill buffer between first and second
 * 6. Inject backfill buffer into first anchor's buffer array
 * 7. Pass second anchor to stream constructor for remaining blocks
 */
function buildCadencedWithoutInitialBuffer(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  constructionStartTime: number,
): MediaBlock[] {
  const streamBlocks: MediaBlock[] = [];

  // Defensive check: ensure selectedFirstMedia exists
  if (!initData.selectedFirstMedia) {
    console.error(
      "[ContinuousStreamBuilder] No media available for stream construction",
    );
    return streamBlocks;
  }

  // STEP 1: Create first anchor media block with empty buffer
  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    initData.startingTimepoint,
  );

  // STEP 2: Push to player immediately to buy construction time
  const timeDeltaMs = Date.now() - constructionStartTime;
  playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);
  playerManager.play({ timeDelta: timeDeltaMs });

  // STEP 3: Add to onDeck list
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);

  streamBlocks.push(firstAnchorMediaBlock);

  // STEP 4-8: Use shared logic to select second anchor and build remaining stream
  const [remainingStreamBlocks] = selectSecondAnchorAndBuildStream(
    streamConstructionOptions,
    initData,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
    firstAnchorMediaBlock,
    initData.startingTimepoint,
  );

  streamBlocks.push(...remainingStreamBlocks);
  return streamBlocks;
}

/**
 * Selects second anchor, creates backfill, and constructs remaining stream blocks
 * Shared logic between WITH and WITHOUT initial buffer cases
 *
 * @param firstAnchorMediaBlock The first anchor block (already created)
 * @param firstAnchorTimepoint The start time of the first anchor
 * @returns Tuple of [MediaBlock[], secondAnchorMediaBlock]
 */
function selectSecondAnchorAndBuildStream(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  firstAnchorMediaBlock: MediaBlock,
  firstAnchorTimepoint: number,
): [MediaBlock[], MediaBlock | null] {
  const streamBlocks: MediaBlock[] = [];

  // Defensive check: ensure selectedFirstMedia exists
  if (!initData.selectedFirstMedia) {
    console.error(
      "[ContinuousStreamBuilder] Cannot build stream: no first media selected",
    );
    return [streamBlocks, null];
  }

  // Segment tags and select second anchor media (for buffer creation and stream continuation)
  const segmentedTags = segmentTags(initData.selectedFirstMedia?.tags || []);

  const secondAnchorMedia = streamConstructionOptions.Themed
    ? selectThemedMedia(
        segmentedTags,
        firstAnchorTimepoint,
        initData.iterationDuration,
        initData.activeHolidayTags,
        todayIsHolidayDate,
        todayIsHolidaySeason,
        dateString,
      )
    : selectRandomShowOrMovie(
        firstAnchorTimepoint,
        initData.iterationDuration,
        segmentedTags.ageGroupTags,
      );

  if (!secondAnchorMedia) {
    console.warn(
      "[ContinuousStreamBuilder] Could not select second anchor media",
    );
    return [streamBlocks, null];
  }

  // Create second anchor media block (for buffer calculation)
  const secondAnchorMediaBlock = createMediaBlock(
    [],
    secondAnchorMedia as Movie | Episode,
    firstAnchorTimepoint + firstAnchorMediaBlock.duration,
  );

  // Create backfill buffer between first and second anchors
  const backfillBuffer = createBackfillBuffer(
    firstAnchorMediaBlock,
    secondAnchorMediaBlock,
    initData.activeHolidayTags,
  );

  // Inject backfill buffer into first anchor's buffer array
  if (backfillBuffer && backfillBuffer.length > 0) {
    firstAnchorMediaBlock.buffer = backfillBuffer;
  }

  // Pass second anchor to stream constructor for remaining blocks
  const remainingStreamBlocks = constructContinuousStreamBlocks(
    firstAnchorTimepoint + firstAnchorMediaBlock.duration,
    initData.endOfTimeWindow,
    initData.selectedFirstMedia.tags || [],
    initData.activeHolidayTags,
    streamConstructionOptions,
    secondAnchorMediaBlock,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  streamBlocks.push(...remainingStreamBlocks);
  return [streamBlocks, secondAnchorMediaBlock];
}

/**
 * Creates backfill buffer between two anchor media blocks
 * Backfill is the difference between the media's actual duration and its duration slot
 *
 * @param mediaBlockA First anchor media block
 * @param mediaBlockB Second anchor media block (used for tag selection)
 * @param activeHolidayTags Active holiday tags for buffer theming
 * @returns Array of buffer media items (commercials, shorts, music)
 */
function createBackfillBuffer(
  mediaBlockA: MediaBlock,
  mediaBlockB: MediaBlock,
  activeHolidayTags: Tag[],
): any[] {
  let backfillDuration: number = 0;

  if (
    mediaBlockA.mainBlock &&
    mediaBlockA.mainBlock.duration &&
    mediaBlockA.mainBlock.durationLimit
  ) {
    backfillDuration =
      mediaBlockA.mainBlock.durationLimit - mediaBlockA.mainBlock.duration;
  }

  if (backfillDuration <= 0) {
    return [];
  }

  const tagsA = mediaBlockA.mainBlock?.tags || [];
  const tagsB = mediaBlockB.mainBlock?.tags || [];
  const backfillBufferResult = createBuffer(
    backfillDuration,
    tagsA,
    tagsB,
    activeHolidayTags,
    mediaBlockA.startTime,
  );

  return backfillBufferResult.buffer;
}

/**
 * Constructs remaining media blocks for continuous stream until end of day
 * Handles themed vs random selection with holiday content awareness
 *
 * TODO: This is adapted from legacy streamConstructor.constructStream
 * Should be kept in sync with that logic until we fully migrate
 */
function constructContinuousStreamBlocks(
  incomingTimepoint: number,
  endOfTimeWindow: number,
  firstMediaTags: Tag[],
  activeHolidayTags: Tag[],
  streamConstructionOptions: StreamConstructionOptions,
  iterationFirstMediaBlock: MediaBlock,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): MediaBlock[] {
  // Create a copy of progressionMap to avoid mutating the original

  const iterationBlocks: MediaBlock[] = [];
  iterationBlocks.push(iterationFirstMediaBlock);

  let timepoint = incomingTimepoint + iterationFirstMediaBlock.duration;

  const segmentedTags = segmentTags(firstMediaTags);

  while (timepoint < endOfTimeWindow) {
    const remainingDuration = endOfTimeWindow - timepoint;
    if (remainingDuration <= 0) {
      break;
    }

    const nextMedia = streamConstructionOptions.Themed
      ? selectThemedMedia(
          segmentedTags,
          timepoint,
          remainingDuration,
          activeHolidayTags,
          todayIsHolidayDate,
          todayIsHolidaySeason,
          dateString,
        )
      : selectRandomShowOrMovie(
          timepoint,
          remainingDuration,
          segmentedTags.ageGroupTags,
        );

    if (!nextMedia) {
      console.warn(
        `[ContinuousStreamBuilder] Could not select media at timepoint ${timepoint}`,
      );
      break;
    }

    const block = createMediaBlock([], nextMedia as Movie | Episode, timepoint);
    iterationBlocks.push(block);
    timepoint += block.duration;
  }

  return iterationBlocks;
}
