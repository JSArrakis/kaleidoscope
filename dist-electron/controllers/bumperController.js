import { bumperRepository } from "../repositories/bumperRepository.js";
import { enqueueIngestNormalization } from "../services/normalization/ingestNormalizationService.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";
export async function createBumper(bumper) {
    try {
        if (!bumper.mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        if (!bumper.path) {
            return { message: "File path is required", status: 400 };
        }
        const existing = bumperRepository.findByMediaItemId(bumper.mediaItemId);
        if (existing) {
            return {
                message: `The Media Item ID '${bumper.mediaItemId}' already exists.`,
                status: 400,
            };
        }
        // Probe the file to get duration
        const probe = await probeMediaMetadataHandler(bumper.path);
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
        const bumperWithDuration = {
            ...bumper,
            duration: Math.round(probe.durationSeconds),
        };
        bumperRepository.create(bumperWithDuration);
        enqueueIngestNormalization(bumperWithDuration);
        return { message: `Bumper ${bumper.title} Created`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function getAllBumpers() {
    return bumperRepository.findAll();
}
export function getBumper(mediaItemId) {
    if (!mediaItemId) {
        throw new Error("Media Item ID is required");
    }
    const bumper = bumperRepository.findByMediaItemId(mediaItemId);
    if (!bumper) {
        throw new Error("Bumper does not exist");
    }
    return bumper;
}
export function updateBumper(mediaItemId, updates) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const existing = bumperRepository.findByMediaItemId(mediaItemId);
        if (!existing) {
            return { message: "Bumper does not exist", status: 400 };
        }
        const updated = {
            ...existing,
            ...updates,
            mediaItemId,
        };
        bumperRepository.update(mediaItemId, updated);
        return { message: "Bumper Updated", status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function deleteBumper(mediaItemId) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const bumper = bumperRepository.findByMediaItemId(mediaItemId);
        if (!bumper) {
            return { message: "Bumper does not exist", status: 400 };
        }
        bumperRepository.delete(mediaItemId);
        return { message: `Bumper ${bumper.title} Deleted`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
