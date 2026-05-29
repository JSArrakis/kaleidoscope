import { endOfDay } from "date-fns";
import { tagRepository } from "../../repositories/tagsRepository.js";
import { findNextCadenceTime } from "../../utils/common.js";
import { createBuffer } from "../bufferConstructor.js";
import * as playerManager from "../playerManager.js";
import * as streamManager from "../streamManager.js";
import { createMediaBlock } from "../../factories/mediaBlock.factory.js";
import { MediaBlock } from "../../types/MediaBlock.js";
import {
  getDateString,
  isHolidayDate,
  isHolidaySeason,
} from "./selectionHelpers.js";
import { selectRandomShowOrMovie } from "./mediaSelector.js";
import { buildStreamIteration } from "./continuousStreamBuilder.js";
import { buildFilesystemAdhocPlayerTestStream } from "./adhocFilesystemPlayerTestBuilder.js";
import { createNormalizationJobsFromBlocks } from "../normalization/normalizationJobFactory.js";
import { normalizationQueue } from "../normalization/normalizationQueue.js";
import { selectFirstAnchorForCadencedStartup } from "./firstAnchorAdmissionService.js";
import { selectFirstAnchorForCachedUncadencedStartup } from "./firstAnchorAdmissionService.js";

// Temporary test toggle for filesystem-based adhoc stream construction.
// Enable by setting KALEIDOSCOPE_USE_FILESYSTEM_ADHOC_TEST=1 in the environment.
const USE_FILESYSTEM_PLAYER_TEST_ADHOC =
  process.env.KALEIDOSCOPE_USE_FILESYSTEM_ADHOC_TEST === "1";

/**
 * Builds an adhoc stream
 * Constructs media blocks from startTimepoint until endTimepoint
 * Supports Cadenced and UnCadenced modes with Themed and Random selection
 *
 * Adhoc streams are one-off with a defined end time. They use the same
 * On Deck / Upcoming model as continuous streams and support all four
 * stream modes (Cadenced/Uncadenced × Themed/Random).
 *
 * If the endTimepoint extends past today, the background service will roll
 * over day by day (capped at endTimepoint each time) until the stream ends.
 *
 * @param streamConstructionOptions Configuration for stream (Cadence, Themed, etc)
 * @param endTimepoint Unix timestamp in seconds when the stream should stop
 * @returns Tuple of [MediaBlock[], errorMessage]
 */
export async function buildAdhocStream(
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint: number,
): Promise<[MediaBlock[], string]> {
  if (USE_FILESYSTEM_PLAYER_TEST_ADHOC) {
    return buildFilesystemAdhocPlayerTestStream(
      streamConstructionOptions,
      endTimepoint,
    );
  }

  const streamBlocks: MediaBlock[] = [];

  try {
    const initData = await initializeAdhocStream(
      streamConstructionOptions,
      endTimepoint,
    );

    if (!initData.selectedFirstMedia) {
      return [[], "No movies or shows found in database"];
    }

    const dateString = getDateString(initData.startingTimepoint);
    const todayIsHolidayDate = isHolidayDate(
      initData.startingTimepoint,
      initData.activeHolidayTags,
    );
    const todayIsHolidaySeason = isHolidaySeason(
      initData.startingTimepoint,
      initData.activeHolidayTags,
    );

    let mediaBlocks: MediaBlock[];

    if (streamConstructionOptions.Cadence) {
      mediaBlocks = await buildCadencedAdhocStream(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
      );
    } else {
      mediaBlocks = await buildUncadencedAdhocStream(
        streamConstructionOptions,
        initData,
        dateString,
        todayIsHolidayDate,
        todayIsHolidaySeason,
      );
    }

    streamBlocks.push(...mediaBlocks);

    // Mark as adhoc (not continuous). The background service will trigger
    // day-by-day rollovers if endTimepoint extends past today, capping each
    // day's window at endTimepoint.
    streamManager.setContinuousStream(false);
    streamManager.setAdhocStream(true);
    streamManager.setAdhocStreamEndTimepoint(endTimepoint);
    streamManager.setContinuousStreamArgs({
      Cadence: streamConstructionOptions.Cadence,
      Themed: streamConstructionOptions.Themed,
      AdhocStartFromBeginning:
        streamConstructionOptions.AdhocStartFromBeginning ?? true,
    } as IStreamRequest);

    console.log(
      `[AdhocStreamBuilder] Created ${streamBlocks.length} media blocks`,
    );
    return [streamBlocks, ""];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[AdhocStreamBuilder] Stream construction failed: ${message}`,
    );
    return [[], message];
  }
}

/**
 * Initializes stream with necessary data
 * Caps endOfTimeWindow at the earlier of end-of-day or endTimepoint.
 * If the stream runs past today the background service extends it via rollover.
 */
async function initializeAdhocStream(
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint: number,
): Promise<StreamInitializationData> {
  const startingTimepoint = Math.floor(Date.now() / 1000);
  const fullDateString = new Date(startingTimepoint * 1000)
    .toISOString()
    .substring(0, 10);

  streamManager.loadRecentlyUsedMovies(startingTimepoint);

  const activeHolidayTags =
    tagRepository.findActiveHolidaysByDate(fullDateString);

  const endOfDayDate = endOfDay(new Date(startingTimepoint * 1000));
  const endOfDayUnix = Math.floor(endOfDayDate.getTime() / 1000);

  // Cap at whichever comes first: end of today or the user-specified end time.
  // If endTimepoint is beyond today, rollover will continue generating content
  // for subsequent days up to endTimepoint.
  const endOfTimeWindow = Math.min(endOfDayUnix, endTimepoint);

  const iterationDuration =
    Math.floor((endOfTimeWindow - startingTimepoint) / (30 * 60)) * 30 * 60;

  // Adhoc progressions are ephemeral: start fresh each stream and never
  // persist to the DB. Within-session consistency is maintained by updating
  // this in-memory map during construction and rollover.
  const progressionMap = new Map<string, number | undefined>();
  streamManager.setProgressionMap(progressionMap);
  streamManager.clearCollectionProgressionForScope(
    `stream:${StreamType.Adhoc}`,
  );

  // When AdhocStartFromBeginning is false, each show's first episode pick
  // this session will be a random episode rather than episode 1.
  streamManager.setRandomEpisodeStart(
    !(streamConstructionOptions.AdhocStartFromBeginning ?? true),
  );

  const fallbackFirstMedia = selectRandomShowOrMovie(
    startingTimepoint,
    iterationDuration,
    [],
  );

  let selectedFirstMedia = fallbackFirstMedia;
  let firstAnchorRequiresPreparation = false;
  let firstAnchorEstimatedNormalizeSeconds: number | null = null;
  let firstAnchorAdmissionReason: string | undefined;

  if (streamConstructionOptions.Cadence && selectedFirstMedia) {
    const nextCadenceTime = findNextCadenceTime(startingTimepoint);
    const admission = await selectFirstAnchorForCadencedStartup({
      timepoint: startingTimepoint,
      iterationDuration,
      ageGroupTags: [],
      warmupWindowSeconds: Math.max(0, nextCadenceTime - startingTimepoint),
      preferredCandidate: selectedFirstMedia,
    });

    selectedFirstMedia = admission.selectedFirstMedia;
    firstAnchorRequiresPreparation = admission.requiresPreparation;
    firstAnchorEstimatedNormalizeSeconds = admission.estimatedNormalizeSeconds;
    firstAnchorAdmissionReason = admission.admissionReason;

    console.log(
      `[AdhocStreamBuilder] First-anchor admission evaluated=${admission.evaluatedCandidates} warmup=${admission.warmupWindowSeconds}s estimate=${admission.estimatedNormalizeSeconds ?? -1}s requiresPreparation=${admission.requiresPreparation} reason=${admission.admissionReason}`,
    );
  } else if (selectedFirstMedia) {
    const admission = await selectFirstAnchorForCachedUncadencedStartup({
      timepoint: startingTimepoint,
      iterationDuration,
      ageGroupTags: [],
      warmupWindowSeconds: 0,
      preferredCandidate: selectedFirstMedia,
    });

    selectedFirstMedia = admission.selectedFirstMedia;
    firstAnchorRequiresPreparation = admission.requiresPreparation;
    firstAnchorEstimatedNormalizeSeconds = admission.estimatedNormalizeSeconds;
    firstAnchorAdmissionReason = admission.admissionReason;

    console.log(
      `[AdhocStreamBuilder] First-anchor uncadenced admission evaluated=${admission.evaluatedCandidates} estimate=${admission.estimatedNormalizeSeconds ?? -1}s requiresPreparation=${admission.requiresPreparation} reason=${admission.admissionReason}`,
    );
  }

  return {
    activeHolidayTags,
    progressionMap,
    startingTimepoint,
    iterationDuration,
    endOfTimeWindow,
    selectedFirstMedia,
    firstAnchorRequiresPreparation,
    firstAnchorEstimatedNormalizeSeconds,
    firstAnchorAdmissionReason,
    nextScheduledBlock: null,
  };
}

/**
 * Builds cadenced adhoc stream (with buffers, aligned to :00/:30 marks)
 *
 * Flow:
 * 1. If time exists before the next cadence mark, create an initial buffer block
 * 2. Create first anchor at the next cadence mark
 * 3. Push initial buffer (if any) and first anchor to player
 * 4. Build the rest of the day/session via buildStreamIteration
 * 5. Wrap and push backfill buffer
 * 6. Populate On Deck and Upcoming
 */
async function buildCadencedAdhocStream(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [];

  if (!initData.selectedFirstMedia) {
    console.error(
      "[AdhocStreamBuilder] No media available for stream construction",
    );
    return streamBlocks;
  }

  const nextCadenceTime = findNextCadenceTime(initData.startingTimepoint);

  if (nextCadenceTime > initData.startingTimepoint) {
    // Time exists before the next cadence mark — create an initial buffer block
    const initialBufferDuration = nextCadenceTime - initData.startingTimepoint;

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
      undefined,
      initData.startingTimepoint,
    );

    await playerManager.addMediaBlockToPlayer(initialBufferBlock);
    streamBlocks.push(initialBufferBlock);
  }

  const anchorStartTime = Math.max(nextCadenceTime, initData.startingTimepoint);

  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    anchorStartTime,
  );

  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);

  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    anchorStartTime + firstAnchorMediaBlock.anchorMedia!.durationLimit,
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

/**
 * Builds uncadenced adhoc stream (no buffers, back-to-back anchors)
 *
 * Flow:
 * 1. Create first anchor at startingTimepoint
 * 2. Push to player immediately
 * 3. Build the rest of the session via buildStreamIteration (advances by duration)
 * 4. Populate On Deck and Upcoming
 */
async function buildUncadencedAdhocStream(
  streamConstructionOptions: StreamConstructionOptions,
  initData: StreamInitializationData,
  dateString: string,
  todayIsHolidayDate: boolean,
  todayIsHolidaySeason: boolean,
): Promise<MediaBlock[]> {
  const streamBlocks: MediaBlock[] = [];

  if (!initData.selectedFirstMedia) {
    console.error(
      "[AdhocStreamBuilder] No media available for stream construction",
    );
    return streamBlocks;
  }

  const firstAnchorMediaBlock = createMediaBlock(
    [],
    initData.selectedFirstMedia as Movie | Episode,
    initData.startingTimepoint,
  );

  await playerManager.addMediaBlockToPlayer(firstAnchorMediaBlock);
  streamManager.addItemToOnDeck([firstAnchorMediaBlock]);
  streamBlocks.push(firstAnchorMediaBlock);

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
 * Rolls the adhoc stream over to the next day.
 * Called by the background service when Upcoming is down to 1 block and
 * the adhoc endTimepoint has not yet been reached.
 *
 * Caps the new day's time window at min(endOfDay(tomorrow), adhocEndTimepoint)
 * so the stream stops generating content exactly at the user-specified end time.
 *
 * @param streamConstructionOptions Options from the running stream
 * @param tomorrowTimepoint Unix timestamp for midnight of the next day
 * @param adhocEndTimepoint Unix timestamp when the adhoc stream must end
 */
export function rolloverAdhocToNextDay(
  streamConstructionOptions: StreamConstructionOptions,
  tomorrowTimepoint: number,
  adhocEndTimepoint: number,
): void {
  const upcoming = streamManager.getUpcomingStream();

  if (upcoming.length === 0) {
    console.warn(
      "[AdhocStreamBuilder] rolloverAdhocToNextDay called but Upcoming is empty — skipping",
    );
    return;
  }

  const lastUpcomingBlock = upcoming[upcoming.length - 1];

  const tomorrowEndDate = endOfDay(new Date(tomorrowTimepoint * 1000));
  const tomorrowEndUnix = Math.floor(tomorrowEndDate.getTime() / 1000);
  const tomorrowDateString = new Date(tomorrowTimepoint * 1000)
    .toISOString()
    .substring(0, 10);

  // Cap this day's window at the adhoc end time if it falls within tomorrow
  const endOfTimeWindow = Math.min(tomorrowEndUnix, adhocEndTimepoint);

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

  // Uncadenced: continue from the exact end of the last block
  // Cadenced: midnight is already a :00 mark
  const incomingTimepoint = streamConstructionOptions.Cadence
    ? tomorrowTimepoint
    : lastUpcomingBlock.startTime +
      (lastUpcomingBlock.anchorMedia?.duration || 0);

  const [backfillBuffer, iterationBlocks] = buildStreamIteration(
    incomingTimepoint,
    endOfTimeWindow,
    activeHolidayTags,
    streamConstructionOptions,
    lastUpcomingBlock,
    tomorrowDateString,
    tomorrowIsHolidayDate,
    tomorrowIsHolidaySeason,
  );

  if (backfillBuffer.length > 0) {
    lastUpcomingBlock.buffer = backfillBuffer;
  }

  if (iterationBlocks.length > 0) {
    streamManager.addToUpcomingStream(iterationBlocks);
  }

  const prewarmBlocks = [lastUpcomingBlock, ...iterationBlocks];
  const jobs = createNormalizationJobsFromBlocks(prewarmBlocks);
  const queued = normalizationQueue.enqueue(jobs);

  if (queued > 0) {
    console.log(
      `[AdhocStreamBuilder] Enqueued rollover normalization jobs: ${queued}/${jobs.length}`,
    );
  }

  console.log(
    `[AdhocStreamBuilder] Adhoc rollover complete — added ${iterationBlocks.length} blocks for ${tomorrowDateString}`,
  );
}
