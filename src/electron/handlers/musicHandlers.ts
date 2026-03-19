import * as musicController from "../controllers/musicController.js";

export async function getMusicHandler(): Promise<Music[]> {
  console.log("[musicHandler] IPC: getMusic");
  return musicController.getAllMusic();
}

export async function createMusicHandler(
  music: Music
): Promise<{ message: string; status: number }> {
  console.log("[musicHandler] IPC: createMusic -", music.mediaItemId);
  // Type-safe call with proper Music type matching backend repository
  return musicController.createMusic(music);
}

export async function deleteMusicHandler(
  music: Music
): Promise<{ message: string; status: number }> {
  console.log("[musicHandler] IPC: deleteMusic -", music.mediaItemId);
  return musicController.deleteMusic(music.mediaItemId);
}

export async function updateMusicHandler(
  music: Music
): Promise<{ message: string; status: number }> {
  console.log("[musicHandler] IPC: updateMusic -", music.mediaItemId);
  // Type-safe call with Partial<Music> since controller expects updates
  return musicController.updateMusic(music.mediaItemId, music);
}
