import * as streamManager from "./streamManager.js";
import { createBuffer } from "./bufferConstructor.js";
import { tagRepository } from "../repositories/tagsRepository.js";
import { normalizationDefaults } from "./normalization/normalizationDefaults.js";

interface BoundaryRealignmentResult {
  boundaryIndex: number;
  driftSec: number;
  action: "none" | "soft-trim" | "soft-extend" | "hard-rebuild";
  postDriftSec: number;
}

export interface CadenceRealignmentSummary {
  checkedBoundaries: number;
  correctedBoundaries: number;
  results: BoundaryRealignmentResult[];
}

type BufferItem = Promo | Music | Short | Commercial | Bumper;

function getItemDurationSeconds(item: BufferItem): number {
  return item.duration || 0;
}

function getBufferDurationSeconds(items: BufferItem[]): number {
  return items.reduce((sum, item) => sum + getItemDurationSeconds(item), 0);
}

function getRequiredFillerSeconds(
  currentBlock: MediaBlock,
  nextBlock: MediaBlock,
): number {
  const anchorDuration = currentBlock.anchorMedia?.duration || 0;
  const gap = nextBlock.startTime - (currentBlock.startTime + anchorDuration);
  return Math.max(0, gap);
}

function getPriority(item: BufferItem): number {
  switch (item.type) {
    case "Commercial":
      return 1;
    case "Promo":
      return 2;
    case "Music":
      return 3;
    case "Short":
      return 4;
    case "Bumper":
      return 5;
    default:
      return 10;
  }
}

function trimBufferByPriority(
  sourceBuffer: BufferItem[],
  secondsToTrim: number,
): BufferItem[] {
  if (secondsToTrim <= 0 || sourceBuffer.length === 0) {
    return sourceBuffer;
  }

  const ranked = sourceBuffer
    .map((item, index) => ({ item, index, priority: getPriority(item) }))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      // For equal priority, remove from the tail first.
      return right.index - left.index;
    });

  let trimmed = 0;
  const removeIndexes = new Set<number>();

  for (const entry of ranked) {
    if (trimmed >= secondsToTrim) {
      break;
    }

    removeIndexes.add(entry.index);
    trimmed += getItemDurationSeconds(entry.item);
  }

  return sourceBuffer.filter((_, index) => !removeIndexes.has(index));
}

function extendBuffer(
  currentBlock: MediaBlock,
  nextBlock: MediaBlock,
  secondsToAdd: number,
): BufferItem[] {
  if (secondsToAdd <= 0) {
    return [];
  }

  const dateString = new Date(currentBlock.startTime * 1000)
    .toISOString()
    .substring(0, 10);
  const activeHolidayTags = tagRepository.findActiveHolidaysByDate(dateString);

  const halfATags = currentBlock.anchorMedia?.tags || [];
  const halfBTags = nextBlock.anchorMedia?.tags || [];

  const extension = createBuffer(
    secondsToAdd,
    halfATags,
    halfBTags,
    activeHolidayTags,
    currentBlock.startTime,
  );

  return extension.buffer;
}

function rebuildBoundaryBuffer(
  currentBlock: MediaBlock,
  nextBlock: MediaBlock,
  requiredFillerSec: number,
): BufferItem[] {
  if (requiredFillerSec <= 0) {
    return [];
  }

  const dateString = new Date(currentBlock.startTime * 1000)
    .toISOString()
    .substring(0, 10);
  const activeHolidayTags = tagRepository.findActiveHolidaysByDate(dateString);

  const halfATags = currentBlock.anchorMedia?.tags || [];
  const halfBTags = nextBlock.anchorMedia?.tags || [];

  const rebuilt = createBuffer(
    requiredFillerSec,
    halfATags,
    halfBTags,
    activeHolidayTags,
    currentBlock.startTime,
  );

  return rebuilt.buffer;
}

function correctBoundary(
  currentBlock: MediaBlock,
  nextBlock: MediaBlock,
  boundaryIndex: number,
): BoundaryRealignmentResult {
  const requiredFillerSec = getRequiredFillerSeconds(currentBlock, nextBlock);
  const actualFillerSec = getBufferDurationSeconds(currentBlock.buffer);
  const driftSec = actualFillerSec - requiredFillerSec;
  const absDrift = Math.abs(driftSec);

  if (absDrift <= normalizationDefaults.DRIFT_TOLERANCE_SEC) {
    return {
      boundaryIndex,
      driftSec,
      action: "none",
      postDriftSec: driftSec,
    };
  }

  const maxAdjust = normalizationDefaults.MAX_FILLER_ADJUST_PER_BOUNDARY_SEC;
  const hardThreshold = normalizationDefaults.DRIFT_HARD_CORRECTION_SEC;

  if (absDrift > hardThreshold) {
    currentBlock.buffer = rebuildBoundaryBuffer(
      currentBlock,
      nextBlock,
      requiredFillerSec,
    );

    const postDrift =
      getBufferDurationSeconds(currentBlock.buffer) - requiredFillerSec;

    return {
      boundaryIndex,
      driftSec,
      action: "hard-rebuild",
      postDriftSec: postDrift,
    };
  }

  if (driftSec > 0) {
    const trimmedBuffer = trimBufferByPriority(
      currentBlock.buffer,
      Math.min(driftSec, maxAdjust),
    );
    currentBlock.buffer = trimmedBuffer;

    const postDrift =
      getBufferDurationSeconds(currentBlock.buffer) - requiredFillerSec;

    return {
      boundaryIndex,
      driftSec,
      action: "soft-trim",
      postDriftSec: postDrift,
    };
  }

  const extension = extendBuffer(
    currentBlock,
    nextBlock,
    Math.min(Math.abs(driftSec), maxAdjust),
  );
  currentBlock.buffer = [...currentBlock.buffer, ...extension];

  const postDrift =
    getBufferDurationSeconds(currentBlock.buffer) - requiredFillerSec;

  return {
    boundaryIndex,
    driftSec,
    action: "soft-extend",
    postDriftSec: postDrift,
  };
}

export function realignCadencedUpcomingBoundaries(
  currentUnixTimestamp: number,
): CadenceRealignmentSummary | null {
  const args = streamManager.getContinuousStreamArgs();
  if (!args?.Cadence) {
    return null;
  }

  const upcoming = streamManager.getUpcomingStream();
  if (upcoming.length < 2) {
    return null;
  }

  const maxBlocks = normalizationDefaults.REALIGNMENT_LOOKAHEAD_BLOCKS;
  const windowEnd = Math.min(upcoming.length - 1, maxBlocks);

  const results: BoundaryRealignmentResult[] = [];

  for (let i = 0; i < windowEnd; i += 1) {
    const current = upcoming[i];
    const next = upcoming[i + 1];

    if (!current.anchorMedia || !next.anchorMedia) {
      continue;
    }

    if (next.startTime <= currentUnixTimestamp) {
      continue;
    }

    const result = correctBoundary(current, next, i);
    results.push(result);
  }

  if (results.length === 0) {
    return null;
  }

  const correctedBoundaries = results.filter(
    (result) => result.action !== "none",
  ).length;

  return {
    checkedBoundaries: results.length,
    correctedBoundaries,
    results,
  };
}
