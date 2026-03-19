import { randomUUID } from "crypto";

/**
 * Factory function to create a Movie with constructor-style parameters
 */
export function createMovie(
  title?: string,
  mediaItemId?: string,
  alias?: string,
  imdb?: string,
  path?: string,
  duration?: number,
  durationLimit?: number,
  type?: MediaType,
  tags?: Tag[],
  isHolidayExclusive?: boolean,
): Movie {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Movie ${id.substring(0, 8)}`,
    alias,
    imdb,
    path: path ?? `/media/movies/test-${id.substring(0, 8)}.mp4`,
    duration: duration ?? 7200,
    durationLimit: durationLimit ?? 0,
    isHolidayExclusive: isHolidayExclusive ?? false,
    tags: tags ?? [],
    type: type ?? MediaType.Movie,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
