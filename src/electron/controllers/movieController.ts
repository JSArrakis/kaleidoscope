import { movieRepository } from "../repositories/movieRepository.js";
import { enqueueIngestNormalization } from "../services/normalization/ingestNormalizationService.js";
import { checkBootstrapCoverageTrigger } from "../services/bootstrap/bootstrapIncrementalTriggers.js";
import { bootstrapLogger } from "../services/bootstrap/bootstrapLogger.js";
import { probeMediaMetadataHandler } from "../handlers/mediaProbeHandlers.js";

/**
 * Create a new movie
 */
export async function createMovie(
  movie: Movie,
): Promise<{ message: string; status: number }> {
  try {
    console.log(
      "[movieController] Creating movie:",
      movie.mediaItemId,
      movie.title,
    );
    if (!movie.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    if (!movie.path) {
      return { message: "File path is required", status: 400 };
    }

    const existing = movieRepository.findByMediaItemId(movie.mediaItemId);
    if (existing) {
      console.log("[movieController] Movie already exists:", movie.mediaItemId);
      return {
        message: `The Media Item ID '${movie.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    // Probe the file to get duration and metadata
    console.log("[movieController] Probing file:", movie.path);
    const probe = await probeMediaMetadataHandler(movie.path);

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

    // Populate duration from probe
    const duration = Math.round(probe.durationSeconds);
    const durationLimit = Math.ceil(duration / 1800) * 1800;

    const movieWithDuration: Movie = {
      ...movie,
      duration,
      durationLimit,
    };

    console.log(
      "[movieController] File probed successfully, duration:",
      movieWithDuration.duration,
      "seconds, durationLimit:",
      movieWithDuration.durationLimit,
      "seconds",
    );

    movieRepository.create(movieWithDuration);
    enqueueIngestNormalization(movieWithDuration);

    // Log media ingest for bootstrap tracking
    bootstrapLogger.logSeparator("NEW MOVIE INGESTED");
    bootstrapLogger.logMediaIngested({
      mediaItemId: movie.mediaItemId,
      mediaType: "Movie",
      title: movie.title,
      tags: movie.tags.map((t) => `${t.type}:${t.name}`),
    });
    checkBootstrapCoverageTrigger({
      mediaItemId: movie.mediaItemId,
      mediaType: "Movie",
      tags: movie.tags,
    });

    console.log(
      "[movieController] Movie created successfully:",
      movie.mediaItemId,
    );
    return {
      message: `Movie ${movie.title} Created`,
      status: 200,
    };
  } catch (error) {
    console.error("[movieController] Error creating movie:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

/**
 * Get all movies
 */
export function getAllMovies(): Movie[] {
  console.log("[movieController] Fetching all movies");
  const movies = movieRepository.findAll();
  console.log("[movieController] Found", movies.length, "movies");
  return movies;
}

/**
 * Get movie by mediaItemId
 */
export function getMovie(mediaItemId: string): Movie | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const movie = movieRepository.findByMediaItemId(mediaItemId);
  if (!movie) {
    throw new Error("Movie does not exist");
  }

  return movie;
}

/**
 * Update existing movie
 */
export function updateMovie(
  mediaItemId: string,
  updates: Partial<Movie>,
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = movieRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Movie does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId, // Ensure ID doesn't change
    };

    movieRepository.update(mediaItemId, updated);

    // Check if bootstrap pool needs this movie for coverage after tag updates
    checkBootstrapCoverageTrigger({
      mediaItemId: updated.mediaItemId,
      mediaType: "Movie",
      tags: updated.tags,
    });

    return { message: "Movie Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

/**
 * Delete movie
 */
export function deleteMovie(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    console.log("[movieController] Deleting movie:", mediaItemId);
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const movie = movieRepository.findByMediaItemId(mediaItemId);
    if (!movie) {
      console.log("[movieController] Movie not found:", mediaItemId);
      return { message: "Movie does not exist", status: 400 };
    }

    movieRepository.delete(mediaItemId);
    console.log("[movieController] Movie deleted successfully:", mediaItemId);
    return { message: `Movie ${movie.title} Deleted`, status: 200 };
  } catch (error) {
    console.error("[movieController] Error deleting movie:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
