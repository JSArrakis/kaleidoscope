import * as tagController from "../controllers/tagController.js";
export async function getEraTagsHandler() {
    return tagController.getTagsByType(TagType.Era);
}
export async function createEraTagHandler(tag) {
    return tagController.createTag({ ...tag, type: TagType.Era });
}
export async function deleteEraTagHandler(tag) {
    return tagController.deleteTag(tag.tagId);
}
