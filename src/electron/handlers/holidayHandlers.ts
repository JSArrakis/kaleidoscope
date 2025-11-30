import * as tagController from "../controllers/tagController.js";

export async function getHolidaysHandler(): Promise<Tag[]> {
  return tagController.getTagsByType("Holiday");
}

export async function createHolidayHandler(
  holiday: Tag
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...holiday, type: "Holiday" });
}

export async function deleteHolidayHandler(
  holiday: Tag
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(holiday.tagId);
}

export async function updateHolidayHandler(
  holiday: Tag
): Promise<{ message: string; status: number }> {
  return tagController.updateTag(holiday.tagId, {
    ...holiday,
    type: "Holiday",
  });
}
