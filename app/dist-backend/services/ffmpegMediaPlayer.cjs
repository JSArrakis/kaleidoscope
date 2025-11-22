"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegMediaPlayer = void 0;
const child_process_1 = require("child_process");
/**
 * FFmpeg Media Player Implementation
 * Implements IMediaPlayer interface for FFmpeg streaming backend
 * Constrains FFmpeg behavior to match VLC's streaming model for consistency
 */
class FFmpegMediaPlayer {
    constructor(streamUrl) {
        this.ffmpegProcess = null;
        this.queue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.streamUrl = 'rtmp://localhost:1935/live/stream';
        this.processExitHandler = null;
        if (streamUrl) {
            this.streamUrl = streamUrl;
        }
    }
    // ===== CLIENT INITIALIZATION AND MANAGEMENT =====
    async initialize(password) {
        // FFmpeg doesn't require traditional "initialization"
        // but we can validate the streamUrl and prepare the system
        console.log(`FFmpegMediaPlayer initialized for stream: ${this.streamUrl}`);
    }
    async isConnected() {
        // For FFmpeg, "connected" means a process is running
        return this.ffmpegProcess !== null && !this.ffmpegProcess.killed;
    }
    async cleanup() {
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
    async play() {
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
    async stop() {
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
    async pause() {
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
            // Send pause signal (Ctrl+Z) to FFmpeg
            this.ffmpegProcess.stdin?.write('p\n');
            this.isPlaying = false;
        }
    }
    async resume() {
        if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
            // Send resume signal to FFmpeg
            this.ffmpegProcess.stdin?.write('p\n');
            this.isPlaying = true;
        }
    }
    // ===== PLAYLIST/QUEUE MANAGEMENT =====
    async addToQueue(filePath) {
        console.log(`Adding to FFmpeg queue: ${filePath}`);
        this.queue.push(filePath);
        // Periodically trim the queue to prevent unbounded growth
        if (this.queue.length % 50 === 0) {
            this.trimQueue();
        }
    }
    async addMediaBlockToQueue(mediaBlock) {
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
        }
        catch (error) {
            console.error('An error occurred when adding media block to queue:', error);
            throw error;
        }
    }
    async getQueueInfo() {
        return {
            items: this.queue,
            currentItem: this.currentIndex,
            totalItems: this.queue.length,
        };
    }
    async clearQueue() {
        await this.stop();
        this.queue = [];
        this.currentIndex = -1;
    }
    // ===== STATUS AND MONITORING =====
    async getStatus() {
        return {
            isPlaying: this.isPlaying,
            isPaused: !this.isPlaying && this.ffmpegProcess !== null,
            isStopped: !this.isPlaying && this.ffmpegProcess === null,
            currentMediaTitle: this.currentIndex >= 0 && this.currentIndex < this.queue.length
                ? this.queue[this.currentIndex]
                : undefined,
        };
    }
    async getInfo() {
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
    async playCurrentMedia() {
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
            console.log(`FFmpeg playing [${this.currentIndex + 1}/${this.queue.length}]: ${currentFilePath}`);
            // Spawn FFmpeg process with appropriate codec settings
            this.ffmpegProcess = (0, child_process_1.spawn)('ffmpeg', [
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
            this.ffmpegProcess.stderr?.once('data', (data) => {
                // Log first chunk only for debugging
                console.log(`FFmpeg encoding started for: ${currentFilePath}`);
            });
            // Remove stderr data listener but keep error events
            const errorHandler = (error) => {
                console.error('FFmpeg process error:', error);
                // Attempt to continue with next media if stream dies
                if (this.isPlaying && this.currentIndex < this.queue.length - 1) {
                    this.currentIndex++;
                    this.playCurrentMedia();
                }
            };
            const closeHandler = async (code) => {
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
        }
        catch (error) {
            console.error('Error starting FFmpeg process:', error);
            this.isPlaying = false;
        }
    }
    /**
     * Trim old played items from queue to prevent unbounded growth
     * Keeps a buffer of recently played items for reference
     */
    trimQueue() {
        // Keep queue size reasonable - maintain only played + upcoming items
        // Remove items that are more than 100 positions behind current
        const minQueueIndex = Math.max(0, this.currentIndex - 10);
        if (minQueueIndex > 0) {
            this.queue.splice(0, minQueueIndex);
            this.currentIndex = this.currentIndex - minQueueIndex;
        }
    }
}
exports.FFmpegMediaPlayer = FFmpegMediaPlayer;
