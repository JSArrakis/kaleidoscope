import * as tagController from "../controllers/tagController.js";
export async function getAgeGroupsHandler() {
    return tagController.getTagsByType("AgeGroup");
}
export async function createAgeGroupHandler(ageGroup) {
    return tagController.createTag({ ...ageGroup, type: "AgeGroup" });
}
export async function deleteAgeGroupHandler(ageGroup) {
    return tagController.deleteTag(ageGroup.tagId);
}
export async function updateAgeGroupHandler(ageGroup) {
    return tagController.updateTag(ageGroup.tagId, {
        ...ageGroup,
        type: "AgeGroup",
    });
}
