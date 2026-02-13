import * as tagController from "../controllers/tagController.js";

export async function getAgeGroupsHandler(): Promise<Tag[]> {
  return tagController.getTagsByType(TagType.AgeGroup);
}

export async function createAgeGroupHandler(
  ageGroup: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...ageGroup, type: TagType.AgeGroup });
}

export async function deleteAgeGroupHandler(
  ageGroup: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(ageGroup.tagId);
}

export async function updateAgeGroupHandler(
  ageGroup: Tag,
): Promise<{ message: string; status: number }> {
  return tagController.updateTag(ageGroup.tagId, {
    ...ageGroup,
    type: TagType.AgeGroup,
  });
}
