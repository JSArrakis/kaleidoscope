import { StreamType } from './enum/streamTypes';

export class EpisodeProgression {
  showMediaItemId: string;
  streamType: StreamType;
  currentEpisode: number;
  lastPlayed: number;
  nextEpisodeDurLimit: number;
  nextEpisodeOverDuration: boolean;

  constructor(
    showMediaItemId: string,
    streamType: StreamType,
    currentEpisode: number,
    lastPlayed: number,
    nextEpisodeDurLimit: number,
    nextEpisodeOverDuration: boolean,
  ) {
    this.showMediaItemId = showMediaItemId;
    this.streamType = streamType;
    this.currentEpisode = currentEpisode;
    this.lastPlayed = lastPlayed;
    this.nextEpisodeDurLimit = nextEpisodeDurLimit;
    this.nextEpisodeOverDuration = nextEpisodeOverDuration;
  }
}

export interface IEpisodeProgression {
  showMediaItemId: string;
  streamType: string;
  currentEpisode: number;
  lastPlayed: number;
  nextEpisodeDurLimit: number;
  nextEpisodeOverDuration: boolean;
}
