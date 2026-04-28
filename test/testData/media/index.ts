export * from "./commercials";
export * from "./movies";
export * from "./music";
export * from "./promos";
export * from "./shorts";
export * from "./shows";

export * from "./defaultCommercials";

import { commercials, realisticCommercials } from "./commercials";
import { movies, realisticMovies } from "./movies";
import { music, realisticMusicVideos } from "./music";
import { promos, realisticPromos } from "./promos";
import { shorts, realisticShorts } from "./shorts";
import { shows } from "./shows";
import { extendedDefaultCommercials } from "./defaultCommercials";

export const allShows: Show[] = shows;
export const allMovies: Movie[] = [...movies, ...realisticMovies];
export const allCommercials: Commercial[] = [
  ...commercials,
  ...realisticCommercials,
  ...extendedDefaultCommercials,
];
export const allPromos: Promo[] = [...promos, ...realisticPromos];
export const allShorts: Short[] = [...shorts, ...realisticShorts];
export const allMusicVideos: Music[] = [...music, ...realisticMusicVideos];

export const allEpisodes: Episode[] = allShows.flatMap(
  (show) => show.episodes || [],
);

export const allTestMedia = {
  movies: allMovies,
  shows: allShows,
  episodes: allEpisodes,
  commercials: allCommercials,
  promos: allPromos,
  shorts: allShorts,
  musicVideos: allMusicVideos,
};

export const allTestMediaList: Array<
  Movie | Show | Episode | Commercial | Promo | Short | Music
> = [
  ...allMovies,
  ...allShows,
  ...allEpisodes,
  ...allCommercials,
  ...allPromos,
  ...allShorts,
  ...allMusicVideos,
];

const mediaIndexEntries = allTestMediaList.map(
  (item) => [item.mediaItemId, item] as const,
);
export const testMediaById = new Map<
  string,
  Movie | Show | Episode | Commercial | Promo | Short | Music
>(mediaIndexEntries);

export function getTestMediaById(
  mediaItemId: string,
): Movie | Show | Episode | Commercial | Promo | Short | Music | undefined {
  return testMediaById.get(mediaItemId);
}

export function pickTestMedia<T extends { mediaItemId: string }>(
  source: T[],
  mediaItemIds: string[],
): T[] {
  const wanted = new Set(mediaItemIds);
  return source.filter((item) => wanted.has(item.mediaItemId));
}
