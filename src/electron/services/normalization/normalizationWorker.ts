import { probeMediaMetadataHandler } from "../../handlers/mediaProbeHandlers.js";
import { ensureElectronPlayablePath } from "../ffmpegPlaybackProxy.js";
import { normalizationDefaults } from "./normalizationDefaults.js";
import { NormalizationJob } from "./normalizationJobFactory.js";

export type NormalizationStrategy =
  | "passthrough"
  | "remux"
  | "transcode"
  | "audio-transcode";

export interface NormalizationResult {
  jobId: string;
  sourcePath: string;
  normalizedPath: string;
  strategy: NormalizationStrategy;
  estimatedSeconds: number;
}

function isAlreadyChromiumPlayable(probe: MediaProbeResult): boolean {
  const container = (probe.container || "").toLowerCase();
  const videoCodec = (probe.videoCodec || "").toLowerCase();
  const audioCodec = (probe.audioCodec || "").toLowerCase();

  const mp4Like =
    container.includes("mp4") ||
    container.includes("mov") ||
    container.includes("m4v");
  const videoOk = !videoCodec || videoCodec === "h264" || videoCodec === "avc1";
  const audioOk =
    !audioCodec ||
    audioCodec === "aac" ||
    audioCodec === "mp3" ||
    audioCodec === "mp4a";

  return mp4Like && videoOk && audioOk;
}

function canRemuxForChromium(probe: MediaProbeResult): boolean {
  const videoCodec = (probe.videoCodec || "").toLowerCase();
  const audioCodec = (probe.audioCodec || "").toLowerCase();

  const videoCopyable =
    !videoCodec || videoCodec === "h264" || videoCodec === "avc1";
  const audioCopyable =
    !audioCodec ||
    audioCodec === "aac" ||
    audioCodec === "mp3" ||
    audioCodec === "mp4a";

  return videoCopyable && audioCopyable;
}

function getSpeedMultiplier(height?: number): number {
  if (!height || height <= 0) {
    return normalizationDefaults.TRANSCODE_SPEED_HD_X;
  }

  if (height <= 576) {
    return normalizationDefaults.TRANSCODE_SPEED_SD_X;
  }

  if (height <= 1080) {
    return normalizationDefaults.TRANSCODE_SPEED_HD_X;
  }

  return normalizationDefaults.TRANSCODE_SPEED_UHD_X;
}

export function estimateNormalizationSeconds(
  probe: MediaProbeResult,
  fallbackDurationSeconds: number,
): number {
  const durationSeconds = Math.max(
    probe.durationSeconds || 0,
    fallbackDurationSeconds || 0,
  );

  if (isAlreadyChromiumPlayable(probe)) {
    return 0;
  }

  if (canRemuxForChromium(probe)) {
    return normalizationDefaults.REMUX_ESTIMATE_SEC;
  }

  const speed = getSpeedMultiplier(probe.height);
  return Math.max(
    normalizationDefaults.REMUX_ESTIMATE_SEC,
    durationSeconds / speed +
      normalizationDefaults.TRANSCODE_ESTIMATE_OVERHEAD_SEC,
  );
}

export async function estimateNormalizationSecondsForMediaPath(
  sourcePath: string,
  fallbackDurationSeconds: number,
): Promise<number> {
  const probe = await probeMediaMetadataHandler(sourcePath);

  if (!probe.isPlayable) {
    return Number.POSITIVE_INFINITY;
  }

  return estimateNormalizationSeconds(probe, fallbackDurationSeconds);
}

export function determineNormalizationStrategy(
  probe: MediaProbeResult,
): NormalizationStrategy {
  const hasVideo = !!probe.videoCodec;

  if (isAlreadyChromiumPlayable(probe)) {
    return "passthrough";
  }

  if (!hasVideo) {
    return "audio-transcode";
  }

  if (canRemuxForChromium(probe)) {
    return "remux";
  }

  return "transcode";
}

export async function normalizeJob(
  job: NormalizationJob,
): Promise<NormalizationResult> {
  const probe = await probeMediaMetadataHandler(job.sourcePath);

  if (!probe.isPlayable) {
    throw new Error(
      `[NormalizationWorker] Media probe failed for ${job.sourcePath}: ${probe.errorMessage || "Unknown probe error"}`,
    );
  }

  const strategy = determineNormalizationStrategy(probe);
  const estimatedSeconds = estimateNormalizationSeconds(
    probe,
    job.expectedDurationSeconds,
  );

  const normalizedPath = await ensureElectronPlayablePath(job.sourcePath);

  return {
    jobId: job.jobId,
    sourcePath: job.sourcePath,
    normalizedPath,
    strategy,
    estimatedSeconds,
  };
}
