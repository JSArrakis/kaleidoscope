import * as tagController from "../controllers/tagController.js";

export async function getAestheticTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType(TagType.Aesthetic);
}

export async function createAestheticTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: TagType.Aesthetic });
}

export async function deleteAestheticTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
