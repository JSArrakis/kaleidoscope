import { spawn } from "child_process";
import { DEFAULT_FFMPEG_STREAM_CONFIG, } from "./types.js";
// ============================================================================
// FFMPEG Process Manager
// Handles spawning, piping, and lifecycle of FFMPEG child processes.
// Each media item gets its own short-lived FFMPEG process that outputs
// MPEG-TS to stdout, which is piped to the HTTP stream server.
// ============================================================================
let config = { ...DEFAULT_FFMPEG_STREAM_CONFIG };
/**
 * Update the FFMPEG configuration
 */
export function setFFmpegConfig(newConfig) {
    config = { ...config, ...newConfig };
    console.log("[FFmpegProcess] Configuration updated");
}
/**
 * Get the current FFMPEG configuration
 */
export function getFFmpegConfig() {
    return { ...config };
}
// ============================================================================
// ffprobe — Media File Inspection
// ============================================================================
/**
 * Probe a media file to determine its codec, duration, resolution, etc.
 * Used to decide whether we can remux (fast) or must transcode (slow).
 */
export function probeMediaFile(filePath) {
    return new Promise((resolve, reject) => {
        const args = [
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            filePath,
        ];
        const proc = spawn(config.ffprobePath, args);
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        proc.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`ffprobe exited with code ${code}: ${stderr.slice(0, 500)}`));
                return;
            }
            try {
                const parsed = JSON.parse(stdout);
                const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
                const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
                const result = {
                    filePath,
                    duration: parseFloat(parsed.format?.duration || "0"),
                    videoCodec: videoStream?.codec_name || null,
                    audioCodec: audioStream?.codec_name || null,
                    width: videoStream ? parseInt(videoStream.width, 10) : null,
                    height: videoStream ? parseInt(videoStream.height, 10) : null,
                    videoBitrate: videoStream?.bit_rate
                        ? parseInt(videoStream.bit_rate, 10)
                        : null,
                    audioBitrate: audioStream?.bit_rate
                        ? parseInt(audioStream.bit_rate, 10)
                        : null,
                    frameRate: videoStream?.r_frame_rate
                        ? parseFrameRate(videoStream.r_frame_rate)
                        : null,
                    isCompatible: isCodecCompatible(videoStream?.codec_name, audioStream?.codec_name),
                };
                resolve(result);
            }
            catch (parseError) {
                reject(new Error(`Failed to parse ffprobe output: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
            }
        });
        proc.on("error", (err) => {
            reject(new Error(`Failed to spawn ffprobe: ${err.message}. Is ffprobe installed and in PATH?`));
        });
    });
}
// ============================================================================
// FFMPEG Process Spawning
// ============================================================================
/**
 * Spawn an FFMPEG process that reads a single media file and outputs
 * MPEG-TS to stdout. The caller pipes stdout to the HTTP response.
 *
 * Returns the ChildProcess so the caller can:
 * - pipe proc.stdout to the HTTP response
 * - listen for 'close' to know when to start the next item
 * - call proc.kill() to abort
 */
export function spawnFFmpegForItem(item, probeResult) {
    const args = buildFFmpegArgs(item, probeResult);
    console.log(`[FFmpegProcess] Spawning FFMPEG for: "${item.title}" (${item.mediaType})`);
    console.log(`[FFmpegProcess] Args: ${args.join(" ")}`);
    const proc = spawn(config.ffmpegPath, args, {
        stdio: ["pipe", "pipe", "pipe"], // stdin, stdout (MPEG-TS), stderr (logs)
    });
    proc.stderr?.on("data", (data) => {
        const line = data.toString().trim();
        // Only log non-progress lines to avoid spam
        if (line && !line.startsWith("frame=") && !line.startsWith("size=")) {
            console.log(`[FFmpegProcess] [stderr] ${line.slice(0, 200)}`);
        }
    });
    proc.on("error", (err) => {
        console.error(`[FFmpegProcess] Process error for "${item.title}": ${err.message}`);
    });
    proc.on("close", (code) => {
        if (code === 0 || code === 255) {
            // 255 = killed intentionally (during transitions)
            console.log(`[FFmpegProcess] Completed: "${item.title}" (exit code ${code})`);
        }
        else {
            console.error(`[FFmpegProcess] Failed: "${item.title}" (exit code ${code})`);
        }
    });
    return proc;
}
/**
 * Kill an FFMPEG process gracefully (SIGTERM), then force (SIGKILL) after timeout
 */
export function killFFmpegProcess(proc, timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (!proc || proc.killed || proc.exitCode !== null) {
            resolve();
            return;
        }
        const forceKillTimer = setTimeout(() => {
            if (!proc.killed) {
                console.warn("[FFmpegProcess] Force killing FFMPEG process");
                proc.kill("SIGKILL");
            }
            resolve();
        }, timeoutMs);
        proc.on("close", () => {
            clearTimeout(forceKillTimer);
            resolve();
        });
        // Send 'q' to stdin for graceful FFMPEG shutdown, then SIGTERM
        try {
            proc.stdin?.write("q");
            proc.stdin?.end();
        }
        catch {
            // stdin may already be closed
        }
        setTimeout(() => {
            if (!proc.killed && proc.exitCode === null) {
                proc.kill("SIGTERM");
            }
        }, 1000);
    });
}
// ============================================================================
// FFMPEG Argument Building
// ============================================================================
/**
 * Build the FFMPEG command-line arguments for a single media item.
 * Output is always MPEG-TS to stdout (pipe:1) for seamless concatenation.
 */
function buildFFmpegArgs(item, probeResult) {
    const args = [];
    // Input
    args.push("-re"); // Read at native frame rate (real-time playback)
    args.push("-i", item.filePath);
    // Video codec
    if (config.videoCodec === "copy" && probeResult?.isCompatible) {
        args.push("-c:v", "copy");
    }
    else if (config.videoCodec === "copy") {
        // Fallback to transcoding if codec is incompatible
        args.push("-c:v", "libx264");
        args.push("-preset", "fast");
        args.push("-b:v", config.videoBitrate);
        if (config.targetResolution) {
            args.push("-vf", `scale=${config.targetResolution}`);
        }
    }
    else {
        args.push("-c:v", config.videoCodec);
        args.push("-preset", "fast");
        args.push("-b:v", config.videoBitrate);
        if (config.targetResolution) {
            args.push("-vf", `scale=${config.targetResolution}`);
        }
    }
    // Audio codec
    if (config.audioCodec === "copy" && probeResult?.isCompatible) {
        args.push("-c:a", "copy");
    }
    else if (config.audioCodec === "copy") {
        args.push("-c:a", "aac");
        args.push("-b:a", config.audioBitrate);
    }
    else {
        args.push("-c:a", config.audioCodec);
        args.push("-b:a", config.audioBitrate);
    }
    // Audio normalization (only when transcoding audio)
    if (config.normalizeAudio && config.audioCodec !== "copy") {
        args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");
    }
    // Output format: MPEG-TS to stdout
    args.push("-f", "mpegts");
    args.push("-mpegts_flags", "+initial_discontinuity");
    args.push("-output_ts_offset", "0");
    args.push("pipe:1");
    return args;
}
// ============================================================================
// Helpers
// ============================================================================
/**
 * Parse FFMPEG frame rate string (e.g., "24000/1001") to a number
 */
function parseFrameRate(rateStr) {
    if (rateStr.includes("/")) {
        const [num, den] = rateStr.split("/").map(Number);
        return den ? num / den : 0;
    }
    return parseFloat(rateStr) || 0;
}
/**
 * Check if the media codecs are compatible with MPEG-TS remux
 * (H.264/H.265 video + AAC/MP3/AC3 audio = can be remuxed directly)
 */
function isCodecCompatible(videoCodec, audioCodec) {
    const compatibleVideoCodecs = ["h264", "hevc", "mpeg2video"];
    const compatibleAudioCodecs = ["aac", "mp3", "ac3", "eac3"];
    const videoOk = videoCodec
        ? compatibleVideoCodecs.includes(videoCodec)
        : true;
    const audioOk = audioCodec
        ? compatibleAudioCodecs.includes(audioCodec)
        : true;
    return videoOk && audioOk;
}
