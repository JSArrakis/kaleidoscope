import { createServer } from "http";
import { PassThrough } from "stream";
import { DEFAULT_FFMPEG_STREAM_CONFIG } from "./types.js";
import pipeline from "./continuousStreamPipeline.js";
// ============================================================================
// Stream HTTP Server
//
// A lightweight HTTP server that serves the continuous MPEG-TS stream.
// When a client connects to the stream endpoint, we pipe the FFMPEG
// pipeline's output to the HTTP response as chunked Transfer-Encoding.
//
// Endpoints:
//   GET /stream      — The live MPEG-TS stream (Plex connects here)
//   GET /status      — JSON status of the pipeline
//   GET /health      — Simple health check
// ============================================================================
let server = null;
let config = { ...DEFAULT_FFMPEG_STREAM_CONFIG };
let activeClients = new Set();
/**
 * Start the stream HTTP server
 * @param streamConfig - Service configuration
 * @param initialBlocks - First batch of MediaBlocks to begin streaming
 * @param supplier - Callback to fetch more MediaBlocks when needed
 */
export async function startStreamServer(streamConfig, initialBlocks, supplier) {
    config = { ...DEFAULT_FFMPEG_STREAM_CONFIG, ...streamConfig };
    if (server) {
        console.warn("[StreamServer] Server already running, stopping first...");
        await stopStreamServer();
    }
    server = createServer((req, res) => {
        handleRequest(req, res, initialBlocks, supplier);
    });
    return new Promise((resolve, reject) => {
        server.listen(config.streamPort, () => {
            console.log(`[StreamServer] Listening on http://localhost:${config.streamPort}`);
            console.log(`[StreamServer] Stream URL: http://localhost:${config.streamPort}/stream`);
            resolve();
        });
        server.on("error", (err) => {
            console.error(`[StreamServer] Server error: ${err.message}`);
            reject(err);
        });
    });
}
/**
 * Stop the stream HTTP server and clean up
 */
export async function stopStreamServer() {
    // Stop the pipeline
    await pipeline.stop();
    // Close all active client connections
    for (const client of activeClients) {
        try {
            if (!client.destroyed) {
                client.end();
            }
        }
        catch {
            // Client may already be gone
        }
    }
    activeClients.clear();
    // Close the server
    if (server) {
        return new Promise((resolve) => {
            server.close(() => {
                console.log("[StreamServer] Server stopped");
                server = null;
                resolve();
            });
        });
    }
}
/**
 * Check if the stream server is running
 */
export function isStreamServerRunning() {
    return server !== null && server.listening;
}
// ============================================================================
// Request Handler
// ============================================================================
function handleRequest(req, res, initialBlocks, supplier) {
    const url = req.url || "/";
    const method = req.method || "GET";
    // CORS headers (for browser-based clients)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    switch (url) {
        case "/stream":
            handleStreamRequest(req, res, initialBlocks, supplier);
            break;
        case "/status":
            handleStatusRequest(res);
            break;
        case "/health":
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("OK");
            break;
        default:
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
            break;
    }
}
/**
 * Handle a client connecting to the MPEG-TS stream.
 * Creates a PassThrough stream and starts/attaches the pipeline.
 */
function handleStreamRequest(req, res, initialBlocks, supplier) {
    console.log(`[StreamServer] Client connected: ${req.socket.remoteAddress}:${req.socket.remotePort}`);
    // Set MPEG-TS response headers
    res.writeHead(200, {
        "Content-Type": "video/mp2t",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
    });
    activeClients.add(res);
    // Use a PassThrough stream as a buffer between FFMPEG and the HTTP response
    const passthrough = new PassThrough();
    passthrough.pipe(res);
    // Track client disconnect
    req.on("close", () => {
        console.log("[StreamServer] Client disconnected");
        activeClients.delete(res);
        passthrough.destroy();
    });
    // Start the pipeline if not already streaming
    const status = pipeline.getStatus();
    if (status.state === "idle" || status.state === "error") {
        pipeline.start(passthrough, initialBlocks, supplier).catch((err) => {
            console.error(`[StreamServer] Pipeline start error: ${err instanceof Error ? err.message : String(err)}`);
        });
    }
    else {
        // Pipeline already running — in a production system you'd multicast
        // For now, log a warning
        console.warn("[StreamServer] Pipeline already running. Multiple concurrent clients not yet supported. " +
            "This client will not receive stream data.");
        res.end();
        activeClients.delete(res);
    }
}
/**
 * Return pipeline status as JSON
 */
function handleStatusRequest(res) {
    const status = pipeline.getStatus();
    status.streamPort = config.streamPort;
    status.hdhrPort = config.hdhrPort;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status, null, 2));
}
