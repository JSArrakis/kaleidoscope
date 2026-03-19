import * as movieController from "../controllers/movieController.js";
export async function getMoviesHandler() {
    console.log("[movieHandler] IPC: getMovies");
    return movieController.getAllMovies();
}
export async function createMovieHandler(movie) {
    console.log("[movieHandler] IPC: createMovie -", movie.mediaItemId);
    // Type-safe call with proper Movie type matching backend repository
    return movieController.createMovie(movie);
}
export async function deleteMovieHandler(movie) {
    console.log("[movieHandler] IPC: deleteMovie -", movie.mediaItemId);
    return movieController.deleteMovie(movie.mediaItemId);
}
export async function updateMovieHandler(movie) {
    console.log("[movieHandler] IPC: updateMovie -", movie.mediaItemId);
    // Type-safe call with Partial<Movie> since controller expects updates
    return movieController.updateMovie(movie.mediaItemId, movie);
}
