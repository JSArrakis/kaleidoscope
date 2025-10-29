import { EpisodeProgression } from '../models/progressionContext';
import { Show, Episode } from '../models/show';
import { Movie } from '../models/movie';
import { IStreamRequest } from '../models/streamRequest';
import { keyNormalizer } from '../utils/utilities';
import { StreamType } from '../models/enum/streamTypes';
import { progressionRepository } from '../repositories/progressionRepository';

// This module is responsible for managing the progression of shows and movies. It is used to keep track of the episode number of the show that was last played and the next episode to be played.
// The progression is stored in the database and is accessed via the progressionRepository. The progression is updated when episodes actually finish playing (via background service).
// The progression is updated when there is 10% of the show episode remaining in the process of being played, handled by a background service.
// This is accomplished via a calculation within background service between the current time, the start time of the item, and the duration of the item.
// The progression is used mainly to prepopulate the on deck stream with movies and show episodes in order, and to inform procedural selection about episode duration limits.

export async function ManageShowProgression(
  show: Show,
  numberOfEpisodes: number,
  args: IStreamRequest,
  streamType: StreamType,
  collection: string = '',
): Promise<number[]> {
  // Get or create progression for this show and stream type
  const showMediaItemId = keyNormalizer(show.title);

  // Find existing progression or create new one
  let progression = await progressionRepository.findProgression(
    showMediaItemId,
    streamType,
  );

  if (!progression) {
    progression = new EpisodeProgression(
      showMediaItemId,
      streamType,
      0, // Start from episode 0 (will increment to 1)
      Date.now(), // lastPlayed timestamp
      0, // nextEpisodeDurLimit will be calculated
      false, // nextEpisodeOverDuration will be set based on next episode
    );
    await progressionRepository.upsertProgression(progression);
  }

  // Get episode numbers based on current progression (without incrementing progression)
  const episodeNumbers = GetEpisodeNumbers(show, progression, numberOfEpisodes);

  return episodeNumbers;
}

// Create a new progression manager function to update episode progression when episodes finish
export async function UpdateEpisodeProgression(
  showMediaItemId: string,
  streamType: StreamType,
  episodeNumber: number,
  show: Show,
): Promise<void> {
  // This function should be called by the background service when an episode finishes playing
  const progression = await progressionRepository.findProgression(
    showMediaItemId,
    streamType,
  );

  if (progression) {
    progression.currentEpisode = episodeNumber;
    progression.lastPlayed = Date.now();

    // Calculate next episode over duration flag
    const nextEpisode =
      episodeNumber + 1 > show.episodeCount ? 1 : episodeNumber + 1;
    const nextEpisodeData = show.episodes?.find(
      ep => ep.episodeNumber === nextEpisode,
    );
    progression.nextEpisodeOverDuration =
      nextEpisodeData?.overDuration || false;
    progression.nextEpisodeDurLimit =
      nextEpisodeData?.duration || show.durationLimit;

    await progressionRepository.upsertProgression(progression);
  }
}

function GetEpisodeNumbers(
  show: Show,
  progression: EpisodeProgression,
  numberOfEpisodes: number,
): number[] {
  // Array to hold the episode numbers
  const episodeNumbers: number[] = [];

  // Start from current episode (0 means start from beginning)
  let currentEpisode = progression.currentEpisode;

  // If never played before, start from episode 1
  if (currentEpisode === 0) {
    currentEpisode = 1;
  } else {
    // Otherwise, start from the next episode
    currentEpisode++;
  }

  // Generate episode numbers for the requested number of episodes
  for (let i = 0; i < numberOfEpisodes; i++) {
    // If we exceed episode count, wrap around to episode 1
    if (currentEpisode > show.episodeCount) {
      currentEpisode = 1;
    }

    episodeNumbers.push(currentEpisode);
    currentEpisode++;
  }

  return episodeNumbers;
}

// Get progression records for a list of shows
export async function GetShowListProgressions(
  shows: Show[],
  streamType: StreamType,
): Promise<EpisodeProgression[]> {
  const progressions: EpisodeProgression[] = [];

  for (const show of shows) {
    const showMediaItemId = keyNormalizer(show.title);
    const progression = await progressionRepository.findProgression(
      showMediaItemId,
      streamType,
    );

    if (progression) {
      progressions.push(progression);
    }
  }

  return progressions;
}

export function GetEpisodeDurLimit(show: Show, episodeNumber: number): number {
  let durationLimit = show.durationLimit; // Default to show duration limit
  if (show.episodes) {
    let episode = show.episodes.find(ep => ep.episodeNumber === episodeNumber);
    if (episode) {
      durationLimit = episode.duration; // Use episode duration instead of durationLimit
    }
  }
  return durationLimit;
}

// Check if the next episode in progression will be over duration
export async function IsNextEpisodeOverDuration(
  showMediaItemId: string,
  streamType: StreamType,
): Promise<boolean> {
  const progression = await progressionRepository.findProgression(
    showMediaItemId,
    streamType,
  );
  return progression?.nextEpisodeOverDuration || false;
}

// Get progression for a specific show and stream type
export function GetShowProgression(
  showMediaItemId: string,
  streamType: StreamType,
): EpisodeProgression | null {
  return progressionRepository.findProgression(
    showMediaItemId,
    streamType,
  );
}

// Get the next episode for a show based on its progression
export function GetNextEpisode(
  show: Show,
  streamType: StreamType,
): Episode | null {
  if (!show || !show.episodes || show.episodes.length === 0) {
    return null;
  }

  // Use existing GetShowProgression function to get the current progression
  const showMediaItemId = keyNormalizer(show.title);
  const progression = GetShowProgression(showMediaItemId, streamType);

  let nextEpisodeNumber: number;

  if (!progression || progression.currentEpisode === 0) {
    // No progression or not started - return first episode
    nextEpisodeNumber = 1;
  } else {
    // Get the next episode number based on current progression
    nextEpisodeNumber = progression.currentEpisode + 1;

    // If we've gone past the last episode, wrap around to the first
    if (nextEpisodeNumber > show.episodeCount) {
      nextEpisodeNumber = 1;
    }
  }

  // Find and return the episode with the calculated episode number
  const episode = show.episodes.find(
    ep => ep.episodeNumber === nextEpisodeNumber,
  );

  if (!episode) {
    console.warn(
      `Episode ${nextEpisodeNumber} not found for show ${show.title}, falling back to first episode`,
    );
    // Fallback to first episode if the calculated episode number doesn't exist
    return show.episodes.find(ep => ep.episodeNumber === 1) || show.episodes[0];
  }

  return episode;
}
