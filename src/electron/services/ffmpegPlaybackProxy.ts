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

const playablePathCache = new Map<string, string>();
const inFlightConversions = new Map<string, Promise<string>>();

function getCacheRoot(): string {
  const root = path.join(app.getPath("userData"), "ffmpeg-playback-cache");
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
    console.log(`[FFmpegProxy] Created cache root: ${root}`);
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
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(
      `[FFmpegProxy] Starting conversion: ${sourcePath} -> ${outputPath} | hasVideo=${hasVideo} | copyStream=${canCopyStream}`,
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
        command
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions([
            "-preset",
            "ultrafast",
            "-tune",
            "fastdecode",
            "-crf",
            "28",
          ]);
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

    const convertedPath = await runFfmpegConversion(
      sourcePath,
      outputPath,
      hasVideo,
      canCopyStream,
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
