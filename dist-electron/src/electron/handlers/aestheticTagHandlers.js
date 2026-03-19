import * as tagController from "../controllers/tagController.js";
export async function getAestheticTagsHandler() {
    return tagController.getTagsByType(TagType.Aesthetic);
}
export async function createAestheticTagHandler(tag) {
    return tagController.createTag({ ...tag, type: TagType.Aesthetic });
}
export async function deleteAestheticTagHandler(tag) {
    return tagController.deleteTag(tag.tagId);
}
