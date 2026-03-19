import * as tagController from "../controllers/tagController.js";
export async function getHolidaysHandler() {
    return tagController.getTagsByType("Holiday");
}
export async function createHolidayHandler(holiday) {
    return tagController.createTag({ ...holiday, type: "Holiday" });
}
export async function deleteHolidayHandler(holiday) {
    return tagController.deleteTag(holiday.tagId);
}
export async function updateHolidayHandler(holiday) {
    return tagController.updateTag(holiday.tagId, {
        ...holiday,
        type: "Holiday",
    });
}
