import { Movie, movieRepository } from "../repositories/movieRepository.js";
import { Tag } from "../repositories/tagsRepository.js";

/**
 * Create a new movie
 */
export async function createMovie(
  movie: Movie
): Promise<{ message: string; status: number }> {
  try {
    console.log(
      "[movieController] Creating movie:",
      movie.mediaItemId,
      movie.title
    );
    if (!movie.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = movieRepository.findByMediaItemId(movie.mediaItemId);
    if (existing) {
      console.log("[movieController] Movie already exists:", movie.mediaItemId);
      return {
        message: `The Media Item ID '${movie.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    movieRepository.create(movie);
    console.log(
      "[movieController] Movie created successfully:",
      movie.mediaItemId
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
  updates: Partial<Movie>
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
