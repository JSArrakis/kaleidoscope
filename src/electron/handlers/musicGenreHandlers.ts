import * as tagController from "../controllers/tagController.js";

export async function getMusicGenresHandler(): Promise<Tag[]> {
  return tagController.getTagsByType("MusicGenre");
}

export async function createMusicGenreHandler(
  musicGenre: Tag
): Promise<{ message: string; status: number }> {
  return tagController.createTag({ ...musicGenre, type: "MusicGenre" });
}

export async function deleteMusicGenreHandler(
  musicGenre: Tag
): Promise<{ message: string; status: number }> {
  return tagController.deleteTag(musicGenre.tagId);
}
