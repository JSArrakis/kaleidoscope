import * as tagController from "../controllers/tagController.js";

export async function getSpecialtyTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType("Specialty");
}

export async function createSpecialtyTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: "Specialty" });
}

export async function deleteSpecialtyTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
