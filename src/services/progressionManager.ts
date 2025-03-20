import { ProgressionContext, WatchRecord } from '../models/progressionContext';
import { Show } from '../models/show';
import { IStreamRequest } from '../models/streamRequest';
import { keyNormalizer } from '../utils/utilities';
import { StreamType } from '../models/enum/streamTypes';

// This module is responsible for managing the progression of shows and movies. It is used to keep track of the episode number of the show that was last played and the next episode to be played.
// The progression is stored in the database and is loaded into the service on startup. The progression is updated when a show is played and the next episode is selected.
// The progression is also updated when there is 10% of the show episode remaining in the process of being played. As is the record contained in the DB.
// This is accomplished via a calculation within background service between the current time, the start time of the item, and the duration of the item.
// While this module is a singleton, it is meant to not save state bewtween executions of the service. The progression is loaded from the database on startup and should consider shows and movies played after then have been played by the background service.
// The progression is used mainly to prepopulate the on deck stream with movies and show episodes in order. As long as the stream is running, the progression will be maintained.

let progressionContextList: ProgressionContext[] = [];

export function SetLocalProgressionContextList(prog: ProgressionContext[]) {
  progressionContextList = prog;
}

export function ManageShowProgression(
  show: Show,
  numberOfEpisodes: number,
  args: IStreamRequest,
  streamType: StreamType,
  collection: string = '',
): number[] {
  // Array to hold the episode numbers
  let episodeNumbers: number[] = [];
  // Get the stream args to determine the correct media progression to pull the show progression from
  let progressionContextLoadTitle = keyNormalizer(args.Title);
  // Find the media progression in the media progression list
  let progressionContext: ProgressionContext;
  if (collection !== '') {
    progressionContext = GetProgressionContext(
      collection,
      keyNormalizer(collection),
      args.Env,
      StreamType.Block,
    );
  } else {
    progressionContext = GetProgressionContext(
      args.Title,
      progressionContextLoadTitle,
      args.Env,
      streamType,
    );
  }

  // Find the show progression in the media progression
  let showProgression = GetWatchRecord(progressionContext, show);

  // Get the episodes to add to the stream queue
  episodeNumbers = GetEpisodeNumbers(
    progressionContextLoadTitle,
    show,
    showProgression,
    numberOfEpisodes,
  );
  return episodeNumbers;
}

export function GetProgressionContext(
  progressionContextTitle: string,
  progressionContextLoadTitle: string,
  environment: string,
  type: StreamType,
): ProgressionContext {
  // Find the media progression in the list
  let progressionContext = progressionContextList.find(
    prog => prog.loadTitle === progressionContextLoadTitle,
  );
  // If the media progression is not found, create a new one
  if (!progressionContext) {
    progressionContext = new ProgressionContext(
      progressionContextTitle,
      progressionContextLoadTitle,
      environment,
      type,
      [],
    );
    progressionContextList.push(progressionContext);
  }

  return progressionContext;
}

export function GetWatchRecord(
  progressionContext: ProgressionContext,
  show: Show,
): WatchRecord {
  // Find the progression in the media progression
  let watchRecord = progressionContext.watchRecords.find(
    wr => wr.mediaItemId === keyNormalizer(show.title),
  );
  // If the progression is not found, create a new one in the media progression list
  if (!watchRecord) {
    watchRecord = new WatchRecord(
      show.title,
      keyNormalizer(show.title),
      0,
      0,
      GetEpisodeDurLimit(show, 1),
    );
    // Find the media progression index
    let progressionContextIdx = progressionContextList.findIndex(
      prog => prog.loadTitle === progressionContext.loadTitle,
    );
    // Add the progression to the media progression list
    progressionContextList[progressionContextIdx].watchRecords.push(
      watchRecord,
    );
  }

  return watchRecord;
}

export function GetEpisodeNumbers(
  progressionContextLoadTitle: string,
  show: Show,
  watchRecord: WatchRecord,
  numberOfEpisodes: number,
): number[] {
  // Array to hold the episode numbers
  let episodeNumbers: number[] = [];
  // If the show has not been played, start from the first episode
  let episodeNumber = 0;
  if (watchRecord.episode === 0) {
    //Loop for number of episodes requested
    for (let i = 1; i <= numberOfEpisodes; i++) {
      // If the episode number selected exceeds the number of episodes, iterate through the episodes from the beginning again
      if (i > show.episodeCount) {
        episodeNumber++;
        if (episodeNumber > show.episodeCount) {
          episodeNumber = 1;
        }
        episodeNumbers.push(episodeNumber);
        IncrementWatchRecord(
          progressionContextLoadTitle,
          watchRecord.mediaItemId,
          episodeNumber,
          show,
        );
      } else {
        episodeNumbers.push(i);
        IncrementWatchRecord(
          progressionContextLoadTitle,
          watchRecord.mediaItemId,
          i,
          show,
        );
      }
    }
  } else {
    // If the show has been played, start from the next episode
    //Loop for number of episodes requested
    episodeNumber = watchRecord.episode;
    for (let i = 1; i <= numberOfEpisodes; i++) {
      episodeNumber++;
      // If the episode number selected exceeds the number of episodes, iterate through the episodes from the beginning again
      if (episodeNumber > show.episodeCount) {
        if (episodeNumber > show.episodeCount) {
          episodeNumber = 1;
        }
        episodeNumbers.push(episodeNumber);
        IncrementWatchRecord(
          progressionContextLoadTitle,
          watchRecord.mediaItemId,
          episodeNumber,
          show,
        );
      } else {
        episodeNumbers.push(episodeNumber);
        IncrementWatchRecord(
          progressionContextLoadTitle,
          watchRecord.mediaItemId,
          episodeNumber,
          show,
        );
      }
    }
  }

  return episodeNumbers;
}

export function IncrementWatchRecord(
  progressionContextLoadTitle: string,
  loadTitle: string,
  episode: number,
  show: Show,
): void {
  //Sets local progression to the next episode
  // Find the media progression index
  let progressionContextIdx = progressionContextList.findIndex(
    prog => prog.loadTitle === progressionContextLoadTitle,
  );
  // Find the progression index
  let watchRecordIdx = progressionContextList[
    progressionContextIdx
  ].watchRecords.findIndex(wr => wr.mediaItemId === loadTitle);
  // Increment the episode number
  progressionContextList[progressionContextIdx].watchRecords[
    watchRecordIdx
  ].episode = episode;
  let nextEpisode = episode + 1;
  if (nextEpisode + 1 > show.episodeCount) {
    nextEpisode = 1;
  }
  // Set the next episode duration limit
  progressionContextList[progressionContextIdx].watchRecords[
    watchRecordIdx
  ].nextEpisodeDurLimit = GetEpisodeDurLimit(show, nextEpisode);
}

export function AddAnthologyProgression(
  title: string,
  type: string,
  progressions: ProgressionContext[],
  anthology: string,
) {
  // TODO
}

export function GetShowListWatchRecords(
  args: IStreamRequest,
  shows: Show[],
  streamType: StreamType,
): WatchRecord[] {
  // Get all WatchRecords records for show list
  let watchRecords: WatchRecord[] = [];
  shows.forEach(show => {
    let progressionContext = GetProgressionContext(
      args.Title,
      keyNormalizer(args.Title),
      args.Env,
      streamType,
    );
    if (progressionContext) {
      let watchRecord = GetWatchRecord(progressionContext, show);
      if (watchRecord) {
        watchRecords.push(watchRecord);
      }
    }
  });
  return watchRecords;
}

export function GetEpisodeDurLimit(show: Show, episodeNumber: number): number {
  let durationLimit = 0;
  if (show.episodes) {
    let episode = show.episodes.find(ep => ep.episodeNumber === episodeNumber);
    if (episode) {
      durationLimit = episode.durationLimit;
    }
  }
  return durationLimit;
}
