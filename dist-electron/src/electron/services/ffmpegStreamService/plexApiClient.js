import { DEFAULT_FFMPEG_STREAM_CONFIG } from "./types.js";
// ============================================================================
// Plex API Client
//
// Handles communication with the Plex Media Server API for:
// - Validating connection/auth token
// - Refreshing DVR to pick up our virtual tuner
// - Querying library sections (future: resolve Plex media → file paths)
//
// Plex API reference: https://github.com/Arcanemagus/plex-api/wiki
// Auth: All requests include `X-Plex-Token` header
// ============================================================================
let config = { ...DEFAULT_FFMPEG_STREAM_CONFIG };
/**
 * Update the Plex API configuration
 */
export function setPlexConfig(newConfig) {
    config = { ...config, ...newConfig };
}
// ============================================================================
// Core API Helpers
// ============================================================================
/**
 * Make an authenticated request to the Plex API
 */
async function plexFetch(path, options = {}) {
    const url = `${config.plexServerUrl}${path}`;
    const headers = {
        Accept: "application/json",
        "X-Plex-Token": config.plexToken,
        "X-Plex-Client-Identifier": config.deviceId,
        "X-Plex-Product": "Kaleidoscope",
        "X-Plex-Version": "1.0.0",
        ...options.headers,
    };
    const response = await fetch(url, {
        ...options,
        headers,
    });
    if (!response.ok) {
        throw new Error(`Plex API error: ${response.status} ${response.statusText} for ${path}`);
    }
    return response;
}
// ============================================================================
// Connection & Auth
// ============================================================================
/**
 * Test the Plex server connection and validate the auth token.
 * Returns server identity info on success.
 */
export async function testPlexConnection() {
    try {
        const response = await plexFetch("/identity");
        const data = await response.json();
        const identity = {
            machineIdentifier: data.MediaContainer?.machineIdentifier || "unknown",
            version: data.MediaContainer?.version || "unknown",
            claimed: data.MediaContainer?.claimed === "1",
        };
        console.log(`[PlexAPI] Connected to Plex server: ${identity.machineIdentifier} (v${identity.version})`);
        return identity;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[PlexAPI] Connection test failed: ${message}`);
        throw new Error(`Cannot connect to Plex server at ${config.plexServerUrl}: ${message}`);
    }
}
/**
 * Validate that the Plex token has access and the server is reachable
 */
export async function validatePlexAuth() {
    try {
        await plexFetch("/");
        console.log("[PlexAPI] Auth token is valid");
        return true;
    }
    catch {
        console.error("[PlexAPI] Auth token validation failed");
        return false;
    }
}
// ============================================================================
// DVR Integration
// ============================================================================
/**
 * Tell Plex to refresh its DVR device list.
 * Call this after starting the HDHR emulator so Plex discovers the tuner.
 * Note: This may not be available on all Plex server versions.
 */
export async function refreshPlexDVR() {
    try {
        // Plex DVR refresh endpoint
        await plexFetch("/livetv/dvrs", { method: "GET" });
        console.log("[PlexAPI] DVR refresh requested");
    }
    catch (err) {
        console.warn(`[PlexAPI] DVR refresh failed (may need manual setup): ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Get the list of DVR devices Plex knows about
 */
export async function getPlexDVRDevices() {
    try {
        const response = await plexFetch("/livetv/dvrs");
        const data = await response.json();
        const devices = (data.MediaContainer?.Dvr || []).map((dvr) => ({
            key: dvr.key || "",
            uuid: dvr.uuid || "",
            language: dvr.language || "",
            lineup: dvr.lineup || "",
        }));
        console.log(`[PlexAPI] Found ${devices.length} DVR device(s)`);
        return devices;
    }
    catch (err) {
        console.warn(`[PlexAPI] Failed to list DVR devices: ${err instanceof Error ? err.message : String(err)}`);
        return [];
    }
}
// ============================================================================
// Library Access (for future Plex-as-source functionality)
// ============================================================================
/**
 * Get all library sections from the Plex server
 */
export async function getPlexLibrarySections() {
    const response = await plexFetch("/library/sections");
    const data = await response.json();
    return (data.MediaContainer?.Directory || []).map((dir) => ({
        key: dir.key,
        title: dir.title,
        type: dir.type,
        agent: dir.agent,
        scanner: dir.scanner,
        language: dir.language,
        uuid: dir.uuid,
        location: dir.Location?.map((loc) => loc.path) || [],
    }));
}
/**
 * Get all items from a library section
 */
export async function getPlexLibraryItems(sectionKey) {
    const response = await plexFetch(`/library/sections/${sectionKey}/all`);
    const data = await response.json();
    return (data.MediaContainer?.Metadata || []).map((item) => ({
        ratingKey: item.ratingKey,
        title: item.title,
        type: item.type,
        duration: item.duration ? item.duration / 1000 : 0, // Plex uses ms
        year: item.year,
        filePath: item.Media?.[0]?.Part?.[0]?.file || null,
        plexStreamUrl: item.Media?.[0]?.Part?.[0]?.key || null,
    }));
}
