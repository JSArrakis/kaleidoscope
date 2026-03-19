// ============================================================================
// FFMPEG Stream Service — Public API
//
// This is the main entry point for the FFMPEG streaming service.
// It orchestrates all sub-modules to provide a single coherent API for:
//
//   1. Starting a continuous broadcast stream from MediaBlock playlists
//   2. Exposing it as a virtual TV tuner for Plex DVR discovery
//   3. Managing lifecycle, configuration, and status
//
// Architecture:
//   MediaBlock[] → ContinuousStreamPipeline → FFMPEG (per item) → MPEG-TS
//       ↓                                                            ↓
//   StreamManager provides blocks                          StreamHttpServer
//       on demand via supplier callback                        ↓
//                                                     HDHomeRun Emulator
//                                                          ↓
//                                                     Plex DVR / Live TV
// ============================================================================
import { DEFAULT_FFMPEG_STREAM_CONFIG, } from "./types.js";
import { setFFmpegConfig, getFFmpegConfig, } from "./ffmpegProcess.js";
import pipeline from "./continuousStreamPipeline.js";
import { startStreamServer, stopStreamServer, isStreamServerRunning, } from "./streamHttpServer.js";
import { startHDHREmulator, stopHDHREmulator, isHDHREmulatorRunning, } from "./hdhrDeviceEmulator.js";
import { setPlexConfig, testPlexConnection, refreshPlexDVR, } from "./plexApiClient.js";
// ============================================================================
// Service Lifecycle
// ============================================================================
/**
 * Start the full FFMPEG streaming service.
 *
 * This will:
 * 1. Apply configuration
 * 2. Start the HTTP stream server (serves MPEG-TS)
 * 3. Start the HDHomeRun device emulator (Plex discovery)
 * 4. Optionally test the Plex connection
 *
 * @param config - Partial config (merged with defaults)
 * @param initialBlocks - First batch of MediaBlocks to begin streaming
 * @param supplier - Callback to fetch more MediaBlocks when queue runs low
 */
export async function startFFmpegStreamService(config, initialBlocks, supplier) {
    const mergedConfig = { ...DEFAULT_FFMPEG_STREAM_CONFIG, ...config };
    console.log("[FFmpegStreamService] Starting...");
    console.log(`[FFmpegStreamService] Config: stream=${mergedConfig.streamPort}, hdhr=${mergedConfig.hdhrPort}, ` +
        `video=${mergedConfig.videoCodec}, audio=${mergedConfig.audioCodec}`);
    // Apply config to all sub-modules
    setFFmpegConfig(mergedConfig);
    setPlexConfig(mergedConfig);
    // Start the MPEG-TS stream server
    await startStreamServer(mergedConfig, initialBlocks, supplier);
    // Start the HDHomeRun emulator for Plex DVR discovery
    await startHDHREmulator(mergedConfig);
    // Test Plex connection if token is provided
    if (mergedConfig.plexToken) {
        try {
            const identity = await testPlexConnection();
            console.log(`[FFmpegStreamService] Plex server verified: ${identity.machineIdentifier}`);
            // Try to trigger DVR refresh so Plex picks up our tuner
            await refreshPlexDVR();
        }
        catch (err) {
            console.warn(`[FFmpegStreamService] Plex connection test failed (streaming will still work): ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    else {
        console.log("[FFmpegStreamService] No Plex token provided — skipping Plex integration. " +
            "You can still add the tuner manually in Plex DVR settings.");
    }
    console.log("[FFmpegStreamService] ✓ Service started");
    console.log(`[FFmpegStreamService] Stream: http://localhost:${mergedConfig.streamPort}/stream`);
    console.log(`[FFmpegStreamService] HDHR:   http://localhost:${mergedConfig.hdhrPort}`);
    console.log(`[FFmpegStreamService] Status: http://localhost:${mergedConfig.streamPort}/status`);
}
/**
 * Stop the full FFMPEG streaming service.
 * Shuts down the pipeline, stream server, and HDHR emulator.
 */
export async function stopFFmpegStreamService() {
    console.log("[FFmpegStreamService] Stopping...");
    await stopStreamServer();
    await stopHDHREmulator();
    console.log("[FFmpegStreamService] ✓ Service stopped");
}
/**
 * Check if the service is running
 */
export function isFFmpegStreamServiceRunning() {
    return isStreamServerRunning() && isHDHREmulatorRunning();
}
// ============================================================================
// Status & Events
// ============================================================================
/**
 * Get the current status of the streaming service
 */
export function getStreamServiceStatus() {
    const status = pipeline.getStatus();
    const config = getFFmpegConfig();
    status.streamPort = config.streamPort;
    status.hdhrPort = config.hdhrPort;
    return status;
}
/**
 * Subscribe to stream events (item start/end, errors, queue low, etc.)
 */
export function onStreamEvent(listener) {
    pipeline.on(listener);
}
/**
 * Unsubscribe from stream events
 */
export function offStreamEvent(listener) {
    pipeline.off(listener);
}
// ============================================================================
// Queue Management
// ============================================================================
/**
 * Manually enqueue more MediaBlocks into the pipeline
 */
export function enqueueMediaBlocks(blocks) {
    pipeline.enqueueBlocks(blocks);
}
// ============================================================================
// Re-exports for convenience
// ============================================================================
export { DEFAULT_FFMPEG_STREAM_CONFIG, StreamPipelineState, } from "./types.js";
export { flattenMediaBlocks } from "./continuousStreamPipeline.js";
export { probeMediaFile } from "./ffmpegProcess.js";
// Plex API
export { testPlexConnection, validatePlexAuth, refreshPlexDVR, getPlexDVRDevices, getPlexLibrarySections, getPlexLibraryItems, } from "./plexApiClient.js";
