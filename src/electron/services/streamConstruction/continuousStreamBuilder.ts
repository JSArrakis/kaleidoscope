import { endOfDay } from "date-fns";
import { movieRepository } from "../../repositories/movieRepository.js";
import { showRepository } from "../../repositories/showRepository.js";
import { collectionRepository } from "../../repositories/collectionRepository.js";
import { tagRepository } from "../../repositories/tagsRepository.js";
import { findNextCadenceTime, segmentTags } from "../../utils/common.js";
import { MediaType, TagType } from "../../models.js";

import { createBuffer } from "../bufferConstructor.js";
import * as playerManager from "../playerManager.js";
import * as streamManager from "../streamManager.js";
import { createMediaBlock } from "../../factories/mediaBlock.factory.js";
import { MediaBlock } from "../../types/MediaBlock.js";
import {
  getDateString,
  doesNextEpisodeFitDuration,
  getEpisodeFromShowCandidates,
  getProgressionsByStreamType,
  isHolidayDate,
  isHolidaySeason,
} from "./selectionHelpers.js";
import {
  findActiveScheduledBlock,
  findNextScheduledBlock,
} from "../programmingBlocks/blockScheduler.js";
import { buildScheduledProgrammingBlockSegment } from "./programmingBlockSegmentBuilder.js";
import { getScheduledProgrammingBlockAppointmentStarts } from "./programmingBlockSegmentBuilder.js";
import { programmingBlockRepository } from "../../repositories/programmingBlockRepository.js";
import { selectThemedMedia } from "./mediaSelector.js";
import { selectRandomShowOrMovie } from "./mediaSelector.js";
import { resolveCollectionAwareAnchorSelection } from "./collectionProgressionSelector.js";

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
      // UNCADENCED MODE: Anchors play back-to-back with no buffers and no clock alignment
      // Both Themed:true and Themed:false are handled here — the selection fork lives
      // inside buildStreamIteration and is driven by streamConstructionOptions.Themed.
      mediaBlocks = await buildUncadencedContinuousStream(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
      );
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

  const scheduledBlocks = programmingBlockRepository.findAllActiveDefinitions();

  const activeScheduledBlock = findActiveScheduledBlock(
    scheduledBlocks,
    startingTimepoint,
  );

  const activeScheduledDefinition = activeScheduledBlock?.programmingBlockId
    ? programmingBlockRepository.findDefinitionById(
        activeScheduledBlock.programmingBlockId,
      )
    : null;

  const nextScheduledBlock = findNextScheduledBlock(
    scheduledBlocks,
    startingTimepoint,
    endOfDayUnix,
  );

  // Build through end of day. Scheduled blocks are inserted during iteration.
  const endOfTimeWindow = endOfDayUnix;

  // Calculate iteration duration (how many 30-min blocks fit)
  const iterationDuration =
    Math.floor((endOfTimeWindow - startingTimepoint) / (30 * 60)) * 30 * 60;

  // Get progression map for this stream type and set it on the stream manager
  const progressionMap = getProgressionsByStreamType(
    streamConstructionOptions.StreamType,
  ); // VERIFIED
  streamManager.setProgressionMap(progressionMap); // VERIFIED

  if (streamConstructionOptions.StreamType === StreamType.Cont) {
    streamManager.loadCollectionProgressionForScope(
      `stream:${StreamType.Cont}`,
    );
  }

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
    activeScheduledBlock,
    activeScheduledDefinition,
  };
}

/**
 * Builds uncadenced continuous stream (no buffers, no clock alignment)
 *
 * Anchors play directly back-to-back. Each block's startTime is the exact end
 * time of the previous anchor (startTime + duration), not a :00/:30 boundary.
 * No buffer content is constructed between anchors.
 *
 * Both Themed and Random selection are handled by buildStreamIteration internally.
 *
 * Flow:
 * 1. Create first anchor at startingTimepoint
 * 2. Push to player immediately
 * 3. Add to On Deck (Slot 1)
 * 4. Call buildStreamIteration — advances by duration, returns no backfill buffer
 * 5. Add iterationBlocks[0] to On Deck (Slot 2), rest to Upcoming
 */
async function buildUncadencedContinuousStream(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [];

  if (!initData.selectedFirstMedia) {
    console.error(
      "[ContinuousStreamBuilder] No media available for stream construction",
    );
    return streamBlocks;
  }

  // STEP 1: First anchor starts immediately — no cadence alignment, no initial buffer
  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    initData.startingTimepoint,
  );

  // STEP 2: Push to player immediately to buy construction time
  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

  // STEP 3: Register as On Deck Slot 1 (currently playing)
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);
  streamBlocks.push(firstAnchorMediaBlock);

  // STEP 4: Build the rest of the day's blocks.
  // incomingTimepoint advances by actual duration so each anchor starts right
  // where the previous one ends. buildStreamIteration continues advancing by
  // duration (not durationLimit) throughout the loop because Cadence is false.
  // No backfill buffer is returned for uncadenced streams.
  const [, iterationBlocks] = buildStreamIteration(
    initData.startingTimepoint + firstAnchorMediaBlock.anchorMedia!.duration,
    initData.endOfTimeWindow,
    initData.activeHolidayTags,
    streamConstructionOptions,
    firstAnchorMediaBlock,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  // STEP 5: Populate On Deck (Slot 2) and Upcoming
  if (iterationBlocks.length > 0) {
    streamManager.addItemToOnDeck([iterationBlocks[0]]);
  }
  if (iterationBlocks.length > 1) {
    streamManager.addToUpcomingStream(iterationBlocks.slice(1));
  }

  streamBlocks.push(...iterationBlocks);
  return streamBlocks;
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

  const shouldUseActiveBlockBridge =
    !!initData.activeScheduledBlock &&
    !!initData.activeScheduledDefinition &&
    resolveBridgeEndTimeForActiveBlock(initData, nextCadenceTime) -
      nextCadenceTime >
      30 * 60;

  if (shouldUseActiveBlockBridge) {
    return await buildCadencedWithActiveBlockBridge(
      streamConstructionOptions,
      initData,
      dateString,
      todayIsHolidayDate,
      todayIsHolidaySeason,
      nextCadenceTime,
      streamBlocks,
    );
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

async function buildCadencedWithActiveBlockBridge(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  nextCadenceTime: number,
  prebuiltBlocks: MediaBlock[],
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [...prebuiltBlocks];

  if (!initData.activeScheduledBlock || !initData.activeScheduledDefinition) {
    return streamBlocks;
  }

  const bridgeEnd = resolveBridgeEndTimeForActiveBlock(
    initData,
    nextCadenceTime,
  );

  const bridgeBlocks = buildActiveBlockBridgeBlocks(
    initData.activeScheduledDefinition,
    nextCadenceTime,
    bridgeEnd,
    initData.activeHolidayTags,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  if (bridgeBlocks.length === 0) {
    return await buildCadencedFallbackFromNextCadence(
      streamConstructionOptions,
      initData,
      dateString,
      todayIsHolidayDate,
      todayIsHolidaySeason,
      nextCadenceTime,
      streamBlocks,
    );
  }

  await playerManager.addMediaBlockToPlayer(bridgeBlocks[0]);

  const bridgeRemainder = fillStreamBlockBuffers(
    0,
    bridgeBlocks,
    initData.activeHolidayTags,
  );
  streamManager.setRemainderTimeInSeconds(bridgeRemainder);

  const lastBridgeBlock = bridgeBlocks[bridgeBlocks.length - 1];
  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    lastBridgeBlock.startTime +
      (lastBridgeBlock.anchorMedia?.durationLimit || 30 * 60),
    initData.endOfTimeWindow,
    initData.activeHolidayTags,
    streamConstructionOptions,
    lastBridgeBlock,
    dateString,
    todayIsHolidayDate,
    todayIsHolidaySeason,
  );

  if (backfillBuffer.length > 0) {
    const backfillDuration = backfillBuffer.reduce(
      (sum, item) => sum + (item.duration || 0),
      0,
    );
    const backfillBlock = createMediaBlock(
      backfillBuffer,
      undefined,
      lastBridgeBlock.startTime +
        (lastBridgeBlock.anchorMedia?.duration || 0) -
        backfillDuration,
    );
    await playerManager.addMediaBlockToPlayer(backfillBlock);
    streamBlocks.push(backfillBlock);
  }

  const fullAnchorSequence = [...bridgeBlocks, ...iterationBlocks];
  streamManager.setOnDeck(fullAnchorSequence.slice(0, 2));
  streamManager.setUpcoming(fullAnchorSequence.slice(2));

  streamBlocks.push(...bridgeBlocks);
  streamBlocks.push(...iterationBlocks);
  return streamBlocks;
}

async function buildCadencedFallbackFromNextCadence(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  nextCadenceTime: number,
  prebuiltBlocks: MediaBlock[],
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [...prebuiltBlocks];

  if (!initData.selectedFirstMedia) {
    return streamBlocks;
  }

  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    nextCadenceTime,
  );
  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

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

  if (backfillBuffer.length > 0) {
    const backfillDuration = backfillBuffer.reduce(
      (sum, item) => sum + (item.duration || 0),
      0,
    );
    const backfillBlock = createMediaBlock(
      backfillBuffer,
      undefined,
      firstAnchorMediaBlock.startTime - backfillDuration,
    );
    await playerManager.addMediaBlockToPlayer(backfillBlock);
    streamBlocks.push(backfillBlock);
  }

  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);
  if (iterationBlocks.length > 0) {
    streamManager.addItemToOnDeck([iterationBlocks[0]]);
  }
  if (iterationBlocks.length > 1) {
    streamManager.addToUpcomingStream(iterationBlocks.slice(1));
  }

  streamBlocks.push(...iterationBlocks);
  return streamBlocks;
}

function resolveBridgeEndTimeForActiveBlock(
  initData: StreamInitializationData,
  cadenceStartTime: number,
): number {
  if (!initData.activeScheduledBlock || !initData.activeScheduledDefinition) {
    return cadenceStartTime;
  }

  const deterministicAppointment =
    resolveNextInternalAppointmentTimeForActiveBlock(
      initData.activeScheduledDefinition,
      initData.activeScheduledBlock,
      cadenceStartTime,
    );

  const rawEnd =
    deterministicAppointment ?? initData.activeScheduledBlock.scheduledEndTime;
  return Math.min(rawEnd, initData.endOfTimeWindow);
}

function resolveNextInternalAppointmentTimeForActiveBlock(
  definition: ProgrammingBlockDefinition,
  activeScheduledBlock: ScheduledBlock,
  cadenceStartTime: number,
): number | null {
  if (
    definition.type === "CuratedMovieMarathon" ||
    definition.type === "ShowOrder"
  ) {
    const starts = getScheduledProgrammingBlockAppointmentStarts(
      definition,
      activeScheduledBlock.scheduledStartTime,
      StreamType.Cont,
    );
    return (
      starts.find((start) => start > cadenceStartTime) ??
      activeScheduledBlock.scheduledEndTime
    );
  }

  return null;
}

function buildActiveBlockBridgeBlocks(
  definition: ProgrammingBlockDefinition,
  bridgeStartTime: number,
  bridgeEndTime: number,
  activeHolidayTags: Tag[],
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): MediaBlock[] {
  const bridgeBlocks: MediaBlock[] = [];

  let slotStart = bridgeStartTime;
  let previousAnchorType: MediaType | undefined;
  while (slotStart + 30 * 60 <= bridgeEndTime) {
    const episode = selectBridgeEpisodeForActiveBlock(
      definition,
      slotStart,
      activeHolidayTags,
      dateString,
      todayIsHolidayDate,
      todayIsHolidaySeason,
      previousAnchorType,
    );

    if (!episode) {
      break;
    }

    bridgeBlocks.push(createMediaBlock([], episode, slotStart));
    previousAnchorType = episode.type;
    slotStart += 30 * 60;
  }

  return bridgeBlocks;
}

function selectBridgeEpisodeForActiveBlock(
  definition: ProgrammingBlockDefinition,
  slotStartTime: number,
  activeHolidayTags: Tag[],
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
  previousAnchorType?: MediaType,
): Episode | null {
  const seedTags: Tag[] = [];

  if (definition.specialtyTagId) {
    const specialty = tagRepository.findByTagId(definition.specialtyTagId);
    if (specialty) {
      seedTags.push(specialty);
    }
  }

  if (definition.type === "TagThemed") {
    const config = programmingBlockRepository.findTagThemedConfig(
      definition.programmingBlockId,
    );
    for (const tagId of config.tagIds) {
      const tag = tagRepository.findByTagId(tagId);
      if (tag) {
        seedTags.push(tag);
      }
    }
  }

  if (definition.type === "ShowOrder") {
    const orderedShowIds = programmingBlockRepository.findOrderedShowIds(
      definition.programmingBlockId,
    );
    for (const showId of orderedShowIds) {
      const show = showRepository.findByMediaItemId(showId);
      if (show?.tags?.length) {
        seedTags.push(...show.tags);
      }
    }
  }

  if (definition.type === "CuratedMovieMarathon") {
    const orderedMovieIds = programmingBlockRepository.findOrderedMovieIds(
      definition.programmingBlockId,
    );
    const firstMovie = orderedMovieIds[0]
      ? movieRepository.findByMediaItemId(orderedMovieIds[0])
      : null;
    if (firstMovie?.tags?.length) {
      seedTags.push(...firstMovie.tags);
    }
  }

  const dedupedTagMap = new Map<string, Tag>();
  for (const tag of seedTags) {
    dedupedTagMap.set(tag.tagId, tag);
  }
  const dedupedTags = Array.from(dedupedTagMap.values());

  if (dedupedTags.length > 0) {
    const segmented = segmentTags(dedupedTags);

    if (dedupedTags.some((tag) => tag.type === TagType.Specialty)) {
      const showCandidates =
        showRepository.findByTagsAndDurationWithProgressionCheck(
          dedupedTags.map((tag) => tag.tagId),
          StreamType.Cont,
          30 * 60,
        );

      for (const show of showCandidates) {
        const nextEpisodeNumber = doesNextEpisodeFitDuration(show, 30 * 60);
        if (!nextEpisodeNumber) {
          continue;
        }
        const episode = show.episodes[nextEpisodeNumber - 1];
        if (!episode) {
          continue;
        }
        streamManager.updateProgression(show.mediaItemId, nextEpisodeNumber);
        return episode;
      }
    }

    const themedPick = selectThemedMedia(
      segmented,
      slotStartTime,
      30 * 60,
      activeHolidayTags,
      todayIsHolidayDate,
      todayIsHolidaySeason,
      dateString,
      previousAnchorType,
    );

    if (themedPick && "showItemId" in themedPick) {
      return themedPick;
    }
  }

  const fallbackShows = showRepository.findAllShowsUnderDuration(30 * 60);
  for (const show of fallbackShows) {
    const nextEpisodeNumber = doesNextEpisodeFitDuration(show, 30 * 60);
    if (!nextEpisodeNumber) {
      continue;
    }
    const episode = show.episodes[nextEpisodeNumber - 1];
    if (!episode) {
      continue;
    }
    streamManager.updateProgression(show.mediaItemId, nextEpisodeNumber);
    return episode;
  }

  return null;
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

  const shouldUseActiveBlockBridge =
    !!initData.activeScheduledBlock &&
    !!initData.activeScheduledDefinition &&
    resolveBridgeEndTimeForActiveBlock(initData, initData.startingTimepoint) -
      initData.startingTimepoint >
      30 * 60;

  if (shouldUseActiveBlockBridge) {
    return await buildCadencedWithActiveBlockBridge(
      streamConstructionOptions,
      initData,
      dateString,
      todayIsHolidayDate,
      todayIsHolidaySeason,
      initData.startingTimepoint,
      streamBlocks,
    );
  }

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
export function buildStreamIteration(
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
  const activeBlockDefinitions =
    programmingBlockRepository.findAllActiveDefinitions();

  let timepoint = incomingTimepoint;
  let previousAnchorType: MediaType | undefined =
    precedingMediaBlock.anchorMedia?.type;

  let tags = precedingMediaBlock.anchorMedia?.tags || [];

  while (timepoint < endofTimeWindow) {
    const nextScheduledBlock = findNextScheduledBlock(
      activeBlockDefinitions,
      timepoint,
      endofTimeWindow,
    );

    if (
      nextScheduledBlock &&
      nextScheduledBlock.scheduledStartTime === timepoint
    ) {
      if (!nextScheduledBlock.programmingBlockId) {
        timepoint = nextScheduledBlock.scheduledEndTime;
        continue;
      }

      const definition = programmingBlockRepository.findDefinitionById(
        nextScheduledBlock.programmingBlockId,
      );

      if (!definition) {
        console.warn(
          `[ContinuousStreamBuilder] Scheduled block definition missing for id ${nextScheduledBlock.programmingBlockId}`,
        );
        timepoint = nextScheduledBlock.scheduledEndTime;
        continue;
      }

      const [segmentBlocks, segmentError] =
        buildScheduledProgrammingBlockSegment(definition, {
          parentStreamType: streamConstructionOptions.StreamType,
          scheduledStartTime: nextScheduledBlock.scheduledStartTime,
          cadence: streamConstructionOptions.Cadence,
        });

      if (segmentError || segmentBlocks.length === 0) {
        console.warn(
          `[ContinuousStreamBuilder] Scheduled block insertion failed for ${definition.name}: ${segmentError || "no playable items"}`,
        );
        timepoint = nextScheduledBlock.scheduledEndTime;
        continue;
      }

      iterationBlocks.push(...segmentBlocks);

      for (const block of segmentBlocks) {
        const anchor = block.anchorMedia;
        if (anchor?.type === MediaType.Movie) {
          streamManager.addRecentlyUsedMovie(
            anchor.mediaItemId,
            block.startTime,
          );
        }
      }

      const lastSegmentBlock = segmentBlocks[segmentBlocks.length - 1];
      previousAnchorType = lastSegmentBlock.anchorMedia?.type;
      tags = lastSegmentBlock.anchorMedia?.tags || tags;
      timepoint =
        lastSegmentBlock.startTime +
        (streamConstructionOptions.Cadence
          ? lastSegmentBlock.anchorMedia?.durationLimit || 0
          : lastSegmentBlock.anchorMedia?.duration || 0);
      continue;
    }

    const segmentedTags = segmentTags(tags); // VERIFIED
    const selectionWindowEnd = nextScheduledBlock
      ? Math.min(endofTimeWindow, nextScheduledBlock.scheduledStartTime)
      : endofTimeWindow;
    const remainingDuration = selectionWindowEnd - timepoint;
    if (remainingDuration <= 0) {
      break;
    }

    const rawSelectedAnchor = streamConstructionOptions.Themed
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

    if (!rawSelectedAnchor) {
      console.warn(
        `[ContinuousStreamBuilder] Could not select media at timepoint ${timepoint}`,
      );
      break;
    }

    const scopeKey = `stream:${streamConstructionOptions.StreamType}`;
    const selectedAnchor = resolveCollectionAwareAnchorSelection({
      selectedAnchor: rawSelectedAnchor,
      scopeKey,
      streamTimepoint: timepoint,
      remainingDuration,
      enforceWithinSeconds: 12 * 60 * 60,
      selectFallbackMovieOutsideCollection: (collectionId: string) => {
        const excludedIds = collectionRepository
          .findItemsByCollectionId(collectionId)
          .map((item) => item.mediaItemId);

        return movieRepository.findRandomMovieUnderDurationExcluding(
          remainingDuration,
          segmentedTags.ageGroupTags,
          excludedIds,
        );
      },
      selectFallbackEpisode: () => {
        const nonAgeTags = [
          ...segmentedTags.genreTags,
          ...segmentedTags.aestheticTags,
          ...segmentedTags.specialtyTags,
        ];

        const candidates = streamConstructionOptions.Themed
          ? showRepository.findByTagsAndAgeGroupsUnderDuration(
              nonAgeTags,
              segmentedTags.ageGroupTags,
              remainingDuration,
            )
          : showRepository.findAllShowsUnderDuration(
              remainingDuration,
              segmentedTags.ageGroupTags,
            );

        return getEpisodeFromShowCandidates(candidates, remainingDuration);
      },
    });

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

    // Cadenced: advance by durationLimit so the next block's startTime lands on a :00/:30
    // boundary. The gap (durationLimit - duration) is the buffer slot.
    // Uncadenced: advance by actual duration so anchors play back-to-back with no gap.
    timepoint += streamConstructionOptions.Cadence
      ? selectedAnchor.durationLimit
      : selectedAnchor.duration || 0;
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

  // Cadenced: next day starts at midnight (tomorrowTimepoint — already a :00 mark).
  // Uncadenced: next day starts at the exact moment the last block of today ends,
  // so content is continuous across the day boundary with no gap.
  const incomingTimepoint = streamConstructionOptions.Cadence
    ? tomorrowTimepoint
    : lastUpcomingBlock.startTime +
      (lastUpcomingBlock.anchorMedia?.duration || 0);

  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    incomingTimepoint,
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
