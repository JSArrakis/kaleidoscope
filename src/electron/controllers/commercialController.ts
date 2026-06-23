import { commercialRepository } from "../repositories/commercialRepository.js";
import { enqueueIngestNormalization } from "../services/normalization/ingestNormalizationService.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";

export async function createCommercial(
  commercial: Commercial,
): Promise<{ message: string; status: number }> {
  try {
    if (!commercial.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    if (!commercial.path) {
      return { message: "File path is required", status: 400 };
    }

    const existing = commercialRepository.findByMediaItemId(
      commercial.mediaItemId,
    );
    if (existing) {
      return {
        message: `The Media Item ID '${commercial.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    // Probe the file to get duration
    const probe = await probeMediaMetadataHandler(commercial.path);

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

    const commercialWithDuration: Commercial = {
      ...commercial,
      duration: Math.round(probe.durationSeconds),
    };

    commercialRepository.create(commercialWithDuration);
    enqueueIngestNormalization(commercialWithDuration);
    return { message: `Commercial ${commercial.title} Created`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function getAllCommercials(): Commercial[] {
  return commercialRepository.findAll();
}

export function getCommercial(mediaItemId: string): Commercial | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const commercial = commercialRepository.findByMediaItemId(mediaItemId);
  if (!commercial) {
    throw new Error("Commercial does not exist");
  }

  return commercial;
}

export function updateCommercial(
  mediaItemId: string,
  updates: Partial<Commercial>,
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = commercialRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Commercial does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId,
    };

    commercialRepository.update(mediaItemId, updated);
    return { message: "Commercial Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteCommercial(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const commercial = commercialRepository.findByMediaItemId(mediaItemId);
    if (!commercial) {
      return { message: "Commercial does not exist", status: 400 };
    }

    commercialRepository.delete(mediaItemId);
    return { message: `Commercial ${commercial.title} Deleted`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
