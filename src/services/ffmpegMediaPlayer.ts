import { spawn, ChildProcess } from 'child_process';
import { MediaBlock } from '../models/mediaBlock';
import {
  IMediaPlayer,
  MediaPlayerStatus,
  MediaPlayerInfo,
} from './interfaces/mediaPlayerInterface';

/**
 * FFmpeg Media Player Implementation
 * Implements IMediaPlayer interface for FFmpeg streaming backend
 * Constrains FFmpeg behavior to match VLC's streaming model for consistency
 */
export class FFmpegMediaPlayer implements IMediaPlayer {
  private ffmpegProcess: ChildProcess | null = null;
  private queue: string[] = [];
  private currentIndex: number = -1;
  private isPlaying: boolean = false;
  private streamUrl: string = 'rtmp://localhost:1935/live/stream';
  private processExitHandler: (() => Promise<void>) | null = null;

  constructor(streamUrl?: string) {
    if (streamUrl) {
      this.streamUrl = streamUrl;
    }
  }

  // ===== CLIENT INITIALIZATION AND MANAGEMENT =====

  async initialize(password?: string): Promise<void> {
    // FFmpeg doesn't require traditional "initialization"
    // but we can validate the streamUrl and prepare the system
    console.log(`FFmpegMediaPlayer initialized for stream: ${this.streamUrl}`);
  }

  async isConnected(): Promise<boolean> {
    // For FFmpeg, "connected" means a process is running
    return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
  }

  async cleanup(): Promise<void> {
    this.isPlaying = false;

    // Remove all event listeners from the process to prevent memory leaks
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      // Remove all listeners before killing
      this.ffmpegProcess.removeAllListeners();
      if (this.ffmpegProcess.stdout) {
        this.ffmpegProcess.stdout.removeAllListeners();
        this.ffmpegProcess.stdout.destroy();
      }
      if (this.ffmpegProcess.stderr) {
        this.ffmpegProcess.stderr.removeAllListeners();
        this.ffmpegProcess.stderr.destroy();
      }
      if (this.ffmpegProcess.stdin) {
        this.ffmpegProcess.stdin.removeAllListeners();
        this.ffmpegProcess.stdin.destroy();
      }
      this.ffmpegProcess.kill();
    }

    this.ffmpegProcess = null;
    this.queue = [];
    this.currentIndex = -1;
    this.processExitHandler = null;
  }

  // ===== PLAYBACK CONTROL =====

  async play(): Promise<void> {
    if (this.queue.length === 0) {
      throw new Error('Queue is empty. Add media files before playing.');
    }

    if (this.isPlaying) {
      console.log('Already playing');
      return;
    }

    this.isPlaying = true;
    this.currentIndex = 0;
    await this.playCurrentMedia();
  }

  async stop(): Promise<void> {
    this.isPlaying = false;

    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      // Remove all listeners before killing to prevent orphaned listeners
      this.ffmpegProcess.removeAllListeners();
      if (this.ffmpegProcess.stdout) {
        this.ffmpegProcess.stdout.removeAllListeners();
      }
      if (this.ffmpegProcess.stderr) {
        this.ffmpegProcess.stderr.removeAllListeners();
      }
      if (this.ffmpegProcess.stdin) {
        this.ffmpegProcess.stdin.removeAllListeners();
      }
      this.ffmpegProcess.kill();
      this.ffmpegProcess = null;
    }

    this.currentIndex = -1;
  }

  async pause(): Promise<void> {
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      // Send pause signal (Ctrl+Z) to FFmpeg
      this.ffmpegProcess.stdin?.write('p\n');
      this.isPlaying = false;
    }
  }

  async resume(): Promise<void> {
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      // Send resume signal to FFmpeg
      this.ffmpegProcess.stdin?.write('p\n');
      this.isPlaying = true;
    }
  }

  // ===== PLAYLIST/QUEUE MANAGEMENT =====

  async addToQueue(filePath: string): Promise<void> {
    console.log(`Adding to FFmpeg queue: ${filePath}`);
    this.queue.push(filePath);

    // Periodically trim the queue to prevent unbounded growth
    if (this.queue.length % 50 === 0) {
      this.trimQueue();
    }
  }

  async addMediaBlockToQueue(mediaBlock: MediaBlock): Promise<void> {
    if (!mediaBlock) {
      console.log('Media block was null or undefined');
      return;
    }

    try {
      // Add the main media item to the queue
      if (mediaBlock.featureMedia?.path) {
        console.log(`Adding to queue: ${mediaBlock.featureMedia.title}`);
        await this.addToQueue(mediaBlock.featureMedia.path);
      }

      // Add buffer items (post-media buffer)
      if (mediaBlock.buffer && mediaBlock.buffer.length > 0) {
        for (const bufferItem of mediaBlock.buffer) {
          console.log(`Adding buffer to queue: ${bufferItem.title}`);
          await this.addToQueue(bufferItem.path);
        }
      }
    } catch (error) {
      console.error(
        'An error occurred when adding media block to queue:',
        error,
      );
      throw error;
    }
  }

  async getQueueInfo(): Promise<any> {
    return {
      items: this.queue,
      currentItem: this.currentIndex,
      totalItems: this.queue.length,
    };
  }

  async clearQueue(): Promise<void> {
    await this.stop();
    this.queue = [];
    this.currentIndex = -1;
  }

  // ===== STATUS AND MONITORING =====

  async getStatus(): Promise<MediaPlayerStatus> {
    return {
      isPlaying: this.isPlaying,
      isPaused: !this.isPlaying && this.ffmpegProcess !== null,
      isStopped: !this.isPlaying && this.ffmpegProcess === null,
      currentMediaTitle:
        this.currentIndex >= 0 && this.currentIndex < this.queue.length
          ? this.queue[this.currentIndex]
          : undefined,
    };
  }

  async getInfo(): Promise<MediaPlayerInfo> {
    const connected = await this.isConnected();
    return {
      connected,
      running: connected,
      queueSize: this.queue.length,
      currentMediaIndex: this.currentIndex,
      error: undefined,
    };
  }

  // ===== PRIVATE METHODS =====

  private async playCurrentMedia(): Promise<void> {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
      this.isPlaying = false;
      return;
    }

    const currentFilePath = this.queue[this.currentIndex];

    try {
      // Kill previous process if still running and clean up listeners
      if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
        this.ffmpegProcess.removeAllListeners();
        if (this.ffmpegProcess.stdout) {
          this.ffmpegProcess.stdout.removeAllListeners();
        }
        if (this.ffmpegProcess.stderr) {
          this.ffmpegProcess.stderr.removeAllListeners();
        }
        if (this.ffmpegProcess.stdin) {
          this.ffmpegProcess.stdin.removeAllListeners();
        }
        this.ffmpegProcess.kill();
      }

      console.log(
        `FFmpeg playing [${this.currentIndex + 1}/${this.queue.length}]: ${currentFilePath}`,
      );

      // Spawn FFmpeg process with appropriate codec settings
      this.ffmpegProcess = spawn('ffmpeg', [
        '-i',
        currentFilePath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-c:a',
        'aac',
        '-f',
        'flv',
        this.streamUrl,
      ]);

      // Only log errors, not all data (prevents memory bloat from logging)
      this.ffmpegProcess.stderr?.once('data', (data: Buffer) => {
        // Log first chunk only for debugging
        console.log(`FFmpeg encoding started for: ${currentFilePath}`);
      });

      // Remove stderr data listener but keep error events
      const errorHandler = (error: Error) => {
        console.error('FFmpeg process error:', error);
        // Attempt to continue with next media if stream dies
        if (this.isPlaying && this.currentIndex < this.queue.length - 1) {
          this.currentIndex++;
          this.playCurrentMedia();
        }
      };

      const closeHandler = async (code: number | null) => {
        console.log(`FFmpeg process closed with code ${code}`);

        if (this.isPlaying) {
          this.currentIndex++;
          await this.playCurrentMedia();
        }
      };

      // Use `once` instead of `on` to prevent listener accumulation
      // Store handlers for potential removal
      this.ffmpegProcess.once('close', closeHandler);
      this.ffmpegProcess.once('error', errorHandler);
    } catch (error) {
      console.error('Error starting FFmpeg process:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Trim old played items from queue to prevent unbounded growth
   * Keeps a buffer of recently played items for reference
   */
  private trimQueue(): void {
    // Keep queue size reasonable - maintain only played + upcoming items
    // Remove items that are more than 100 positions behind current
    const minQueueIndex = Math.max(0, this.currentIndex - 10);

    if (minQueueIndex > 0) {
      this.queue.splice(0, minQueueIndex);
      this.currentIndex = this.currentIndex - minQueueIndex;
    }
  }
}
