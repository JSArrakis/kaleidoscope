import { createMediaBlock } from "../../factories/mediaBlock.factory.js";
import { collectionRepository } from "../../repositories/collectionRepository.js";
import { movieRepository } from "../../repositories/movieRepository.js";
import { programmingBlockRepository } from "../../repositories/programmingBlockRepository.js";
import { showRepository } from "../../repositories/showRepository.js";
import { tagRepository } from "../../repositories/tagsRepository.js";
import { doesNextEpisodeFitDuration } from "./selectionHelpers.js";
import { resolveCollectionAwareAnchorSelection } from "./collectionProgressionSelector.js";
import * as streamManager from "../streamManager.js";
import { MediaType } from "../../models.js";
import { MediaBlock } from "../../types/MediaBlock.js";

/**
 * Blocks are scheduled inserts inside continuous/adhoc streams.
 * This builder composes the anchor segment for one scheduled block occurrence.
 */
export function buildScheduledProgrammingBlockSegment(
  definition: ProgrammingBlockDefinition,
  options: {
    parentStreamType: StreamType;
    scheduledStartTime: number;
    cadence: boolean;
  },
): [MediaBlock[], string] {
  if (definition.type === "ShowOrder" && !options.cadence) {
    return [
      [],
      `Programming block \"${definition.name}\" requires cadenced mode`,
    ];
  }

  // Scheduled block execution uses an isolated in-memory episode progression map.
  streamManager.setProgressionMap(new Map<string, number | undefined>());
  streamManager.setRandomEpisodeStart(false);
  const collectionScopeKey = `programmingBlock:${definition.programmingBlockId}`;
  streamManager.loadCollectionProgressionForScope(collectionScopeKey);

  let mediaBlocks: MediaBlock[] = [];
  let errorMessage = "";
  if (definition.type === "CuratedMovieMarathon") {
    [mediaBlocks, errorMessage] = buildCuratedMovieMarathonBlocks(
      definition,
      collectionScopeKey,
      options.parentStreamType,
      options.scheduledStartTime,
    );
  } else if (definition.type === "TagThemed") {
    [mediaBlocks, errorMessage] = buildTagThemedBlocks(
      definition,
      collectionScopeKey,
      options.parentStreamType,
      options.scheduledStartTime,
    );
  } else if (definition.type === "ShowOrder") {
    [mediaBlocks, errorMessage] = buildShowOrderBlocks(
      definition,
      options.parentStreamType,
      options.scheduledStartTime,
    );
  } else {
    return [
      [],
      `Programming block type \"${definition.type}\" is not implemented yet`,
    ];
  }

  if (errorMessage) {
    return [[], errorMessage];
  }

  if (mediaBlocks.length === 0) {
    return [[], `No playable movies found for block \"${definition.name}\"`];
  }

  return [mediaBlocks, ""];
}

export function getScheduledProgrammingBlockAppointmentStarts(
  definition: ProgrammingBlockDefinition,
  scheduledStartTime: number,
  parentStreamType: StreamType,
): number[] {
  const [segmentBlocks] = buildScheduledProgrammingBlockSegment(definition, {
    parentStreamType,
    scheduledStartTime,
    cadence: true,
  });

  return segmentBlocks.map((block) => block.startTime).sort((a, b) => a - b);
}

function buildShowOrderBlocks(
  definition: ProgrammingBlockDefinition,
  parentStreamType: StreamType,
  scheduledStartTime: number,
): [MediaBlock[], string] {
  const sourceContext: MediaBlockSourceContext = {
    streamType: parentStreamType,
    programmingBlockId: definition.programmingBlockId,
  };
  const orderedShowIds = programmingBlockRepository.findOrderedShowIds(
    definition.programmingBlockId,
  );

  if (orderedShowIds.length === 0) {
    return [
      [],
      `ShowOrder block \"${definition.name}\" has no ordered show members`,
    ];
  }

  const blockDurationBudget = Math.max(0, definition.durationMinutes) * 60;
  const mediaBlocks: MediaBlock[] = [];

  let elapsed = 0;
  for (const showId of orderedShowIds) {
    const remaining = blockDurationBudget - elapsed;
    if (remaining <= 0) {
      break;
    }

    const show = showRepository.findByMediaItemId(showId);
    if (!show) {
      continue;
    }

    const nextEpisodeNumber = doesNextEpisodeFitDuration(show, remaining);
    if (!nextEpisodeNumber) {
      continue;
    }

    const episode = show.episodes[nextEpisodeNumber - 1];
    if (!episode || !episode.duration || episode.duration > remaining) {
      continue;
    }

    mediaBlocks.push(
      createMediaBlock(
        [],
        episode,
        scheduledStartTime + elapsed,
        sourceContext,
      ),
    );
    elapsed += episode.duration;
    streamManager.updateProgression(show.mediaItemId, nextEpisodeNumber);
  }

  if (mediaBlocks.length === 0) {
    return [
      [],
      `ShowOrder block \"${definition.name}\" could not select any episodes within duration budget`,
    ];
  }

  return [mediaBlocks, ""];
}

function buildTagThemedBlocks(
  definition: ProgrammingBlockDefinition,
  collectionScopeKey: string,
  parentStreamType: StreamType,
  scheduledStartTime: number,
): [MediaBlock[], string] {
  const config = programmingBlockRepository.findTagThemedConfig(
    definition.programmingBlockId,
  );

  if (!config.mode) {
    return [
      [],
      `TagThemed block \"${definition.name}\" is missing movieMode configuration`,
    ];
  }

  if (config.tagIds.length === 0) {
    return [
      [],
      `TagThemed block \"${definition.name}\" has no thematic tags configured`,
    ];
  }

  const tags = config.tagIds
    .map((tagId) => tagRepository.findByTagId(tagId))
    .filter((tag): tag is Tag => !!tag);

  if (tags.length === 0) {
    return [
      [],
      `TagThemed block \"${definition.name}\" has no valid thematic tags in DB`,
    ];
  }

  const blockDurationBudget = Math.max(0, definition.durationMinutes) * 60;
  const mediaBlocks: MediaBlock[] = [];
  const selectedMovieIds = new Set<string>();
  const sourceContext: MediaBlockSourceContext = {
    streamType: parentStreamType,
    programmingBlockId: definition.programmingBlockId,
  };

  let elapsed = 0;
  while (elapsed < blockDurationBudget) {
    const remaining = blockDurationBudget - elapsed;

    const rawSelectedAnchor = selectTagThemedAnchor(
      config.mode,
      tags,
      config.tagIds,
      remaining,
      selectedMovieIds,
      parentStreamType,
    );

    if (!rawSelectedAnchor) {
      break;
    }

    const selectedAnchor = resolveCollectionAwareAnchorSelection({
      selectedAnchor: rawSelectedAnchor,
      scopeKey: collectionScopeKey,
      streamTimepoint: scheduledStartTime + elapsed,
      remainingDuration: remaining,
      enforceWithinSeconds: Number.MAX_SAFE_INTEGER,
      selectFallbackMovieOutsideCollection: (collectionId: string) => {
        const excludedIds = collectionRepository
          .findItemsByCollectionId(collectionId)
          .map((item) => item.mediaItemId);

        const candidates = movieRepository
          .findByTagsUnderDuration(tags, remaining)
          .filter(
            (movie) =>
              !selectedMovieIds.has(movie.mediaItemId) &&
              !excludedIds.includes(movie.mediaItemId),
          );

        if (candidates.length === 0) {
          return null;
        }

        return (
          candidates[Math.floor(Math.random() * candidates.length)] || null
        );
      },
      selectFallbackEpisode: () =>
        selectTagThemedEpisode(config.tagIds, remaining, parentStreamType),
    });

    mediaBlocks.push(
      createMediaBlock(
        [],
        selectedAnchor,
        scheduledStartTime + elapsed,
        sourceContext,
      ),
    );
    elapsed += selectedAnchor.duration || 0;

    if (selectedAnchor.type === MediaType.Movie) {
      selectedMovieIds.add(selectedAnchor.mediaItemId);
    }
  }

  if (mediaBlocks.length === 0) {
    return [
      [],
      `TagThemed block \"${definition.name}\" could not select any anchor media`,
    ];
  }

  return [mediaBlocks, ""];
}

function selectTagThemedAnchor(
  mode: ProgrammingBlockMovieMode,
  tags: Tag[],
  tagIds: string[],
  remainingDuration: number,
  selectedMovieIds: Set<string>,
  parentStreamType: StreamType,
): Movie | Episode | null {
  switch (mode) {
    case "Movie":
      return selectTagThemedMovie(tags, remainingDuration, selectedMovieIds);

    case "Show":
      return selectTagThemedEpisode(
        tagIds,
        remainingDuration,
        parentStreamType,
      );

    case "MovieAndShow": {
      const preferMovie = Math.random() < 0.5;
      const first = preferMovie
        ? selectTagThemedMovie(tags, remainingDuration, selectedMovieIds)
        : selectTagThemedEpisode(tagIds, remainingDuration, parentStreamType);

      if (first) {
        return first;
      }

      return preferMovie
        ? selectTagThemedEpisode(tagIds, remainingDuration, parentStreamType)
        : selectTagThemedMovie(tags, remainingDuration, selectedMovieIds);
    }

    default:
      return null;
  }
}

function selectTagThemedMovie(
  tags: Tag[],
  remainingDuration: number,
  selectedMovieIds: Set<string>,
): Movie | null {
  const candidates = movieRepository.findByTagsUnderDuration(
    tags,
    remainingDuration,
  );
  if (candidates.length === 0) {
    return null;
  }

  const unseen = candidates.filter(
    (movie) => !selectedMovieIds.has(movie.mediaItemId),
  );
  const pool = unseen.length > 0 ? unseen : candidates;

  return pool[Math.floor(Math.random() * pool.length)] || null;
}

function selectTagThemedEpisode(
  tagIds: string[],
  remainingDuration: number,
  parentStreamType: StreamType,
): Episode | null {
  const showCandidates =
    showRepository.findByTagsAndDurationWithProgressionCheck(
      tagIds,
      parentStreamType,
      remainingDuration,
    );

  if (showCandidates.length === 0) {
    return null;
  }

  for (let i = showCandidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [showCandidates[i], showCandidates[j]] = [
      showCandidates[j],
      showCandidates[i],
    ];
  }

  for (const show of showCandidates) {
    const nextEpisodeNumber = doesNextEpisodeFitDuration(
      show,
      remainingDuration,
    );
    if (!nextEpisodeNumber) {
      continue;
    }

    const episode = show.episodes[nextEpisodeNumber - 1];
    if (!episode) {
      continue;
    }

    streamManager.updateProgression(show.mediaItemId, nextEpisodeNumber);
    return episode;
  }

  return null;
}

function buildCuratedMovieMarathonBlocks(
  definition: ProgrammingBlockDefinition,
  collectionScopeKey: string,
  parentStreamType: StreamType,
  scheduledStartTime: number,
): [MediaBlock[], string] {
  const orderedMovieIds = programmingBlockRepository.findOrderedMovieIds(
    definition.programmingBlockId,
  );

  if (orderedMovieIds.length === 0) {
    return [
      [],
      `Programming block \"${definition.name}\" has no curated movie members`,
    ];
  }

  const blockDurationBudget = Math.max(0, definition.durationMinutes) * 60;
  const mediaBlocks: MediaBlock[] = [];
  const selectedMovieIds = new Set<string>();
  const sourceContext: MediaBlockSourceContext = {
    streamType: parentStreamType,
    programmingBlockId: definition.programmingBlockId,
  };

  let elapsed = 0;
  while (elapsed < blockDurationBudget) {
    const remaining = blockDurationBudget - elapsed;
    const movie = selectCuratedMovie(
      orderedMovieIds,
      remaining,
      selectedMovieIds,
    );
    if (!movie) {
      break;
    }

    const selectedAnchor = resolveCollectionAwareAnchorSelection({
      selectedAnchor: movie,
      scopeKey: collectionScopeKey,
      streamTimepoint: scheduledStartTime + elapsed,
      remainingDuration: remaining,
      enforceWithinSeconds: Number.MAX_SAFE_INTEGER,
      selectFallbackMovieOutsideCollection: (collectionId: string) => {
        const excludedIds = collectionRepository
          .findItemsByCollectionId(collectionId)
          .map((item) => item.mediaItemId);

        return movieRepository.findRandomMovieUnderDurationExcluding(
          remaining,
          [],
          excludedIds,
        );
      },
      selectFallbackEpisode: () => {
        const showCandidates =
          showRepository.findAllShowsUnderDuration(remaining);

        for (const show of showCandidates) {
          const nextEpisodeNumber = doesNextEpisodeFitDuration(show, remaining);
          if (!nextEpisodeNumber) {
            continue;
          }

          const episode = show.episodes[nextEpisodeNumber - 1];
          if (!episode) {
            continue;
          }

          streamManager.updateProgression(show.mediaItemId, nextEpisodeNumber);
          return episode;
        }

        return null;
      },
    });

    const duration = selectedAnchor.duration || 0;
    if (duration <= 0 || elapsed + duration > blockDurationBudget) {
      break;
    }

    mediaBlocks.push(
      createMediaBlock(
        [],
        selectedAnchor,
        scheduledStartTime + elapsed,
        sourceContext,
      ),
    );
    elapsed += duration;

    if (selectedAnchor.type === MediaType.Movie) {
      selectedMovieIds.add(selectedAnchor.mediaItemId);
    }
  }

  if (mediaBlocks.length === 0) {
    return [
      [],
      `Programming block \"${definition.name}\" could not fit any curated movie inside duration budget`,
    ];
  }

  return [mediaBlocks, ""];
}

function selectCuratedMovie(
  orderedMovieIds: string[],
  remainingDuration: number,
  selectedMovieIds: Set<string>,
): Movie | null {
  const candidates = orderedMovieIds
    .map((movieId) => movieRepository.findByMediaItemId(movieId))
    .filter((movie): movie is Movie => !!movie)
    .filter(
      (movie) =>
        (movie.duration || 0) > 0 && (movie.duration || 0) <= remainingDuration,
    );

  if (candidates.length === 0) {
    return null;
  }

  const unseen = candidates.filter(
    (movie) => !selectedMovieIds.has(movie.mediaItemId),
  );
  const pool = unseen.length > 0 ? unseen : candidates;
  return pool[Math.floor(Math.random() * pool.length)] || null;
}
