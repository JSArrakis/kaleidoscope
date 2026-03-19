import * as tagController from "../controllers/tagController.js";

export async function getGenreTagsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType(TagType.Genre);
}

export async function createGenreTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...tag, type: TagType.Genre });
}

export async function deleteGenreTagHandler(
  tag: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(tag.tagId);
}
