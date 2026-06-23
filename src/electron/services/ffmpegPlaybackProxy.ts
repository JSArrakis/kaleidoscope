import fs from "fs";
import path from "path";
import crypto from "crypto";
import FfmpegCommand from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { app } from "electron";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";

const resolvedFfprobePath =
  typeof ffprobeStatic === "string" ? ffprobeStatic : ffprobeStatic.path;

if (ffmpegPath) {
  FfmpegCommand.setFfmpegPath(String(ffmpegPath));
}

if (resolvedFfprobePath) {
  FfmpegCommand.setFfprobePath(resolvedFfprobePath);
}

// Bootstrap pool cache (pre-warmed anchors → ffmpeg-playback-cache/)
const playablePathCache = new Map<string, string>();
const inFlightConversions = new Map<string, Promise<string>>();

// Stream playback cache (on-deck transcodes → ffmpeg-stream-cache/)
const streamPlayablePathCache = new Map<string, string>();
const inFlightStreamConversions = new Map<string, Promise<string>>();

// Hardware encoder detection cache
let detectedHardwareEncoder: string | null | undefined = undefined;

/**
 * Detects available hardware video encoder.
 *
 * Priority order chosen for minimum impact on concurrent gaming / heavy workloads:
 *  1. QSV  — Intel iGPU encoder. Completely separate from any discrete gaming GPU,
 *             so transcoding has zero impact on frame rates.
 *  2. NVENC — NVIDIA dedicated encoder chip. Does not use shader cores, so gaming
 *             impact is minimal even when the GPU is under load.
 *  3. AMF  — AMD dedicated encoder chip (Radeon GPUs and Ryzen APUs).
 *             Same story as NVENC for AMD hardware.
 *  4. null  — Fall back to software (libx264). Only runs one encode at a time
 *             (NORMALIZATION_WORKERS=1) to keep CPU headroom for other tasks.
 */
function detectHardwareEncoder(): Promise<string | null> {
  if (detectedHardwareEncoder !== undefined) {
    return Promise.resolve(detectedHardwareEncoder);
  }

  return new Promise((resolve) => {
    if (!ffmpegPath) {
      console.log(
        "[FFmpegProxy] No ffmpeg path available, using software encoding",
      );
      detectedHardwareEncoder = null;
      resolve(null);
      return;
    }

    const testEncoders = [
      { name: "h264_qsv",  label: "Intel Quick Sync" },
      { name: "h264_nvenc", label: "NVIDIA NVENC" },
      { name: "h264_amf",  label: "AMD AMF" },
    ];

    const testEncoder = (index: number): void => {
      if (index >= testEncoders.length) {
        console.log(
          "[FFmpegProxy] No hardware encoder available, using software (libx264)",
        );
        detectedHardwareEncoder = null;
        resolve(null);
        return;
      }

      const encoder = testEncoders[index];
      console.log(
        `[FFmpegProxy] Testing ${encoder.label} (${encoder.name})...`,
      );

      FfmpegCommand()
        .input("color=black:s=64x64:d=0.1")
        .inputFormat("lavfi")
        .videoCodec(encoder.name)
        .outputOptions(["-f", "null"])
        .output("-")
        .on("error", (err) => {
          console.log(
            `[FFmpegProxy] ${encoder.label} not available - ${err.message}`,
          );
          testEncoder(index + 1);
        })
        .on("end", () => {
          console.log(
            `[FFmpegProxy] ✓ Using ${encoder.label} hardware acceleration`,
          );
          detectedHardwareEncoder = encoder.name;
          resolve(encoder.name);
        })
        .run();
    };

    testEncoder(0);
  });
}

function getCacheRoot(): string {
  const root = path.join(app.getPath("userData"), "ffmpeg-playback-cache");
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
    console.log(`[FFmpegProxy] Created cache root: ${root}`);
  }
  return root;
}

function getStreamCacheRoot(): string {
  const root = path.join(app.getPath("userData"), "ffmpeg-stream-cache");
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
    console.log(`[FFmpegProxy] Created stream cache root: ${root}`);
  }
  return root;
}

function createCacheKey(filePath: string): string {
  const stats = fs.statSync(filePath);
  const signature = `${filePath}|${stats.size}|${stats.mtimeMs}`;
  return crypto.createHash("sha1").update(signature).digest("hex");
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

async function isValidCachedOutput(outputPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(outputPath)) {
      return false;
    }

    const stats = fs.statSync(outputPath);
    if (!stats.isFile() || stats.size <= 0) {
      return false;
    }

    const probe = await probeMediaMetadataHandler(outputPath);
    if (!probe.isPlayable) {
      return false;
    }

    return isAlreadyChromiumPlayable(probe);
  } catch {
    return false;
  }
}

function runFfmpegConversion(
  sourcePath: string,
  outputPath: string,
  hasVideo: boolean,
  canCopyStream: boolean,
  hardwareEncoder: string | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(
      `[FFmpegProxy] Starting conversion: ${sourcePath} -> ${outputPath} | hasVideo=${hasVideo} | copyStream=${canCopyStream} | encoder=${hardwareEncoder || "libx264"}`,
    );
    const command = FfmpegCommand(sourcePath)
      .outputOptions(["-movflags", "+faststart"])
      .on("start", (cmd) => {
        console.log(`[FFmpegProxy] ffmpeg cmd: ${cmd}`);
      })
      .on("progress", (progress) => {
        const pct =
          typeof progress.percent === "number"
            ? progress.percent.toFixed(2)
            : "n/a";
        console.log(
          `[FFmpegProxy] progress=${pct}% timemark=${progress.timemark}`,
        );
      })
      .on("error", (error) => {
        console.error(`[FFmpegProxy] Conversion error: ${error.message}`);
        reject(error);
      })
      .on("end", () => {
        console.log(`[FFmpegProxy] Conversion complete: ${outputPath}`);
        resolve(outputPath);
      });

    if (hasVideo) {
      if (canCopyStream) {
        command.videoCodec("copy").audioCodec("copy");
      } else {
        // Use hardware encoder if available, otherwise software
        const videoCodec = hardwareEncoder || "libx264";
        command.videoCodec(videoCodec).audioCodec("aac");

        // Hardware-specific encoding options — fastest presets to minimise
        // impact on concurrent gaming and other heavy workloads.
        if (hardwareEncoder === "h264_qsv") {
          // Intel Quick Sync — veryfast preset, low lookahead to cut CPU overhead
          command.outputOptions([
            "-preset", "veryfast",
            "-global_quality", "28",
            "-look_ahead", "0",   // disables lookahead analysis (saves CPU)
          ]);
        } else if (hardwareEncoder === "h264_nvenc") {
          // NVIDIA NVENC — p1 (fastest) preset, no lookahead
          command.outputOptions([
            "-preset", "p1",      // p1=fastest (least GPU encoder load)
            "-tune",   "ll",      // low-latency tune reduces encoder buffer usage
            "-rc",     "vbr",
            "-cq",     "28",
            "-no-scenecut", "1", // skip scene-cut analysis, saves encoder overhead
          ]);
        } else if (hardwareEncoder === "h264_amf") {
          // AMD AMF — speed quality mode, no pre-analysis
          command.outputOptions([
            "-quality",       "speed",  // speed > balanced > quality
            "-rc",            "vbr_peak",
            "-qp_i",          "28",
            "-qp_p",          "28",
            "-preanalysis",   "false",  // disable pre-analysis to cut GPU overhead
          ]);
        } else {
          // Software libx264 — ultrafast burns through the encode with minimal analysis
          command.outputOptions([
            "-preset", "ultrafast",
            "-tune",   "fastdecode",
            "-crf",    "28",
          ]);
        }
      }
    } else {
      command.noVideo().audioCodec("aac");
    }

    command.save(outputPath);
  });
}

export async function ensureElectronPlayablePath(
  sourcePath: string,
): Promise<string> {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.warn(
      `[FFmpegProxy] Source path missing or not found, returning as-is: ${sourcePath}`,
    );
    return sourcePath;
  }

  const key = createCacheKey(sourcePath);
  const cached = playablePathCache.get(key);
  if (cached && fs.existsSync(cached)) {
    console.log(`[FFmpegProxy] Cache hit (memory): ${sourcePath} -> ${cached}`);
    return cached;
  }

  const existingInFlight = inFlightConversions.get(key);
  if (existingInFlight) {
    console.log(`[FFmpegProxy] Reusing in-flight conversion: ${sourcePath}`);
    return existingInFlight;
  }

  const conversionPromise = (async () => {
    const probe = await probeMediaMetadataHandler(sourcePath);
    console.log(
      `[FFmpegProxy] Probe result: container=${probe.container} video=${probe.videoCodec} audio=${probe.audioCodec} playable=${probe.isPlayable}`,
    );
    if (!probe.isPlayable) {
      console.warn(
        `[FFmpegProxy] Probe not playable, returning original: ${sourcePath}`,
      );
      return sourcePath;
    }

    const hasVideo = !!probe.videoCodec;

    if (isAlreadyChromiumPlayable(probe)) {
      playablePathCache.set(key, sourcePath);
      console.log(
        `[FFmpegProxy] Already Chromium-playable, no conversion: ${sourcePath}`,
      );
      return sourcePath;
    }

    const outputExtension = hasVideo ? ".mp4" : ".m4a";
    const outputPath = path.join(getCacheRoot(), `${key}${outputExtension}`);

    if (fs.existsSync(outputPath)) {
      const outputValid = await isValidCachedOutput(outputPath);
      if (outputValid) {
        playablePathCache.set(key, outputPath);
        console.log(
          `[FFmpegProxy] Cache hit (disk): ${sourcePath} -> ${outputPath}`,
        );
        return outputPath;
      }

      console.warn(
        `[FFmpegProxy] Cache file invalid, deleting and rebuilding: ${outputPath}`,
      );
      try {
        fs.unlinkSync(outputPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[FFmpegProxy] Failed deleting invalid cache: ${message}`);
      }
    }

    const canCopyStream =
      hasVideo &&
      ["h264", "avc1", "mpeg4"].includes(
        (probe.videoCodec || "").toLowerCase(),
      ) &&
      ["aac", "mp3", "mp4a", ""].includes(
        (probe.audioCodec || "").toLowerCase(),
      );

    console.log(
      `[FFmpegProxy] Conversion strategy for ${sourcePath}: ${canCopyStream ? "stream-copy remux" : "full transcode"}`,
    );

    // Detect hardware encoder before transcoding (only for non-copy operations)
    const hardwareEncoder = canCopyStream
      ? null
      : await detectHardwareEncoder();

    const convertedPath = await runFfmpegConversion(
      sourcePath,
      outputPath,
      hasVideo,
      canCopyStream,
      hardwareEncoder,
    );

    playablePathCache.set(key, convertedPath);
    return convertedPath;
  })();

  inFlightConversions.set(key, conversionPromise);
  console.log(`[FFmpegProxy] Conversion queued: ${sourcePath}`);

  try {
    return await conversionPromise;
  } finally {
    inFlightConversions.delete(key);
  }
}

export async function getCachedElectronPlayablePathIfReady(
  sourcePath: string,
): Promise<string | null> {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return null;
  }

  const key = createCacheKey(sourcePath);
  const memoryCached = playablePathCache.get(key);

  if (memoryCached && fs.existsSync(memoryCached)) {
    return memoryCached;
  }

  const probe = await probeMediaMetadataHandler(sourcePath);
  if (probe.isPlayable && isAlreadyChromiumPlayable(probe)) {
    playablePathCache.set(key, sourcePath);
    return sourcePath;
  }

  const hasVideo = !!probe.videoCodec;
  const outputExtension = hasVideo ? ".mp4" : ".m4a";
  const outputPath = path.join(getCacheRoot(), `${key}${outputExtension}`);

  if (!fs.existsSync(outputPath)) {
    return null;
  }

  const outputValid = await isValidCachedOutput(outputPath);
  if (!outputValid) {
    return null;
  }

  playablePathCache.set(key, outputPath);
  return outputPath;
}

/**
 * Ensures a source file is playable in Chromium for on-deck stream playback.
 *
 * Uses a dedicated stream cache (ffmpeg-stream-cache/) that is separate from
 * the bootstrap pre-warm pool (ffmpeg-playback-cache/).
 *
 * Resolution order:
 * 1. Stream memory cache — already resolved this session
 * 2. Bootstrap memory cache — pre-warmed by the bootstrap system
 * 3. Source is already Chromium-playable (passthrough, no transcode)
 * 4. Bootstrap disk cache — pre-transcoded file exists, reuse it
 * 5. Stream disk cache — transcoded in a previous session
 * 6. Transcode to stream cache now
 */
export async function ensureStreamPlayablePath(
  sourcePath: string,
): Promise<string> {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.warn(
      `[FFmpegProxy/Stream] Source path missing or not found, returning as-is: ${sourcePath}`,
    );
    return sourcePath;
  }

  const key = createCacheKey(sourcePath);

  // 1. Stream memory cache
  const streamCached = streamPlayablePathCache.get(key);
  if (streamCached && fs.existsSync(streamCached)) {
    console.log(
      `[FFmpegProxy/Stream] Memory cache hit: ${sourcePath} -> ${streamCached}`,
    );
    return streamCached;
  }

  // 2. Bootstrap memory cache (pre-warmed anchor)
  const bootstrapCached = playablePathCache.get(key);
  if (bootstrapCached && fs.existsSync(bootstrapCached)) {
    console.log(
      `[FFmpegProxy/Stream] Bootstrap memory hit: ${sourcePath} -> ${bootstrapCached}`,
    );
    streamPlayablePathCache.set(key, bootstrapCached);
    return bootstrapCached;
  }

  // 3. Deduplicate in-flight stream conversions
  const existingInFlight = inFlightStreamConversions.get(key);
  if (existingInFlight) {
    console.log(
      `[FFmpegProxy/Stream] Reusing in-flight conversion: ${sourcePath}`,
    );
    return existingInFlight;
  }

  const conversionPromise = (async () => {
    const probe = await probeMediaMetadataHandler(sourcePath);
    console.log(
      `[FFmpegProxy/Stream] Probe: container=${probe.container} video=${probe.videoCodec} audio=${probe.audioCodec} playable=${probe.isPlayable}`,
    );

    if (!probe.isPlayable) {
      console.warn(
        `[FFmpegProxy/Stream] Probe not playable, returning original: ${sourcePath}`,
      );
      return sourcePath;
    }

    const hasVideo = !!probe.videoCodec;
    const outputExtension = hasVideo ? ".mp4" : ".m4a";

    // Passthrough — already Chromium-playable, no transcode needed
    if (isAlreadyChromiumPlayable(probe)) {
      streamPlayablePathCache.set(key, sourcePath);
      console.log(
        `[FFmpegProxy/Stream] Already Chromium-playable, passthrough: ${sourcePath}`,
      );
      return sourcePath;
    }

    // Bootstrap disk cache — reuse pre-transcoded file, skip re-encoding
    const bootstrapOutputPath = path.join(
      getCacheRoot(),
      `${key}${outputExtension}`,
    );
    if (fs.existsSync(bootstrapOutputPath)) {
      const valid = await isValidCachedOutput(bootstrapOutputPath);
      if (valid) {
        streamPlayablePathCache.set(key, bootstrapOutputPath);
        playablePathCache.set(key, bootstrapOutputPath);
        console.log(
          `[FFmpegProxy/Stream] Reusing bootstrap-transcoded file: ${sourcePath} -> ${bootstrapOutputPath}`,
        );
        return bootstrapOutputPath;
      }
    }

    // Stream disk cache — reuse from a previous session
    const streamOutputPath = path.join(
      getStreamCacheRoot(),
      `${key}${outputExtension}`,
    );
    if (fs.existsSync(streamOutputPath)) {
      const valid = await isValidCachedOutput(streamOutputPath);
      if (valid) {
        streamPlayablePathCache.set(key, streamOutputPath);
        console.log(
          `[FFmpegProxy/Stream] Stream disk cache hit: ${sourcePath} -> ${streamOutputPath}`,
        );
        return streamOutputPath;
      }
      try {
        fs.unlinkSync(streamOutputPath);
      } catch {
        // Best-effort cleanup
      }
    }

    // Transcode to stream cache
    const canCopyStream =
      hasVideo &&
      ["h264", "avc1", "mpeg4"].includes(
        (probe.videoCodec || "").toLowerCase(),
      ) &&
      ["aac", "mp3", "mp4a", ""].includes(
        (probe.audioCodec || "").toLowerCase(),
      );

    console.log(
      `[FFmpegProxy/Stream] Transcoding to stream cache: ${sourcePath}`,
    );
    const hardwareEncoder = canCopyStream
      ? null
      : await detectHardwareEncoder();
    const convertedPath = await runFfmpegConversion(
      sourcePath,
      streamOutputPath,
      hasVideo,
      canCopyStream,
      hardwareEncoder,
    );

    streamPlayablePathCache.set(key, convertedPath);
    return convertedPath;
  })();

  inFlightStreamConversions.set(key, conversionPromise);
  console.log(`[FFmpegProxy/Stream] Queued stream conversion: ${sourcePath}`);

  try {
    return await conversionPromise;
  } finally {
    inFlightStreamConversions.delete(key);
  }
}

/**
 * Clears all pre-transcoded files from the cache directory and in-memory cache.
 * Returns the number of files deleted.
 */
export function clearAllPreTranscodedFiles(): number {
  const cacheRoot = getCacheRoot();
  let deletedCount = 0;

  // Clear in-memory cache
  playablePathCache.clear();
  console.log("[FFmpegProxy] Cleared in-memory playable path cache");

  // Delete all files in cache directory
  if (fs.existsSync(cacheRoot)) {
    const files = fs.readdirSync(cacheRoot);
    for (const file of files) {
      const filePath = path.join(cacheRoot, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.error(`[FFmpegProxy] Failed to delete ${filePath}:`, error);
      }
    }
    console.log(
      `[FFmpegProxy] Deleted ${deletedCount} pre-transcoded files from cache`,
    );
  }

  return deletedCount;
}
