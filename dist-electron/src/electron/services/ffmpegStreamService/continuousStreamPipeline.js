import { StreamPipelineState, } from "./types.js";
import { spawnFFmpegForItem, killFFmpegProcess, probeMediaFile, } from "./ffmpegProcess.js";
/** How many items remaining before we request more blocks */
const QUEUE_LOW_THRESHOLD = 3;
class ContinuousStreamPipeline {
    state = StreamPipelineState.Idle;
    queue = [];
    currentItem = null;
    currentProcess = null;
    outputStream = null;
    mediaBlockSupplier = null;
    totalItemsStreamed = 0;
    startedAt = 0;
    errors = [];
    listeners = [];
    isRequestingBlocks = false;
    stopped = false;
    /**
     * Start the continuous stream pipeline.
     * @param output - Writable stream to pipe MPEG-TS data into (typically HTTP response)
     * @param initialBlocks - First batch of MediaBlocks to stream
     * @param supplier - Callback to fetch more MediaBlocks when queue runs low
     */
    async start(output, initialBlocks, supplier) {
        if (this.state === StreamPipelineState.Streaming) {
            console.warn("[Pipeline] Already streaming, ignoring start()");
            return;
        }
        this.state = StreamPipelineState.Starting;
        this.outputStream = output;
        this.mediaBlockSupplier = supplier;
        this.totalItemsStreamed = 0;
        this.startedAt = Date.now();
        this.errors = [];
        this.stopped = false;
        // Flatten initial blocks into queue
        const items = flattenMediaBlocks(initialBlocks);
        this.queue.push(...items);
        console.log(`[Pipeline] Starting with ${items.length} items from ${initialBlocks.length} blocks`);
        this.emit({ type: "pipeline-started", timestamp: Date.now() });
        // Handle output stream closing (client disconnects)
        output.on("close", () => {
            console.log("[Pipeline] Output stream closed (client disconnected)");
            this.emit({ type: "client-disconnected", timestamp: Date.now() });
            this.stop();
        });
        output.on("error", (err) => {
            console.error(`[Pipeline] Output stream error: ${err.message}`);
            this.stop();
        });
        this.state = StreamPipelineState.Streaming;
        this.processNext();
    }
    /**
     * Stop the pipeline and clean up
     */
    async stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        this.state = StreamPipelineState.Stopping;
        console.log("[Pipeline] Stopping...");
        if (this.currentProcess) {
            await killFFmpegProcess(this.currentProcess);
            this.currentProcess = null;
        }
        this.queue = [];
        this.currentItem = null;
        this.state = StreamPipelineState.Idle;
        this.emit({ type: "pipeline-stopped", timestamp: Date.now() });
        console.log(`[Pipeline] Stopped. Total items streamed: ${this.totalItemsStreamed}`);
    }
    /**
     * Add more MediaBlocks to the queue (can be called externally)
     */
    enqueueBlocks(blocks) {
        const items = flattenMediaBlocks(blocks);
        this.queue.push(...items);
        console.log(`[Pipeline] Enqueued ${items.length} items (queue size: ${this.queue.length})`);
    }
    /**
     * Get current pipeline status
     */
    getStatus() {
        return {
            state: this.state,
            currentItem: this.currentItem,
            queueLength: this.queue.length,
            totalItemsStreamed: this.totalItemsStreamed,
            uptimeSeconds: this.startedAt
                ? Math.floor((Date.now() - this.startedAt) / 1000)
                : 0,
            streamPort: 0, // Set by the HTTP server layer
            hdhrPort: 0,
            errors: [...this.errors],
        };
    }
    /**
     * Subscribe to pipeline events
     */
    on(listener) {
        this.listeners.push(listener);
    }
    /**
     * Remove an event listener
     */
    off(listener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }
    // ==========================================================================
    // Internal Pipeline Logic
    // ==========================================================================
    /**
     * Process the next item in the queue.
     * This is the main loop — called recursively after each item completes.
     */
    async processNext() {
        if (this.stopped || this.state !== StreamPipelineState.Streaming) {
            return;
        }
        // Request more blocks if queue is running low
        if (this.queue.length <= QUEUE_LOW_THRESHOLD && !this.isRequestingBlocks) {
            this.requestMoreBlocks();
        }
        // If queue is empty, wait briefly then retry
        if (this.queue.length === 0) {
            console.log("[Pipeline] Queue empty, waiting for more blocks...");
            await delay(2000);
            if (this.queue.length === 0 && !this.stopped) {
                console.warn("[Pipeline] Queue still empty after waiting");
                // Try requesting blocks again
                if (!this.isRequestingBlocks) {
                    await this.requestMoreBlocksSync();
                }
                if (this.queue.length === 0) {
                    console.error("[Pipeline] No blocks available, stopping");
                    this.state = StreamPipelineState.Error;
                    this.emit({
                        type: "pipeline-error",
                        timestamp: Date.now(),
                        data: { reason: "Queue exhausted — no more blocks available" },
                    });
                    return;
                }
            }
        }
        const item = this.queue.shift();
        if (!item)
            return;
        this.currentItem = item;
        this.emit({
            type: "item-start",
            timestamp: Date.now(),
            data: {
                title: item.title,
                mediaType: item.mediaType,
                duration: item.duration,
                isBuffer: item.isBuffer,
            },
        });
        console.log(`[Pipeline] Now playing: "${item.title}" (${item.mediaType}, ${item.duration}s)`);
        try {
            // Probe the file to check codec compatibility
            let probeResult;
            try {
                probeResult = await probeMediaFile(item.filePath);
            }
            catch (probeErr) {
                console.warn(`[Pipeline] Probe failed for "${item.title}", will transcode: ${probeErr instanceof Error ? probeErr.message : String(probeErr)}`);
            }
            // Spawn FFMPEG for this item
            const proc = spawnFFmpegForItem(item, probeResult);
            this.currentProcess = proc;
            // Pipe FFMPEG stdout (MPEG-TS data) to the output stream
            if (proc.stdout && this.outputStream && !this.outputStream.destroyed) {
                proc.stdout.pipe(this.outputStream, { end: false });
            }
            // Wait for FFMPEG to finish this item
            await waitForProcessExit(proc);
            // Unpipe before starting next item
            if (proc.stdout && this.outputStream) {
                proc.stdout.unpipe(this.outputStream);
            }
            this.currentProcess = null;
            this.totalItemsStreamed++;
            this.emit({
                type: "item-end",
                timestamp: Date.now(),
                data: {
                    title: item.title,
                    mediaType: item.mediaType,
                },
            });
            // Continue to next item
            this.processNext();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[Pipeline] Error streaming "${item.title}": ${message}`);
            this.errors.push(`${item.title}: ${message}`);
            this.emit({
                type: "item-error",
                timestamp: Date.now(),
                data: { title: item.title, error: message },
            });
            // Skip the broken item and continue
            this.currentProcess = null;
            this.processNext();
        }
    }
    /**
     * Request more MediaBlocks from the supplier (non-blocking)
     */
    async requestMoreBlocks() {
        if (!this.mediaBlockSupplier || this.isRequestingBlocks)
            return;
        this.isRequestingBlocks = true;
        this.emit({ type: "queue-low", timestamp: Date.now() });
        try {
            console.log("[Pipeline] Requesting more media blocks...");
            const blocks = await this.mediaBlockSupplier();
            if (blocks.length > 0) {
                this.enqueueBlocks(blocks);
            }
        }
        catch (err) {
            console.error(`[Pipeline] Failed to get more blocks: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            this.isRequestingBlocks = false;
        }
    }
    /**
     * Synchronous-style request for blocks (awaits result before continuing)
     */
    async requestMoreBlocksSync() {
        if (!this.mediaBlockSupplier)
            return;
        this.isRequestingBlocks = true;
        try {
            console.log("[Pipeline] Synchronously requesting more media blocks...");
            const blocks = await this.mediaBlockSupplier();
            if (blocks.length > 0) {
                this.enqueueBlocks(blocks);
            }
        }
        catch (err) {
            console.error(`[Pipeline] Failed to get more blocks: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            this.isRequestingBlocks = false;
        }
    }
    /**
     * Emit an event to all listeners
     */
    emit(event) {
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (err) {
                console.error(`[Pipeline] Event listener error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
}
// ============================================================================
// MediaBlock → StreamQueueItem Flattening
// ============================================================================
/**
 * Flatten an array of MediaBlocks into a sequential array of StreamQueueItems.
 * Order per block: buffer items first (bumpers, commercials, etc.), then main content.
 * This mirrors the broadcast order — bumper → commercial → promo → main show/movie.
 */
export function flattenMediaBlocks(blocks) {
    const items = [];
    for (const block of blocks) {
        // Buffer items first
        for (const bufferItem of block.buffer) {
            if (bufferItem.path && bufferItem.duration > 0) {
                items.push({
                    id: bufferItem.mediaItemId || crypto.randomUUID(),
                    title: bufferItem.title || "Buffer",
                    filePath: bufferItem.path,
                    duration: bufferItem.duration,
                    mediaType: bufferItem.type || "Buffer",
                    isBuffer: true,
                });
            }
        }
        // Main block (show episode or movie)
        if (block.mainBlock &&
            block.mainBlock.path &&
            block.mainBlock.duration > 0) {
            items.push({
                id: block.mainBlock.mediaItemId,
                title: block.mainBlock.title,
                filePath: block.mainBlock.path,
                duration: block.mainBlock.duration,
                mediaType: block.mainBlock.type || "Main",
                isBuffer: false,
            });
        }
    }
    return items;
}
// ============================================================================
// Helpers
// ============================================================================
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function waitForProcessExit(proc) {
    return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
            resolve(code);
        });
        proc.on("error", (err) => {
            reject(err);
        });
    });
}
// ============================================================================
// Singleton Export
// ============================================================================
/** Singleton pipeline instance */
const pipeline = new ContinuousStreamPipeline();
export default pipeline;
