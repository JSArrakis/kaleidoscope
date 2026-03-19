import * as tagController from "../controllers/tagController.js";
export async function getMusicGenresHandler() {
    return tagController.getTagsByType("MusicGenre");
}
export async function createMusicGenreHandler(musicGenre) {
    return tagController.createTag({ ...musicGenre, type: "MusicGenre" });
}
export async function deleteMusicGenreHandler(musicGenre) {
    return tagController.deleteTag(musicGenre.tagId);
}
