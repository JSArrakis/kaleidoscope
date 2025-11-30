import * as tagController from "../controllers/tagController.js";

export async function getEraTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType("Era");
}

export async function createEraTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: "Era" });
}

export async function deleteEraTagHandler(
  tag: Tag
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
