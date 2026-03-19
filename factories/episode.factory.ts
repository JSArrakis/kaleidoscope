import { randomUUID } from "crypto";

/**
 * Factory function to create an Episode with constructor-style parameters
 */
export function createEpisode(
  season?: string,
  episode?: string,
  episodeNumber?: number,
  path?: string,
  title?: string,
  mediaItemId?: string,
  showItemId?: string,
  duration?: number,
  durationLimit?: number,
  overDuration?: boolean,
  type?: MediaType,
  tags?: any[]
): Episode {
  const id = mediaItemId ?? randomUUID();
  const showId = showItemId ?? randomUUID();
  return {
    mediaItemId: id,
    showItemId: showId,
    season: season ?? "1",
    episode: episode ?? "1",
    episodeNumber: episodeNumber ?? 1,
    title: title ?? `Test Episode ${id.substring(0, 8)}`,
    path: path ?? `/media/shows/test-${id.substring(0, 8)}.mp4`,
    duration: duration ?? 2700,
    durationLimit: durationLimit ?? 3600,
    overDuration: overDuration ?? false,
    type: type ?? MediaType.Episode,
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
