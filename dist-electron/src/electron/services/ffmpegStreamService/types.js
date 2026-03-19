// ============================================================================
// FFMPEG Stream Service Types
// ============================================================================
/**
 * Default configuration values
 */
export const DEFAULT_FFMPEG_STREAM_CONFIG = {
    streamPort: 8089,
    hdhrPort: 8090,
    ffmpegPath: "ffmpeg",
    ffprobePath: "ffprobe",
    videoCodec: "copy",
    audioCodec: "copy",
    targetResolution: null,
    videoBitrate: "4000k",
    audioBitrate: "192k",
    normalizeAudio: false,
    deviceName: "Kaleidoscope",
    deviceId: "12345678",
    channelNumber: 1,
    channelName: "Kaleidoscope TV",
    plexServerUrl: "http://localhost:32400",
    plexToken: "",
    maxSegments: 0,
};
/**
 * Current state of the streaming pipeline
 */
export var StreamPipelineState;
(function (StreamPipelineState) {
    StreamPipelineState["Idle"] = "idle";
    StreamPipelineState["Starting"] = "starting";
    StreamPipelineState["Streaming"] = "streaming";
    StreamPipelineState["Transitioning"] = "transitioning";
    StreamPipelineState["Stopping"] = "stopping";
    StreamPipelineState["Error"] = "error";
})(StreamPipelineState || (StreamPipelineState = {}));
