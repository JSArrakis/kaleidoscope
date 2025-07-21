import { StreamType } from './enum/streamTypes';

export class ProgressionContext {
  title: string;
  loadTitle: string;
  environment: string;
  type: StreamType;
  watchRecords: WatchRecord[];

  constructor(
    title: string,
    loadTitle: string,
    environment: string,
    type: StreamType,
    progressions: WatchRecord[],
  ) {
    this.title = title;
    this.loadTitle = loadTitle;
    this.environment = environment;
    this.type = type;
    this.watchRecords = progressions;
  }
}

export class WatchRecord {
  title: string;
  mediaItemId: string;
  episode: number;
  lastPlayed: number;
  nextEpisodeDurLimit: number;

  constructor(
    title: string,
    loadTitle: string,
    episode: number,
    lastPlayed: number,
    nextEpisodeDurLimit: number,
  ) {
    this.title = title;
    this.mediaItemId = loadTitle;
    this.episode = episode;
    this.lastPlayed = lastPlayed;
    this.nextEpisodeDurLimit = nextEpisodeDurLimit;
  }
}

export interface IWatchRecord {
  title: string;
  mediaItemId: string;
  episode: number;
  lastPlayed: number;
}

export interface IProgressionContext extends Document {
  title: string;
  mediaItemId: string;
  type: string;
  progressions: WatchRecord[];
}
