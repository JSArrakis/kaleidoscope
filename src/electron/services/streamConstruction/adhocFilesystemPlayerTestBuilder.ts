import fs from "fs";
import path from "path";
import { probeMediaMetadataHandler } from "../../handlers/mediaProbeHandlers.js";
import { createMediaBlock } from "../../factories/mediaBlock.factory.js";
import * as playerManager from "../playerManager.js";
import * as streamManager from "../streamManager.js";
import { findNextCadenceTime } from "../../utils/common.js";
import { MediaType, StreamType } from "../../models.js";
import { MediaBlock } from "../../types/MediaBlock.js";

const TEST_MEDIA_ROOTS = {
  commercials: "E:\\Media\\Commercials",
  shorts: "E:\\Media\\Short",
  music: "E:\\Media\\Music",
  shows: "E:\\Media\\Shows",
  movies: "E:\\Media\\Movies",
} as const;

const SUPPORTED_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".m4v",
  ".wmv",
  ".webm",
  ".mpg",
  ".mpeg",
]);

const MAX_SCAN_PER_CATEGORY = {
  commercials: 80,
  shorts: 60,
  music: 60,
  episodes: 80,
  movies: 120,
} as const;

type PlayerTestMediaPools = {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
  episodes: Episode[];
  movies: Movie[];
};

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSupportedMediaFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

function getCadenceDurationLimit(duration: number): number {
  const slot = 30 * 60;
  return Math.max(slot, Math.ceil(duration / slot) * slot);
}

async function listFilesRecursive(rootPath: string): Promise<string[]> {
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const discovered: string[] = [];
  const stack: string[] = [rootPath];

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: fs.Dirent[] = [];

    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && isSupportedMediaFile(fullPath)) {
        discovered.push(fullPath);
      }
    }
  }

  return discovered.sort((a, b) => a.localeCompare(b));
}

async function toDurationSeconds(filePath: string): Promise<number | null> {
  const probe = await probeMediaMetadataHandler(filePath);
  if (!probe.isPlayable || !probe.durationSeconds) {
    return null;
  }

  const rounded = Math.floor(probe.durationSeconds);
  if (!Number.isFinite(rounded) || rounded <= 0) {
    return null;
  }

  return rounded;
}

async function buildMediaItemsFromFiles<T>(
  filePaths: string[],
  makeItem: (filePath: string, duration: number, index: number) => T,
  maxItems: number,
): Promise<T[]> {
  const results: T[] = [];

  for (let index = 0; index < filePaths.length; index += 1) {
    if (results.length >= maxItems) {
      break;
    }

    const filePath = filePaths[index];
    const duration = await toDurationSeconds(filePath);
    if (!duration) {
      continue;
    }

    results.push(makeItem(filePath, duration, results.length));
  }

  return results;
}

async function buildPlayerTestMediaPools(): Promise<PlayerTestMediaPools> {
  const [commercialFiles, shortFiles, musicFiles, movieFiles, allShowFiles] =
    await Promise.all([
      listFilesRecursive(TEST_MEDIA_ROOTS.commercials),
      listFilesRecursive(TEST_MEDIA_ROOTS.shorts),
      listFilesRecursive(TEST_MEDIA_ROOTS.music),
      listFilesRecursive(TEST_MEDIA_ROOTS.movies),
      listFilesRecursive(TEST_MEDIA_ROOTS.shows),
    ]);

  const areYouAfraidToken = normalizeForMatch("Are You Afraid of the Dark");
  const areYouAfraidFiles = allShowFiles.filter((filePath) =>
    normalizeForMatch(filePath).includes(areYouAfraidToken),
  );

  const commercials = await buildMediaItemsFromFiles(
    commercialFiles,
    (filePath, duration, index) => ({
      mediaItemId: `test-commercial-${index + 1}`,
      title: path.parse(filePath).name,
      path: filePath,
      duration,
      isHolidayExclusive: false,
      type: MediaType.Commercial,
      tags: [],
    }),
    MAX_SCAN_PER_CATEGORY.commercials,
  );

  const shorts = await buildMediaItemsFromFiles(
    shortFiles,
    (filePath, duration, index) => ({
      mediaItemId: `test-short-${index + 1}`,
      title: path.parse(filePath).name,
      path: filePath,
      duration,
      isHolidayExclusive: false,
      type: MediaType.Short,
      tags: [],
    }),
    MAX_SCAN_PER_CATEGORY.shorts,
  );

  const music = await buildMediaItemsFromFiles(
    musicFiles,
    (filePath, duration, index) => ({
      mediaItemId: `test-music-${index + 1}`,
      title: path.parse(filePath).name,
      path: filePath,
      duration,
      isHolidayExclusive: false,
      type: MediaType.Music,
      tags: [],
    }),
    MAX_SCAN_PER_CATEGORY.music,
  );

  const movies = await buildMediaItemsFromFiles(
    movieFiles,
    (filePath, duration, index) => ({
      mediaItemId: `test-movie-${index + 1}`,
      title: path.parse(filePath).name,
      path: filePath,
      duration,
      durationLimit: getCadenceDurationLimit(duration),
      isHolidayExclusive: false,
      type: MediaType.Movie,
      tags: [],
      collections: [],
    }),
    MAX_SCAN_PER_CATEGORY.movies,
  );

  const showId = "test-show-are-you-afraid-of-the-dark";
  const episodes = await buildMediaItemsFromFiles(
    areYouAfraidFiles,
    (filePath, duration, index) => ({
      mediaItemId: `test-episode-${index + 1}`,
      showItemId: showId,
      episodeNumber: index + 1,
      title: path.parse(filePath).name,
      path: filePath,
      duration,
      durationLimit: getCadenceDurationLimit(duration),
      overDuration: false,
      type: MediaType.Episode,
      tags: [],
    }),
    MAX_SCAN_PER_CATEGORY.episodes,
  );

  return { commercials, shorts, music, episodes, movies };
}

function chooseBufferItemsForDuration(
  durationSeconds: number,
  pool: (Commercial | Short | Music)[],
  nextIndexRef: { value: number },
): (Commercial | Short | Music)[] {
  if (durationSeconds <= 0 || pool.length === 0) {
    return [];
  }

  const selected: (Commercial | Short | Music)[] = [];
  let remaining = durationSeconds;
  let guard = 0;

  while (remaining > 5 && guard < 500) {
    const candidate = pool[nextIndexRef.value % pool.length];
    nextIndexRef.value += 1;
    guard += 1;

    if (!candidate?.duration || candidate.duration <= 0) {
      continue;
    }

    if (candidate.duration <= remaining + 5) {
      selected.push(candidate);
      remaining -= candidate.duration;
      continue;
    }

    if (remaining < 20) {
      break;
    }
  }

  return selected;
}

function interleaveAnchors(
  episodes: Episode[],
  movies: Movie[],
): (Episode | Movie)[] {
  if (episodes.length === 0) {
    return [...movies];
  }

  if (movies.length === 0) {
    return [...episodes];
  }

  const anchors: (Episode | Movie)[] = [];
  const maxLength = Math.max(episodes.length, movies.length);
  for (let i = 0; i < maxLength; i += 1) {
    if (episodes[i]) {
      anchors.push(episodes[i]);
    }
    if (movies[i]) {
      anchors.push(movies[i]);
    }
  }

  return anchors;
}

function resetStreamStateForTest(): void {
  streamManager.setOnDeck([]);
  streamManager.setUpcoming([]);
  playerManager.replacePlayerQueueFromFilePaths([]);
}

function publishDeckState(blocks: MediaBlock[]): void {
  streamManager.setOnDeck([]);
  streamManager.setUpcoming([]);

  if (blocks.length > 0) {
    streamManager.addItemToOnDeck([blocks[0]]);
  }

  if (blocks.length > 1) {
    streamManager.addItemToOnDeck([blocks[1]]);
  }

  if (blocks.length > 2) {
    streamManager.addToUpcomingStream(blocks.slice(2));
  }
}

function collectBufferPool(
  pools: PlayerTestMediaPools,
): (Commercial | Short | Music)[] {
  return [...pools.commercials, ...pools.shorts, ...pools.music];
}

async function enqueueBlocks(blocks: MediaBlock[]): Promise<void> {
  for (const block of blocks) {
    await playerManager.addMediaBlockToPlayer(block);
  }
}

async function buildCadencedPlayerTestBlocks(
  anchors: (Episode | Movie)[],
  pools: PlayerTestMediaPools,
  startTimepoint: number,
  endTimepoint: number,
): Promise<MediaBlock[]> {
  const blocks: MediaBlock[] = [];
  const bufferPool = collectBufferPool(pools);
  const bufferCursor = { value: 0 };

  let current = startTimepoint;
  let anchorCursor = 0;

  const nextCadence = findNextCadenceTime(startTimepoint);
  if (nextCadence > startTimepoint) {
    const leadDuration = nextCadence - startTimepoint;
    const leadBuffer = chooseBufferItemsForDuration(
      leadDuration,
      bufferPool,
      bufferCursor,
    );
    blocks.push(createMediaBlock(leadBuffer, undefined, startTimepoint));
    current = nextCadence;
  }

  while (current < endTimepoint && anchors.length > 0) {
    const anchor = anchors[anchorCursor % anchors.length];
    anchorCursor += 1;

    blocks.push(createMediaBlock([], anchor, current));

    const slotSize = Math.max(anchor.durationLimit, anchor.duration);
    const bufferWindow = Math.max(0, slotSize - anchor.duration);
    const bufferStart = current + anchor.duration;

    if (bufferWindow > 0 && bufferStart < endTimepoint) {
      const bufferItems = chooseBufferItemsForDuration(
        Math.min(bufferWindow, endTimepoint - bufferStart),
        bufferPool,
        bufferCursor,
      );

      if (bufferItems.length > 0) {
        blocks.push(createMediaBlock(bufferItems, undefined, bufferStart));
      }
    }

    current += slotSize;
  }

  return blocks;
}

async function buildUncadencedPlayerTestBlocks(
  anchors: (Episode | Movie)[],
  startTimepoint: number,
  endTimepoint: number,
): Promise<MediaBlock[]> {
  const blocks: MediaBlock[] = [];
  let current = startTimepoint;
  let anchorCursor = 0;

  while (current < endTimepoint && anchors.length > 0) {
    const anchor = anchors[anchorCursor % anchors.length];
    anchorCursor += 1;

    blocks.push(createMediaBlock([], anchor, current));
    current += Math.max(1, anchor.duration);
  }

  return blocks;
}

export async function buildFilesystemAdhocPlayerTestStream(
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint: number,
): Promise<[MediaBlock[], string]> {
  const pools = await buildPlayerTestMediaPools();
  const anchors = interleaveAnchors(pools.episodes, pools.movies);

  if (anchors.length === 0) {
    return [
      [],
      "Filesystem player test could not find playable movies or 'Are You Afraid of the Dark' episodes.",
    ];
  }

  const startTimepoint = Math.floor(Date.now() / 1000);
  const boundedEnd = Math.max(endTimepoint, startTimepoint + 30 * 60);

  let blocks: MediaBlock[] = [];
  if (streamConstructionOptions.Cadence) {
    blocks = await buildCadencedPlayerTestBlocks(
      anchors,
      pools,
      startTimepoint,
      boundedEnd,
    );
  } else {
    blocks = await buildUncadencedPlayerTestBlocks(
      anchors,
      startTimepoint,
      boundedEnd,
    );
  }

  if (blocks.length === 0) {
    return [[], "Filesystem player test did not produce any media blocks."];
  }

  resetStreamStateForTest();
  await enqueueBlocks(blocks);
  playerManager.selectPlayerQueueItem(0);
  publishDeckState(blocks);

  streamManager.setContinuousStream(false);
  streamManager.setAdhocStream(true);
  streamManager.setAdhocStreamEndTimepoint(endTimepoint);
  streamManager.setContinuousStreamArgs({
    StreamType: StreamType.Adhoc,
    Cadence: streamConstructionOptions.Cadence,
    Themed: false,
    AdhocStartFromBeginning:
      streamConstructionOptions.AdhocStartFromBeginning ?? true,
  } as IStreamRequest);

  return [blocks, ""];
}
