import { collectionRepository } from "../../repositories/collectionRepository.js";
import { movieRepository } from "../../repositories/movieRepository.js";
import { MediaType } from "../../models.js";
import * as streamManager from "../streamManager.js";

type CollectionAwareSelectionArgs = {
  selectedAnchor: Movie | Episode;
  scopeKey: string;
  streamTimepoint: number;
  remainingDuration: number;
  enforceWithinSeconds?: number;
  selectFallbackMovieOutsideCollection: (collectionId: string) => Movie | null;
  selectFallbackEpisode: () => Episode | null;
};

const DEFAULT_ENFORCE_WINDOW_SECONDS = 12 * 60 * 60;

export function getPrimaryCollectionId(media: Movie | Episode): string | null {
  if (media.type !== MediaType.Movie) {
    return null;
  }

  const movie = media as Movie;

  if (!movie.collections || movie.collections.length === 0) {
    return null;
  }

  const sortedCollections = [...movie.collections].sort(
    (a, b) => a.sequence - b.sequence,
  );
  return sortedCollections[0]?.collectionId ?? null;
}

function maybeTrackSelectionCollection(
  scopeKey: string,
  anchor: Movie | Episode,
  streamTimepoint: number,
): void {
  if (anchor.type !== MediaType.Movie) {
    return;
  }

  const collectionId = getPrimaryCollectionId(anchor);
  if (!collectionId) {
    return;
  }

  streamManager.setCollectionProgression(
    scopeKey,
    collectionId,
    anchor.mediaItemId,
    streamTimepoint,
  );
}

function getNextMovieInCollection(
  collectionId: string,
  lastMovieItemId: string,
): Movie | null {
  const collectionItems =
    collectionRepository.findItemsByCollectionId(collectionId);
  if (collectionItems.length === 0) {
    return null;
  }

  const orderedItems = [...collectionItems].sort(
    (a, b) => a.sequence - b.sequence,
  );
  const currentIndex = orderedItems.findIndex(
    (item) => item.mediaItemId === lastMovieItemId,
  );
  const nextIndex =
    currentIndex >= 0 ? (currentIndex + 1) % orderedItems.length : 0;
  const nextMovieId = orderedItems[nextIndex]?.mediaItemId;
  if (!nextMovieId) {
    return null;
  }

  return movieRepository.findByMediaItemId(nextMovieId);
}

export function resolveCollectionAwareAnchorSelection(
  args: CollectionAwareSelectionArgs,
): Movie | Episode {
  const {
    selectedAnchor,
    scopeKey,
    streamTimepoint,
    remainingDuration,
    selectFallbackMovieOutsideCollection,
    selectFallbackEpisode,
  } = args;

  if (selectedAnchor.type !== MediaType.Movie) {
    return selectedAnchor;
  }

  const collectionId = getPrimaryCollectionId(selectedAnchor);
  if (!collectionId) {
    return selectedAnchor;
  }

  const progression = streamManager.getCollectionProgression(
    scopeKey,
    collectionId,
  );

  if (!progression) {
    maybeTrackSelectionCollection(scopeKey, selectedAnchor, streamTimepoint);
    return selectedAnchor;
  }

  const enforceWithinSeconds =
    args.enforceWithinSeconds ?? DEFAULT_ENFORCE_WINDOW_SECONDS;
  const shouldForceNextMovie =
    streamTimepoint - progression.lastPlayedTimestamp <= enforceWithinSeconds;

  if (!shouldForceNextMovie) {
    maybeTrackSelectionCollection(scopeKey, selectedAnchor, streamTimepoint);
    return selectedAnchor;
  }

  const nextMovie = getNextMovieInCollection(
    collectionId,
    progression.lastMovieItemId,
  );

  if (nextMovie && nextMovie.duration <= remainingDuration) {
    maybeTrackSelectionCollection(scopeKey, nextMovie, streamTimepoint);
    return nextMovie;
  }

  const fallbackMovie = selectFallbackMovieOutsideCollection(collectionId);
  if (fallbackMovie) {
    maybeTrackSelectionCollection(scopeKey, fallbackMovie, streamTimepoint);
    return fallbackMovie;
  }

  const fallbackEpisode = selectFallbackEpisode();
  if (fallbackEpisode) {
    return fallbackEpisode;
  }

  maybeTrackSelectionCollection(scopeKey, selectedAnchor, streamTimepoint);
  return selectedAnchor;
}
