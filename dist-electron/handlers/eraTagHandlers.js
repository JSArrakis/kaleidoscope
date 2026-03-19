import * as tagController from "../controllers/tagController.js";
export async function getEraTagsHandler() {
    return tagController.getTagsByType("Era");
}
export async function createEraTagHandler(tag) {
    return tagController.createTag({ ...tag, type: "Era" });
}
export async function deleteEraTagHandler(tag) {
    return tagController.deleteTag(tag.tagId);
}
