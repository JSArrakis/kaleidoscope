import { createServer } from "http";
import { DEFAULT_FFMPEG_STREAM_CONFIG } from "./types.js";
// ============================================================================
// HDHomeRun Device Emulator
//
// Plex discovers Live TV tuners by scanning the network for HDHomeRun devices.
// This module emulates the HDHomeRun HTTP discovery API so that Plex sees
// Kaleidoscope as a DVR tuner device.
//
// Protocol (HDHomeRun HTTP API):
//   GET /discover.json      — Device identification
//   GET /lineup_status.json — Tuner scan status
//   GET /lineup.json        — Channel lineup
//   GET /auto/v{channel}    — Redirect to actual stream URL
//
// Setup flow:
// 1. Start this emulator on a known port (e.g., 8090)
// 2. In Plex → Settings → Live TV & DVR → "Set Up Plex DVR"
// 3. Enter `http://localhost:8090` as the device address
// 4. Plex will query discover.json and lineup.json
// 5. Plex adds the "tuner" — your channel appears in Live TV
// 6. When a user tunes to the channel, Plex requests /auto/v{channel}
// 7. We redirect to the MPEG-TS stream server
// ============================================================================
let server = null;
let config = { ...DEFAULT_FFMPEG_STREAM_CONFIG };
/**
 * Start the HDHomeRun device emulator
 */
export async function startHDHREmulator(streamConfig) {
    config = { ...DEFAULT_FFMPEG_STREAM_CONFIG, ...streamConfig };
    if (server) {
        console.warn("[HDHR] Emulator already running, stopping first...");
        await stopHDHREmulator();
    }
    server = createServer(handleRequest);
    return new Promise((resolve, reject) => {
        server.listen(config.hdhrPort, () => {
            console.log(`[HDHR] HDHomeRun emulator listening on http://localhost:${config.hdhrPort}`);
            console.log(`[HDHR] Add this URL in Plex DVR setup: http://localhost:${config.hdhrPort}`);
            resolve();
        });
        server.on("error", (err) => {
            console.error(`[HDHR] Server error: ${err.message}`);
            reject(err);
        });
    });
}
/**
 * Stop the HDHomeRun emulator
 */
export async function stopHDHREmulator() {
    if (server) {
        return new Promise((resolve) => {
            server.close(() => {
                console.log("[HDHR] Emulator stopped");
                server = null;
                resolve();
            });
        });
    }
}
/**
 * Check if the HDHR emulator is running
 */
export function isHDHREmulatorRunning() {
    return server !== null && server.listening;
}
// ============================================================================
// Request Handler
// ============================================================================
function handleRequest(req, res) {
    const url = req.url || "/";
    const method = req.method || "GET";
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    console.log(`[HDHR] ${method} ${url}`);
    if (url === "/discover.json") {
        handleDiscover(res);
    }
    else if (url === "/lineup_status.json") {
        handleLineupStatus(res);
    }
    else if (url === "/lineup.json") {
        handleLineup(res);
    }
    else if (url.startsWith("/auto/v")) {
        handleAutoTune(req, res, url);
    }
    else if (url === "/device.xml") {
        handleDeviceXml(res);
    }
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
}
// ============================================================================
// HDHomeRun API Endpoints
// ============================================================================
/**
 * GET /discover.json
 * Returns device identification for Plex DVR discovery.
 */
function handleDiscover(res) {
    const discover = {
        FriendlyName: config.deviceName,
        Manufacturer: "Kaleidoscope",
        ModelNumber: "HDTC-2US",
        FirmwareName: "hdhomerun_atsc",
        TunerCount: 1,
        FirmwareVersion: "20200101",
        DeviceID: config.deviceId,
        DeviceAuth: "kaleidoscope_auth",
        BaseURL: `http://localhost:${config.hdhrPort}`,
        LineupURL: `http://localhost:${config.hdhrPort}/lineup.json`,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(discover));
}
/**
 * GET /lineup_status.json
 * Reports that the "antenna scan" is complete (Plex checks this).
 */
function handleLineupStatus(res) {
    const status = {
        ScanInProgress: 0,
        ScanPossible: 1,
        Source: "Cable",
        SourceList: ["Cable"],
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
}
/**
 * GET /lineup.json
 * Returns the channel lineup. We expose a single channel that points
 * to our MPEG-TS stream server.
 */
function handleLineup(res) {
    const lineup = [
        {
            GuideNumber: String(config.channelNumber),
            GuideName: config.channelName,
            URL: `http://localhost:${config.streamPort}/stream`,
        },
    ];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lineup));
}
/**
 * GET /auto/v{channel}
 * Plex requests this URL to tune to a channel.
 * We redirect to the actual MPEG-TS stream.
 */
function handleAutoTune(_req, res, url) {
    // Extract channel number from URL (e.g., /auto/v1 → "1")
    const channelStr = url.replace("/auto/v", "");
    const channel = parseInt(channelStr, 10);
    if (channel !== config.channelNumber) {
        console.warn(`[HDHR] Unknown channel requested: ${channel}`);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`Channel ${channel} not found`);
        return;
    }
    console.log(`[HDHR] Tuning to channel ${channel}, redirecting to stream`);
    // Redirect to the stream server
    res.writeHead(302, {
        Location: `http://localhost:${config.streamPort}/stream`,
    });
    res.end();
}
/**
 * GET /device.xml
 * UPnP/SSDP device description (some Plex versions request this).
 */
function handleDeviceXml(res) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
  <specVersion>
    <major>1</major>
    <minor>0</minor>
  </specVersion>
  <URLBase>http://localhost:${config.hdhrPort}</URLBase>
  <device>
    <deviceType>urn:schemas-upnp-org:device:MediaServer:1</deviceType>
    <friendlyName>${config.deviceName}</friendlyName>
    <manufacturer>Kaleidoscope</manufacturer>
    <modelName>HDTC-2US</modelName>
    <modelNumber>HDTC-2US</modelNumber>
    <serialNumber>${config.deviceId}</serialNumber>
    <UDN>uuid:${config.deviceId}</UDN>
  </device>
</root>`;
    res.writeHead(200, { "Content-Type": "application/xml" });
    res.end(xml);
}
