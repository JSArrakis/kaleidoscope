import * as tagController from "../controllers/tagController.js";
export async function getMusicGenresHandler() {
    return tagController.getTagsByType(TagType.MusicalGenre);
}
export async function createMusicGenreHandler(musicGenre) {
    return tagController.createTag({ ...musicGenre, type: TagType.MusicalGenre });
}
export async function deleteMusicGenreHandler(musicGenre) {
    return tagController.deleteTag(musicGenre.tagId);
}
