import * as tagController from "../controllers/tagController.js";

export async function getSpecialtyTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType(TagType.Specialty);
}

export async function createSpecialtyTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: TagType.Specialty });
}

export async function deleteSpecialtyTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
