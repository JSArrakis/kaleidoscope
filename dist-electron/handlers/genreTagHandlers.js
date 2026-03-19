import * as tagController from "../controllers/tagController.js";
export async function getGenreTagsHandler() {
    return tagController.getTagsByType("Genre");
}
export async function createGenreTagHandler(tag) {
    return tagController.createTag({ ...tag, type: "Genre" });
}
export async function deleteGenreTagHandler(tag) {
    return tagController.deleteTag(tag.tagId);
}
