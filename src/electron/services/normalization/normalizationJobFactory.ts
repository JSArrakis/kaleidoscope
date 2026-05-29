import { MediaBlock } from "../../types/MediaBlock.js";

export interface NormalizationJob {
  jobId: string;
  sourcePath: string;
  title: string;
  mediaType: string;
  isBuffer: boolean;
  blockStartTime: number;
  expectedDurationSeconds: number;
  sequence: number;
}

type SupportedQueueMedia = {
  path?: string;
  title?: string;
  type?: string;
  duration?: number;
  durationLimit?: number;
  mediaItemId?: string;
};

function toSupportedQueueMedia(item: unknown): SupportedQueueMedia | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  return item as SupportedQueueMedia;
}

function getExpectedDurationSeconds(item: SupportedQueueMedia): number {
  if (typeof item.duration === "number" && Number.isFinite(item.duration)) {
    return item.duration;
  }

  if (
    typeof item.durationLimit === "number" &&
    Number.isFinite(item.durationLimit)
  ) {
    return item.durationLimit;
  }

  return 0;
}

function createJob(
  mediaItem: SupportedQueueMedia,
  mediaBlock: MediaBlock,
  isBuffer: boolean,
  positionInBlock: number,
  sequence: number,
): NormalizationJob | null {
  if (!mediaItem.path) {
    return null;
  }

  const mediaItemId = mediaItem.mediaItemId || mediaItem.path;

  return {
    jobId: `${mediaBlock.startTime}:${isBuffer ? "buffer" : "anchor"}:${positionInBlock}:${mediaItemId}`,
    sourcePath: mediaItem.path,
    title: mediaItem.title || mediaItem.path,
    mediaType: mediaItem.type || "Unknown",
    isBuffer,
    blockStartTime: mediaBlock.startTime,
    expectedDurationSeconds: getExpectedDurationSeconds(mediaItem),
    sequence,
  };
}

export function createNormalizationJobsFromBlocks(
  mediaBlocks: MediaBlock[],
): NormalizationJob[] {
  const jobs: NormalizationJob[] = [];
  let sequence = 0;

  for (const mediaBlock of mediaBlocks) {
    for (let index = 0; index < mediaBlock.buffer.length; index += 1) {
      const mediaItem = toSupportedQueueMedia(mediaBlock.buffer[index]);
      if (!mediaItem) {
        continue;
      }

      const job = createJob(mediaItem, mediaBlock, true, index, sequence);
      if (job) {
        jobs.push(job);
        sequence += 1;
      }
    }

    if (mediaBlock.anchorMedia) {
      const anchorMedia = toSupportedQueueMedia(mediaBlock.anchorMedia);
      if (anchorMedia) {
        const job = createJob(
          anchorMedia,
          mediaBlock,
          false,
          mediaBlock.buffer.length,
          sequence,
        );
        if (job) {
          jobs.push(job);
          sequence += 1;
        }
      }
    }
  }

  return jobs;
}
