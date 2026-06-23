import { shortRepository } from "../repositories/shortRepository.js";
import { enqueueIngestNormalization } from "../services/normalization/ingestNormalizationService.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";
export async function createShort(short) {
    try {
        if (!short.mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        if (!short.path) {
            return { message: "File path is required", status: 400 };
        }
        const existing = shortRepository.findByMediaItemId(short.mediaItemId);
        if (existing) {
            return {
                message: `The Media Item ID '${short.mediaItemId}' already exists.`,
                status: 400,
            };
        }
        // Probe the file to get duration
        const probe = await probeMediaMetadataHandler(short.path);
        if (!probe.isPlayable) {
            return {
                message: `File is not playable: ${probe.errorMessage || "Unknown error"}`,
                status: 400,
            };
        }
        if (!probe.durationSeconds || probe.durationSeconds <= 0) {
            return {
                message: "Could not determine file duration",
                status: 400,
            };
        }
        const shortWithDuration = {
            ...short,
            duration: Math.round(probe.durationSeconds),
        };
        shortRepository.create(shortWithDuration);
        enqueueIngestNormalization(shortWithDuration);
        return { message: `Short ${short.title} Created`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function getAllShorts() {
    return shortRepository.findAll();
}
export function getShort(mediaItemId) {
    if (!mediaItemId) {
        throw new Error("Media Item ID is required");
    }
    const short = shortRepository.findByMediaItemId(mediaItemId);
    if (!short) {
        throw new Error("Short does not exist");
    }
    return short;
}
export function updateShort(mediaItemId, updates) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const existing = shortRepository.findByMediaItemId(mediaItemId);
        if (!existing) {
            return { message: "Short does not exist", status: 400 };
        }
        const updated = {
            ...existing,
            ...updates,
            mediaItemId,
        };
        shortRepository.update(mediaItemId, updated);
        return { message: "Short Updated", status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function deleteShort(mediaItemId) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const short = shortRepository.findByMediaItemId(mediaItemId);
        if (!short) {
            return { message: "Short does not exist", status: 400 };
        }
        shortRepository.delete(mediaItemId);
        return { message: `Short ${short.title} Deleted`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
