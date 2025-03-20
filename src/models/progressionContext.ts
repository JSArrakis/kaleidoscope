import mongoose, { Document, Model } from 'mongoose';
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

  static fromMongoObject(mongoObject: any): ProgressionContext {
    return new ProgressionContext(
      mongoObject.title,
      mongoObject.loadTitle,
      mongoObject.environment,
      mongoObject.type,
      mongoObject.progressions.map((progression: any) =>
        WatchRecord.fromMongoObject(progression),
      ),
    );
  }

  static toMongoObject(mediaProgression: ProgressionContext): any {
    return {
      title: mediaProgression.title,
      loadTitle: mediaProgression.loadTitle,
      environment: mediaProgression.environment,
      type: mediaProgression.type,
      episodes: mediaProgression.watchRecords.map((progression: WatchRecord) =>
        WatchRecord.toMongoObject(progression),
      ),
    };
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

  static fromMongoObject(mongoObject: any): WatchRecord {
    return new WatchRecord(
      mongoObject.title,
      mongoObject.loadTitle,
      mongoObject.episode,
      mongoObject.lastPlayed,
      mongoObject.nextEpisodeDurLimit,
    );
  }

  static toMongoObject(progression: WatchRecord): any {
    return {
      title: progression.title,
      loadTitle: progression.mediaItemId,
      episode: progression.episode,
      lastPlayed: progression.lastPlayed,
      nextEpisodeDurLimit: progression.nextEpisodeDurLimit,
    };
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

export const WatchRecordSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  episode: Number,
  lastPlayed: Number,
});

export const ProgressionContextSchema = new mongoose.Schema({
  title: String,
  mediaItemId: {
    type: String,
    index: true,
  },
  type: String,
  progressions: [WatchRecordSchema],
});

export const ProgressionContextModel: Model<IProgressionContext> =
  mongoose.model<IProgressionContext>('Progression', ProgressionContextSchema);
