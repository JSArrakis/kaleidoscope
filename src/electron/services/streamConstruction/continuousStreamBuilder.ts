import { endOfDay } from "date-fns";
import { tagRepository } from "../../repositories/tagsRepository.js";
import { findNextCadenceTime, segmentTags } from "../../utils/common.js";

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
 * @returns Tuple of [MediaBlock[], errorMessage]
 */
export async function buildContinuousStream(
  streamConstructionOptions: StreamConstructionOptions,
): Promise<[MediaBlock[], string]> {
  const streamBlocks: MediaBlock[] = [];
  let mediaBlocks: MediaBlock[] = [];

  try {
    // Initialize stream data
    const initData = initializeContinuousStream(streamConstructionOptions); // VERIFIED

    if (!initData.selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    const dateString = getDateString(initData.startingTimepoint); // VERIFIED
    const todayIsHolidayDate = isHolidayDate(
      initData.startingTimepoint,
      initData.activeHolidayTags,
    ); // VERIFIED
    const todayIsHolidaySeason = isHolidaySeason(
      initData.startingTimepoint,
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
      );
    } else {
      return [[], "Uncadenced continuous streams not yet implemented"];
    }

    streamBlocks.push(...mediaBlocks);

    // Mark the stream as active and store the construction args
    // so the background service's cycleCheck can manage On Deck/Upcoming
    // and trigger day rollover.
    streamManager.setContinuousStream(true);
    streamManager.setContinuousStreamArgs({
      Cadence: streamConstructionOptions.Cadence,
      Themed: streamConstructionOptions.Themed,
    } as IStreamRequest);

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
  streamConstructionOptions: StreamConstructionOptions,
): StreamInitializationData {
  const startingTimepoint = Math.floor(Date.now() / 1000);
  const fullDateString = new Date(startingTimepoint * 1000)
    .toISOString()
    .substring(0, 10); // Get only YYYY-MM-DD

  // Load recently used movies from DB into stream manager
  streamManager.loadRecentlyUsedMovies(startingTimepoint);

  const activeHolidayTags =
    tagRepository.findActiveHolidaysByDate(fullDateString); // VERIFIED

  // Calculate end of day
  const endOfDayDate = endOfDay(new Date(startingTimepoint * 1000));
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
    Math.floor((endOfTimeWindow - startingTimepoint) / (30 * 60)) * 30 * 60;

  // Get progression map for this stream type and set it on the stream manager
  const progressionMap = getProgressionsByStreamType(
    streamConstructionOptions.StreamType,
  ); // VERIFIED
  streamManager.setProgressionMap(progressionMap); // VERIFIED

  // Select first random media as fallback
  const selectedFirstMedia = selectRandomShowOrMovie(
    startingTimepoint,
    iterationDuration,
    [],
  ); // VERIFIED

  return {
    activeHolidayTags,
    progressionMap,
    startingTimepoint: startingTimepoint,
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
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [];

  // Check if there's time before next cadence point
  const nextCadenceTime = findNextCadenceTime(initData.startingTimepoint); // VERIFIED

  if (nextCadenceTime > initData.startingTimepoint) {
    // CASE 1: Initial buffer needed before cadence point
    streamBlocks.push(
      ...(await buildCadencedWithInitialBuffer(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
        nextCadenceTime,
      )),
    );
  } else {
    // CASE 2: No initial buffer needed
    streamBlocks.push(
      ...(await buildCadencedWithoutInitialBuffer(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
      )),
    );
  }

  return streamBlocks;
}

/**
 * Builds cadenced stream with initial buffer before first cadence point
 *
 * Flow:
 * 1. Create initial buffer media block (no mainBlock, just filler content)
 * 2. Push buffer to player immediately — NOT added to On Deck (buffer-only, invisible to user)
 * 3. Create first anchor media block at nextCadenceTime
 * 4. Push first anchor to player immediately (buys construction time)
 * 5. Add first anchor to On Deck (Slot 1)
 * 6. Call buildStreamIteration to select all remaining anchors and compute buffers
 * 7. Wrap backfill buffer and send to player
 * 8. Add iterationBlocks[0] to On Deck (Slot 2), rest to Upcoming
 */
async function buildCadencedWithInitialBuffer(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string, // Date without time (YYYY-MM-DD) for holiday tag matching
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  nextCadenceTime: number,
): Promise<MediaBlock[]> {
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
    ); // VERIFIED

    const initialBufferBlock = createMediaBlock(
      initialBufferResult.buffer,
      undefined, // No mainBlock for initial buffer
      initData.startingTimepoint,
    ); // VERIFIED

    // STEP 3: Push buffer to player immediately so something is playing
    // while we finish constructing the rest of the day's stream.
    // Buffer-only blocks are NOT added to On Deck — they are invisible to the user
    // and have no anchor media. The player handles them directly.
    await playerManager.addMediaBlockToPlayer(initialBufferBlock);
    streamBlocks.push(initialBufferBlock);
  }

  // STEP 4: Create first anchor media block at cadence point
  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    nextCadenceTime,
  ); // VERIFIED

  // STEP 5: Push first anchor to player — this is the critical buy-time push.
  // The anchor (22+ min episode) gives us enough time to generate the rest of the day.
  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

  // STEP 6: Use shared logic to select all remaining anchors and build buffers
  // incomingTimepoint = nextCadenceTime + durationLimit: the first anchor starts at
  // nextCadenceTime, and advancing by durationLimit places the next block at the correct
  // cadence boundary so fillStreamBlockBuffers sees the right structural gap.
  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    nextCadenceTime + firstAnchorMediaBlock.anchorMedia!.durationLimit,
    initData.endOfTimeWindow,
    initData.activeHolidayTags,
    streamConstructionOptions,
    firstAnchorMediaBlock,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  // STEP 7: Wrap backfillBuffer as a buffer-only MediaBlock and send to player.
  // This is the filler content (commercials, shorts, music) that plays between the
  // end of the initial buffer and the start of the first anchor. The player already
  // has the first anchor queued — this slots in before it in the playback sequence.
  // We do NOT inject this into firstAnchorMediaBlock.buffer because that block has
  // already been handed to the player; we send this as its own block instead.
  if (backfillBuffer.length > 0) {
    const backfillDuration = backfillBuffer.reduce(
      (sum, item) => sum + (item.duration || 0),
      0,
    );
    const backfillBlock = createMediaBlock(
      backfillBuffer,
      undefined, // buffer-only, no anchor media
      firstAnchorMediaBlock.startTime - backfillDuration,
    );
    await playerManager.addMediaBlockToPlayer(backfillBlock);
    streamBlocks.push(backfillBlock);
  }

  // STEP 8: Populate On Deck (slots 1 & 2) and Upcoming
  // Slot 1 — first anchor is already playing, register it as currently on deck
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);
  // Slot 2 — next up (locked in, user cannot change)
  if (iterationBlocks.length > 0) {
    streamManager.addItemToOnDeck([iterationBlocks[0]]);
  }
  // Upcoming — everything else (user can reorder until the background cycle moves them to On Deck)
  if (iterationBlocks.length > 1) {
    streamManager.addToUpcomingStream(iterationBlocks.slice(1));
  }

  streamBlocks.push(...iterationBlocks);
  return streamBlocks;
}

/**
 * Builds cadenced stream without initial buffer (starts exactly at cadence point)
 *
 * Flow:
 * 1. Create first anchor media block
 * 2. Push first anchor to player immediately (buys construction time)
 * 3. Add first anchor to On Deck (Slot 1)
 * 4. Call buildStreamIteration to select all remaining anchors and compute buffers
 * 5. Wrap backfill buffer and send to player
 * 6. Add iterationBlocks[0] to On Deck (Slot 2), rest to Upcoming
 */
async function buildCadencedWithoutInitialBuffer(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): Promise<MediaBlock[]> {
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

  // STEP 2: Push first anchor to player immediately to buy construction time.
  // No initial buffer here — we're already on a cadence mark, so the anchor plays right away.
  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

  // STEP 3: Add first anchor to On Deck (Slot 1) — currently playing
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);

  streamBlocks.push(firstAnchorMediaBlock);

  // STEP 4: Use shared logic to select all remaining anchors and build buffers
  // incomingTimepoint = startingTimepoint + durationLimit: the first anchor starts at
  // startingTimepoint (already on cadence), and advancing by durationLimit places the
  // next block at the correct cadence boundary.
  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    initData.startingTimepoint +
      firstAnchorMediaBlock.anchorMedia!.durationLimit,
    initData.endOfTimeWindow,
    initData.activeHolidayTags,
    streamConstructionOptions,
    firstAnchorMediaBlock,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  // STEP 5: Wrap backfillBuffer as a buffer-only MediaBlock and send to player.
  // This is the filler content that plays between the stream start and the first anchor.
  // The player already has the first anchor queued — this slots in before it.
  // We do NOT inject this into firstAnchorMediaBlock.buffer because that block has
  // already been handed to the player; we send this as its own block instead.
  if (backfillBuffer.length > 0) {
    const backfillDuration = backfillBuffer.reduce(
      (sum, item) => sum + (item.duration || 0),
      0,
    );
    const backfillBlock = createMediaBlock(
      backfillBuffer,
      undefined, // buffer-only, no anchor media
      firstAnchorMediaBlock.startTime - backfillDuration,
    );
    await playerManager.addMediaBlockToPlayer(backfillBlock);
    streamBlocks.push(backfillBlock);
  }

  // STEP 6: Populate On Deck (Slot 2) and Upcoming
  // Slot 2 — next up (locked in, user cannot change)
  if (iterationBlocks.length > 0) {
    streamManager.addItemToOnDeck([iterationBlocks[0]]);
  }
  // Upcoming — everything else (user can reorder until the background cycle moves them to On Deck)
  if (iterationBlocks.length > 1) {
    streamManager.addToUpcomingStream(iterationBlocks.slice(1));
  }

  streamBlocks.push(...iterationBlocks);
  return streamBlocks;
}

/**
 * Constructs remaining media blocks for continuous stream until end of day
 * Handles themed vs random selection with holiday content awareness
 * Returns both the blocks and any unfilled time remainder from buffer creation
 *
 * TODO: This is adapted from legacy streamConstructor.constructStream
 * Should be kept in sync with that logic until we fully migrate
 *
 * @returns Tuple of [(Promo | Music | Short | Commercial)[], MediaBlock[]]
 */
function buildStreamIteration(
  incomingTimepoint: number,
  endofTimeWindow: number,
  activeHolidayTags: Tag[],
  streamConstructionOptions: StreamConstructionOptions,
  precedingMediaBlock: MediaBlock,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): [(Promo | Music | Short | Commercial)[], MediaBlock[]] {
  const iterationBlocks: MediaBlock[] = [];

  let timepoint = incomingTimepoint;
  let previousAnchorType: MediaType | undefined =
    precedingMediaBlock.anchorMedia?.type;

  let tags = precedingMediaBlock.anchorMedia?.tags || [];

  while (timepoint < endofTimeWindow) {
    const segmentedTags = segmentTags(tags); // VERIFIED
    const remainingDuration = endofTimeWindow - timepoint;
    if (remainingDuration <= 0) {
      break;
    }

    const selectedAnchor = streamConstructionOptions.Themed
      ? selectThemedMedia(
          segmentedTags,
          timepoint,
          remainingDuration,
          activeHolidayTags,
          todayIsHolidayDate,
          todayIsHolidaySeason,
          dateString,
          previousAnchorType,
        ) // VERIFIED
      : selectRandomShowOrMovie(
          timepoint,
          remainingDuration,
          segmentedTags.ageGroupTags,
        ); // VERIFIED

    if (!selectedAnchor) {
      console.warn(
        `[ContinuousStreamBuilder] Could not select media at timepoint ${timepoint}`,
      );
      break;
    }

    const block = createMediaBlock(
      [],
      selectedAnchor as Movie | Episode,
      timepoint,
    ); // VERIFIED
    iterationBlocks.push(block);
    previousAnchorType = selectedAnchor.type;
    tags = selectedAnchor.tags || [];

    // Track movies as recently used in-memory to avoid re-selection within this stream session
    if (selectedAnchor.type === MediaType.Movie) {
      streamManager.addRecentlyUsedMovie(selectedAnchor.mediaItemId, timepoint);
    }

    // Advance by durationLimit so the next block's startTime is at the cadence boundary.
    // This creates the structural gap (durationLimit - duration) that fillStreamBlockBuffers
    // uses to compute the buffer budget for each block.
    timepoint += selectedAnchor.durationLimit;
  }

  if (streamConstructionOptions.Cadence) {
    const previousRemainderTime = streamManager.getRemainderTimeInSeconds();

    const previousBuffer = createBuffer(
      (precedingMediaBlock.anchorMedia?.durationLimit || 0) -
        (precedingMediaBlock.anchorMedia?.duration || 0) +
        previousRemainderTime,
      precedingMediaBlock.anchorMedia?.tags || [],
      iterationBlocks[0]?.anchorMedia?.tags || [],
      activeHolidayTags,
      precedingMediaBlock.startTime,
    );

    const finalRemainder = fillStreamBlockBuffers(
      previousBuffer.remainingDuration,
      iterationBlocks,
      activeHolidayTags,
    );

    streamManager.setRemainderTimeInSeconds(finalRemainder);

    return [previousBuffer.buffer, iterationBlocks];
  }

  return [[], iterationBlocks];
}

/**
 * Fills buffer arrays for all media blocks in the iteration
 * Creates filler content (commercials, shorts, music) between anchor media
 *
 * In cadenced mode, each block's startTime is placed at its cadence boundary:
 * startTime advances by durationLimit, not anchor.duration. This creates a structural
 * gap of (durationLimit - duration) between the end of the anchor and the start of the
 * next block — that gap is the buffer slot. Any seconds the buffer constructor couldn't
 * fill cascade forward as remainder to the next buffer.
 *
 * Algorithm:
 * For each media block from 0 to length-2 (skip last block):
 *   1. Calculate structural gap: nextBlock.startTime - (currentBlock.startTime + anchorDuration)
 *      = durationLimit - duration (e.g. 1800 - 1320 = 480s for a 22-min show in a 30-min slot)
 *   2. Combine gap with any carried-over remainder from previous buffer
 *   3. Skip only if both are 0 (nothing to fill)
 *   4. Create buffer using current and next block's tags
 *   5. Attach buffer to current block's buffer array
 *   6. Carry remainder forward to next iteration
 *
 * The last block has no buffer (the day rollover will backfill it when it triggers
 * next-day generation — see STREAM_RUNTIME_DESIGN.md)
 *
 * @param timeRemainder Remaining duration from the preceding buffer to cascade in
 * @param iterationBlocks Array of media blocks to fill buffers for
 * @param activeHolidayTags Active holiday tags for themed buffer selection
 * @returns Final remaining duration after all buffers created (carried to next cycle)
 */
function fillStreamBlockBuffers(
  timeRemainder: number,
  iterationBlocks: MediaBlock[],
  activeHolidayTags: Tag[],
): number {
  let cumulativeRemainder = timeRemainder;

  // Need at least 2 blocks to have a buffer between them
  if (iterationBlocks.length < 2) {
    return 0;
  }

  for (let i = 0; i < iterationBlocks.length - 1; i++) {
    const currentBlock = iterationBlocks[i];
    const nextBlock = iterationBlocks[i + 1];

    // Calculate structural gap between end of current anchor and start of next block.
    // Since timepoint advances by durationLimit, this equals (durationLimit - duration)
    // for each block — e.g. 480s for a 22-min show in a 30-min slot.
    const currentAnchorEndTime =
      currentBlock.startTime + (currentBlock.anchorMedia?.duration || 0);
    const bufferDuration = Math.max(
      0,
      nextBlock.startTime - currentAnchorEndTime,
    );

    // Total budget = structural gap + whatever remainder cascaded from the previous buffer.
    // Skip only if there is truly nothing to fill.
    const totalBufferDuration = bufferDuration + cumulativeRemainder;
    if (totalBufferDuration <= 0) {
      continue;
    }

    // Get tags from both anchor media for themed buffer creation
    const tagsA = currentBlock.anchorMedia?.tags || [];
    const tagsB = nextBlock.anchorMedia?.tags || [];

    // Create buffer using both anchor media's tags
    const bufferResult = createBuffer(
      totalBufferDuration,
      tagsA,
      tagsB,
      activeHolidayTags,
      currentBlock.startTime,
    );

    // Attach buffer to current block
    currentBlock.buffer = bufferResult.buffer;

    // Carry remainder forward to next iteration
    cumulativeRemainder = bufferResult.remainingDuration;
  }

  return cumulativeRemainder;
}

/**
 * Rolls over the stream to the next day.
 * Called by the background service when Upcoming is down to its last block
 * (which has no buffer yet because it was the terminal block of the previous
 * buildStreamIteration call — fillStreamBlockBuffers skips the last element).
 *
 * What this does:
 * 1. Uses the last Upcoming block as `precedingMediaBlock` for continuity
 * 2. Calls buildStreamIteration with the next day's timepoints
 * 3. Backfills the last Upcoming block's `.buffer` with the returned backfillBuffer
 *    (safe because this block has not yet moved to On Deck)
 * 4. Appends all new anchor blocks to Upcoming
 *
 * This is the ONLY place where an existing Upcoming block's `.buffer` is mutated.
 *
 * @param streamConstructionOptions Options from the running stream (Cadence, Themed, StreamType)
 * @param tomorrowTimepoint Unix timestamp for midnight of the next day
 */
export function rolloverToNextDay(
  streamConstructionOptions: StreamConstructionOptions,
  tomorrowTimepoint: number,
): void {
  const upcoming = streamManager.getUpcomingStream();

  if (upcoming.length === 0) {
    console.warn(
      "[ContinuousStreamBuilder] rolloverToNextDay called but Upcoming is empty — skipping",
    );
    return;
  }

  // The last Upcoming block becomes the preceding context for the new day's iteration
  const lastUpcomingBlock = upcoming[upcoming.length - 1];

  // Compute next-day time window and date metadata
  const tomorrowEndDate = endOfDay(new Date(tomorrowTimepoint * 1000));
  const tomorrowEndUnix = Math.floor(tomorrowEndDate.getTime() / 1000);
  const tomorrowDateString = new Date(tomorrowTimepoint * 1000)
    .toISOString()
    .substring(0, 10);

  const activeHolidayTags =
    tagRepository.findActiveHolidaysByDate(tomorrowDateString);
  const tomorrowIsHolidayDate = isHolidayDate(
    tomorrowTimepoint,
    activeHolidayTags,
  );
  const tomorrowIsHolidaySeason = isHolidaySeason(
    tomorrowTimepoint,
    activeHolidayTags,
  );

  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    tomorrowTimepoint,
    tomorrowEndUnix,
    activeHolidayTags,
    streamConstructionOptions,
    lastUpcomingBlock,
    tomorrowDateString,
    tomorrowIsHolidayDate,
    tomorrowIsHolidaySeason,
  );

  // Backfill the last Upcoming block's buffer (it was skipped by fillStreamBlockBuffers
  // as the terminal block of the previous day's iteration)
  if (backfillBuffer.length > 0) {
    lastUpcomingBlock.buffer = backfillBuffer;
  }

  // Append the new day's anchor blocks to Upcoming
  if (iterationBlocks.length > 0) {
    streamManager.addToUpcomingStream(iterationBlocks);
  }

  console.log(
    `[ContinuousStreamBuilder] Day rollover complete — added ${iterationBlocks.length} blocks for ${tomorrowDateString}`,
  );
}
