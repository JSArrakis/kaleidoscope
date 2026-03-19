import FfmpegCommand from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { MediaBlock } from "../types/MediaBlock.js";

/**
 * FFmpegStreamService Singleton
 * Manages FFmpeg streaming pipeline for continuous concatenated output
 * Receives MediaBlocks, concatenates them with zero-gap seamless transitions
 * Outputs to HTTP/RTMP endpoint for external consumption (e.g., Plex)
 */
class FFmpegStreamService {
  private ffmpegProcess: FfmpegCommand.FfmpegCommand | null = null;
  private mediaQueue: MediaBlock[] = [];
  private isStreaming = false;
  private httpPort = 3333; // Default streaming port
  private streamUrl = `http://localhost:${this.httpPort}/stream`;

  constructor() {
    // Set FFmpeg path from ffmpeg-static
    FfmpegCommand.setFfmpegPath(String(ffmpegPath));
    console.log("[FFmpegStreamService] Singleton instance created");
  }

  /**
   * Primes the FFmpeg streaming pipeline
   * Initializes FFmpeg process and prepares to receive media blocks
   *
   * @param httpPort Optional custom port for HTTP streaming endpoint
   * @returns Promise that resolves when FFmpeg is ready
   */
  async prime(httpPort?: number): Promise<void> {
    if (this.isStreaming) {
      console.warn(
        "[FFmpegStreamService] Already streaming, call stop() first",
      );
      return;
    }

    if (httpPort) {
      this.httpPort = httpPort;
      this.streamUrl = `http://localhost:${this.httpPort}/stream`;
    }

    try {
      console.log(
        `[FFmpegStreamService] Priming FFmpeg for streaming on port ${this.httpPort}`,
      );

      // STUB: Initialize FFmpeg process
      // TODO: Set up FFmpeg concat demuxer
      // TODO: Configure output format (MPEG-TS for Plex compatibility)
      // TODO: Bind to HTTP stream endpoint
      // TODO: Handle stdin for dynamic media input

      this.isStreaming = true;
      console.log("[FFmpegStreamService] FFmpeg pipeline ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FFmpegStreamService] Prime failed: ${message}`);
      throw err;
    }
  }

  /**
   * Adds a media block to the concatenation queue
   * FFmpeg will seamlessly transition to this media when ready
   *
   * @param mediaBlock The MediaBlock to add to stream
   */
  async addMediaBlock(mediaBlock: MediaBlock): Promise<void> {
    if (!this.isStreaming) {
      console.warn(
        "[FFmpegStreamService] Not streaming, call prime() first to initialize",
      );
      return;
    }

    try {
      this.mediaQueue.push(mediaBlock);
      console.log(
        `[FFmpegStreamService] Queued media block, queue length: ${this.mediaQueue.length}`,
      );

      // STUB: Push media block to FFmpeg stdin
      // TODO: Convert MediaBlock filepath/metadata to FFmpeg concat format
      // TODO: Write to FFmpeg process stdin
      // TODO: Handle timing to prevent gaps
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[FFmpegStreamService] Failed to add media block: ${message}`,
      );
      throw err;
    }
  }

  /**
   * Gets the current streaming URL
   * Use this to configure Plex or other clients to pull from the stream
   */
  getStreamUrl(): string {
    return this.streamUrl;
  }

  /**
   * Gets current queue of pending media blocks
   */
  getQueue(): MediaBlock[] {
    return [...this.mediaQueue];
  }

  /**
   * Gets streaming status
   */
  isActive(): boolean {
    return this.isStreaming;
  }

  /**
   * Stops the FFmpeg streaming pipeline
   * Cleans up process and resets state
   */
  async stop(): Promise<void> {
    try {
      if (!this.isStreaming) {
        console.log("[FFmpegStreamService] Not currently streaming");
        return;
      }

      console.log("[FFmpegStreamService] Stopping FFmpeg pipeline");

      // STUB: Kill FFmpeg process gracefully
      // TODO: Close stdin stream
      // TODO: Wait for process to terminate
      // TODO: Handle cleanup

      this.ffmpegProcess = null;
      this.mediaQueue = [];
      this.isStreaming = false;

      console.log("[FFmpegStreamService] FFmpeg pipeline stopped");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FFmpegStreamService] Stop failed: ${message}`);
      throw err;
    }
  }

  /**
   * Gets FFmpeg process for direct access if needed
   */
  getProcess(): FfmpegCommand.FfmpegCommand | null {
    return this.ffmpegProcess;
  }
}

// Export singleton instance
const ffmpegStreamService = new FFmpegStreamService();
export { ffmpegStreamService };
