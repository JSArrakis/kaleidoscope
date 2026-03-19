import * as musicController from "../controllers/musicController.js";
export async function getMusicHandler() {
    console.log("[musicHandler] IPC: getMusic");
    return musicController.getAllMusic();
}
export async function createMusicHandler(music) {
    console.log("[musicHandler] IPC: createMusic -", music.mediaItemId);
    // Type-safe call with proper Music type matching backend repository
    return musicController.createMusic(music);
}
export async function deleteMusicHandler(music) {
    console.log("[musicHandler] IPC: deleteMusic -", music.mediaItemId);
    return musicController.deleteMusic(music.mediaItemId);
}
export async function updateMusicHandler(music) {
    console.log("[musicHandler] IPC: updateMusic -", music.mediaItemId);
    // Type-safe call with Partial<Music> since controller expects updates
    return musicController.updateMusic(music.mediaItemId, music);
}
