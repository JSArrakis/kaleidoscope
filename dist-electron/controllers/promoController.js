import { promoRepository } from "../repositories/promoRepository.js";
import { enqueueIngestNormalization } from "../services/normalization/ingestNormalizationService.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";
export async function createPromo(promo) {
    try {
        if (!promo.mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        if (!promo.path) {
            return { message: "File path is required", status: 400 };
        }
        const existing = promoRepository.findByMediaItemId(promo.mediaItemId);
        if (existing) {
            return {
                message: `The Media Item ID '${promo.mediaItemId}' already exists.`,
                status: 400,
            };
        }
        // Probe the file to get duration
        const probe = await probeMediaMetadataHandler(promo.path);
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
        const promoWithDuration = {
            ...promo,
            duration: Math.round(probe.durationSeconds),
        };
        promoRepository.create(promoWithDuration);
        enqueueIngestNormalization(promoWithDuration);
        return { message: `Promo ${promo.title} Created`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function getAllPromos() {
    return promoRepository.findAll();
}
export function getPromo(mediaItemId) {
    if (!mediaItemId) {
        throw new Error("Media Item ID is required");
    }
    const promo = promoRepository.findByMediaItemId(mediaItemId);
    if (!promo) {
        throw new Error("Promo does not exist");
    }
    return promo;
}
export function updatePromo(mediaItemId, updates) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const existing = promoRepository.findByMediaItemId(mediaItemId);
        if (!existing) {
            return { message: "Promo does not exist", status: 400 };
        }
        const updated = {
            ...existing,
            ...updates,
            mediaItemId,
        };
        promoRepository.update(mediaItemId, updated);
        return { message: "Promo Updated", status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function deletePromo(mediaItemId) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const promo = promoRepository.findByMediaItemId(mediaItemId);
        if (!promo) {
            return { message: "Promo does not exist", status: 400 };
        }
        promoRepository.delete(mediaItemId);
        return { message: `Promo ${promo.title} Deleted`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
