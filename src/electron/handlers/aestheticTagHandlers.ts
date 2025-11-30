import * as tagController from "../controllers/tagController.js";

export async function getAestheticTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType("Aesthetic");
}

export async function createAestheticTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: "Aesthetic" });
}

export async function deleteAestheticTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
