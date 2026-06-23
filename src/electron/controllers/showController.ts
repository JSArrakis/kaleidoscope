import { showRepository } from "../repositories/showRepository.js";
import { enqueueIngestNormalizationForShow } from "../services/normalization/ingestNormalizationService.js";
import { checkBootstrapCoverageTrigger } from "../services/bootstrap/bootstrapIncrementalTriggers.js";
import { bootstrapLogger } from "../services/bootstrap/bootstrapLogger.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";

export async function createShow(
  show: Show,
): Promise<{ message: string; status: number }> {
  try {
    if (!show.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = showRepository.findByMediaItemId(show.mediaItemId);
    if (existing) {
      return {
        message: `The Media Item ID '${show.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    // Probe all episode files to get durations
    if (show.episodes && show.episodes.length > 0) {
      console.log(
        `[showController] Probing ${show.episodes.length} episode(s) for show: ${show.title}`,
      );

      for (const episode of show.episodes) {
        if (!episode.path) {
          return {
            message: `Episode ${episode.episodeNumber} is missing a file path`,
            status: 400,
          };
        }

        const probe = await probeMediaMetadataHandler(episode.path);

        if (!probe.isPlayable) {
          return {
            message: `Episode ${episode.episodeNumber} file is not playable: ${probe.errorMessage || "Unknown error"}`,
            status: 400,
          };
        }

        if (!probe.durationSeconds || probe.durationSeconds <= 0) {
          return {
            message: `Could not determine duration for episode ${episode.episodeNumber}`,
            status: 400,
          };
        }

        // Populate duration from probe
        episode.duration = Math.round(probe.durationSeconds);
        episode.durationLimit = Math.ceil(episode.duration / 1800) * 1800;
        console.log(
          `[showController] Episode ${episode.episodeNumber} probed: ${episode.duration} seconds, durationLimit: ${episode.durationLimit} seconds`,
        );
      }
    }

    showRepository.create(show);
    enqueueIngestNormalizationForShow(show);

    // Check if bootstrap pool needs any episodes from this show for coverage
    if (show.episodes && show.episodes.length > 0) {
      bootstrapLogger.logSeparator("NEW SHOW INGESTED");
      for (const episode of show.episodes) {
        bootstrapLogger.logMediaIngested({
          mediaItemId: episode.mediaItemId,
          mediaType: "Episode",
          title: `${show.title} - S${episode.season}E${episode.episode}`,
          tags: episode.tags.map((t) => `${t.type}:${t.name}`),
        });
      }
    }

    return { message: `Show ${show.title} Created`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function getAllShows(): Show[] {
  return showRepository.findAll();
}

export function getShow(mediaItemId: string): Show | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const show = showRepository.findByMediaItemId(mediaItemId);
  if (!show) {
    throw new Error("Show does not exist");
  }

  return show;
}

export function updateShow(
  mediaItemId: string,
  updates: Partial<Show>,
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = showRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Show does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId,
    };

    showRepository.update(mediaItemId, updated);

    // Check if bootstrap pool needs any episodes after tag updates
    // Episodes inherit show tags, so check all episodes
    if (updated.episodes && updated.episodes.length > 0) {
      for (const episode of updated.episodes) {
        checkBootstrapCoverageTrigger({
          mediaItemId: episode.mediaItemId,
          mediaType: "Episode",
          tags: episode.tags,
        });
      }
    }

    return { message: "Show Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteShow(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const show = showRepository.findByMediaItemId(mediaItemId);
    if (!show) {
      return { message: "Show does not exist", status: 400 };
    }

    showRepository.delete(mediaItemId);
    return { message: `Show ${show.title} Deleted`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
