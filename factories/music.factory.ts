import { randomUUID } from "crypto";

/**
 * Factory function to create Music with constructor-style parameters
 */
export function createMusic(
  title?: string,
  artist?: string,
  mediaItemId?: string,
  duration?: number,
  path?: string,
  type?: MediaType,
  tags?: any[],
): Music {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Music ${id.substring(0, 8)}`,
    artist: artist ?? `Test Artist`,
    path: path ?? `/media/music/test-${id.substring(0, 8)}.mp3`,
    duration: duration ?? 180,
    type: type ?? MediaType.Music,
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}