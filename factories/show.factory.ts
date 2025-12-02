import { randomUUID } from "crypto";

/**
 * Factory function to create a Show with constructor-style parameters
 */
export function createShow(
  title?: string,
  mediaItemId?: string,
  alias?: string,
  imdb?: string,
  durationLimit?: number,
  firstEpisodeOverDuration?: boolean,
  tags?: Tag[],
  secondaryTags?: Tag[],
  type?: MediaType,
  episodeCount?: number,
  episodes?: Episode[]
): Show {
  const id = mediaItemId ?? randomUUID();
  const epCount = episodeCount ?? 3;
  return {
    mediaItemId: id,
    title: title ?? `Test Show ${id.substring(0, 8)}`,
    alias: alias ?? `test-show-${id.substring(0, 8)}`,
    imdb: imdb ?? `tt${id.substring(0, 7)}`,
    durationLimit: durationLimit ?? 3600,
    firstEpisodeOverDuration: firstEpisodeOverDuration ?? false,
    episodeCount: epCount,
    type: type ?? MediaType.Show,
    tags: tags ?? [],
    secondaryTags: secondaryTags ?? [],
    episodes: episodes ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
