import fs from "fs";
import FfmpegCommand from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const resolvedFfprobePath =
  typeof ffprobeStatic === "string" ? ffprobeStatic : ffprobeStatic.path;

if (ffmpegPath) {
  FfmpegCommand.setFfmpegPath(String(ffmpegPath));
}

if (resolvedFfprobePath) {
  FfmpegCommand.setFfprobePath(resolvedFfprobePath);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export async function probeMediaMetadataHandler(
  filePath: string,
): Promise<MediaProbeResult> {
  if (!filePath) {
    return {
      filePath,
      isPlayable: false,
      errorMessage: "No file path provided.",
    };
  }

  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      isPlayable: false,
      errorMessage: "File does not exist on disk.",
    };
  }

  return await new Promise((resolve) => {
    FfmpegCommand.ffprobe(filePath, (error, metadata) => {
      if (error || !metadata) {
        resolve({
          filePath,
          isPlayable: false,
          errorMessage: error?.message ?? "Failed to probe media metadata.",
        });
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );
      const audioStream = metadata.streams.find(
        (stream) => stream.codec_type === "audio",
      );

      resolve({
        filePath,
        isPlayable: Boolean(videoStream || audioStream),
        container: metadata.format.format_name,
        durationSeconds:
          toNumber(metadata.format.duration) ??
          toNumber(videoStream?.duration) ??
          toNumber(audioStream?.duration),
        bitrate: toNumber(metadata.format.bit_rate),
        videoCodec: videoStream?.codec_name,
        audioCodec: audioStream?.codec_name,
        width: toNumber(videoStream?.width),
        height: toNumber(videoStream?.height),
      });
    });
  });
}
