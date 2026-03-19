import * as tagController from "../controllers/tagController.js";
export async function getSpecialtyTagsHandler() {
    return tagController.getTagsByType("Specialty");
}
export async function createSpecialtyTagHandler(tag) {
    return tagController.createTag({ ...tag, type: "Specialty" });
}
export async function deleteSpecialtyTagHandler(tag) {
    return tagController.deleteTag(tag.tagId);
}
