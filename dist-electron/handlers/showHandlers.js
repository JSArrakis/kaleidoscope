import * as showController from "../controllers/showController.js";
export async function getShowsHandler() {
    console.log("[showHandler] IPC: getShows");
    return showController.getAllShows();
}
export async function createShowHandler(show) {
    console.log("[showHandler] IPC: createShow -", show.mediaItemId);
    // Type-safe call with proper Show type matching backend repository
    return showController.createShow(show);
}
export async function deleteShowHandler(show) {
    console.log('[showHandler] IPC: deleteShow -', show.mediaItemId);
    return showController.deleteShow(show.mediaItemId);
}
export async function updateShowHandler(show) {
    console.log('[showHandler] IPC: updateShow -', show.mediaItemId);
    // Type-safe call with Partial<Show> since controller expects updates
    return showController.updateShow(show.mediaItemId, show);
}
