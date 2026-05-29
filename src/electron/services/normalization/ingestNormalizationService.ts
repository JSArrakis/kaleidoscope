import { normalizationQueue } from "./normalizationQueue.js";
import { NormalizationJob } from "./normalizationJobFactory.js";

type IngestMediaItem = {
  mediaItemId?: string;
  title?: string;
  path?: string;
  type?: string;
  duration?: number;
  durationLimit?: number;
};

function createIngestJob(mediaItem: IngestMediaItem): NormalizationJob | null {
  if (!mediaItem.path) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const mediaId = mediaItem.mediaItemId || mediaItem.path;

  return {
    jobId: `ingest:${mediaId}:${now}`,
    sourcePath: mediaItem.path,
    title: mediaItem.title || mediaItem.path,
    mediaType: mediaItem.type || "Unknown",
    isBuffer: false,
    blockStartTime: now,
    expectedDurationSeconds: mediaItem.duration || mediaItem.durationLimit || 0,
    sequence: 0,
  };
}

export function enqueueIngestNormalization(mediaItem: IngestMediaItem): void {
  const job = createIngestJob(mediaItem);
  if (!job) {
    return;
  }

  const queued = normalizationQueue.enqueue([job]);
  if (queued > 0) {
    console.log(
      `[IngestNormalization] Queued mediaItemId=${mediaItem.mediaItemId || "unknown"} path=${mediaItem.path}`,
    );
  }
}

export function enqueueIngestNormalizationForShow(show: Show): void {
  if (!show.episodes || show.episodes.length === 0) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const jobs: NormalizationJob[] = [];

  for (let index = 0; index < show.episodes.length; index += 1) {
    const episode = show.episodes[index];
    if (!episode.path) {
      continue;
    }

    jobs.push({
      jobId: `ingest:show:${show.mediaItemId}:${episode.mediaItemId}:${now}`,
      sourcePath: episode.path,
      title: episode.title || `${show.title} Episode ${index + 1}`,
      mediaType: episode.type || "Episode",
      isBuffer: false,
      blockStartTime: now,
      expectedDurationSeconds: episode.duration || episode.durationLimit || 0,
      sequence: index,
    });
  }

  if (jobs.length === 0) {
    return;
  }

  const queued = normalizationQueue.enqueue(jobs);
  if (queued > 0) {
    console.log(
      `[IngestNormalization] Queued show mediaItemId=${show.mediaItemId} jobs=${queued}/${jobs.length}`,
    );
  }
}
