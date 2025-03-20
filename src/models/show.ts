import mongoose, { Document, Model } from 'mongoose';
import { BaseMedia } from './mediaInterface';

export interface IEpisode {
  season: number;
  episode: number;
  episodeNumber: number;
  path: string;
  title: string;
  mediaItemId: string;
  duration: number;
  durationLimit: number;
  tags: string[];
}

export interface IShow extends Document, BaseMedia {
  title: string;
  mediaItemId: string;
  alias: string;
  imdb: string;
  durationLimit: number;
  overDuration: boolean;
  firstEpisodeOverDuration: boolean;
  tags: string[];
  secondaryTags: string[];
  episodeCount: number;
  episodes: IEpisode[];
}

export const EpisodeSchema = new mongoose.Schema({
  season: Number,
  episode: Number,
  episodeNumber: Number,
  path: String,
  title: String,
  mediaItemId: String,
  duration: Number,
  durationLimit: Number,
  tags: [String],
});

export const ShowSchema = new mongoose.Schema({
  title: String,
  mediaItemId: {
    type: String,
    index: true,
  },
  alias: String,
  imdb: String,
  durationLimit: Number,
  overDuration: Boolean,
  firstEpisodeOverDuration: Boolean,
  tags: [String],
  secondaryTags: [String],
  episodeCount: Number,
  episodes: [EpisodeSchema],
});

export class ShowData {
  public title: string;
  public mediaItemId: string;
  public alias: string;
  public imdb: string;
  public durationLimit: number;
  public overDuration: boolean;
  public firstEpisodeOverDuration: boolean;
  public tags: string[];
  public secondaryTags: string[];
  public episodeCount: number;

  constructor(
    title: string,
    mediaItemId: string,
    alias: string,
    imdb: string,
    durationLimit: number,
    overDuration: boolean,
    firstEpisodeOverDuration: boolean,
    tags: string[],
    secondaryTags: string[],
    episodeCount: number,
    episodes: Episode[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.alias = alias;
    this.imdb = imdb;
    this.durationLimit = durationLimit;
    this.overDuration = overDuration;
    this.firstEpisodeOverDuration = firstEpisodeOverDuration;
    this.tags = tags;
    this.secondaryTags = secondaryTags;
    this.episodeCount = episodeCount;
  }
}

export class Episode {
  public season: number;
  public episode: number;
  public episodeNumber: number;
  public path: string;
  public title: string;
  public mediaItemId: string;
  public duration: number;
  public durationLimit: number;
  public tags: string[];

  constructor(
    season: number,
    episode: number,
    episodeNumber: number,
    path: string,
    title: string,
    mediaItemId: string,
    duration: number,
    durationLimit: number,
    tags: string[],
  ) {
    this.season = season;
    this.episode = episode;
    this.episodeNumber = episodeNumber;
    this.path = path;
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.durationLimit = durationLimit;
    this.tags = tags;
  }

  static fromMongoObject(mongoObject: any): Episode {
    return new Episode(
      mongoObject.season,
      mongoObject.episode,
      mongoObject.episodeNumber,
      mongoObject.path,
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.durationLimit,
      mongoObject.tags,
    );
  }

  static toMongoObject(episode: Episode): any {
    return {
      season: episode.season,
      episode: episode.episode,
      episodeNumber: episode.episodeNumber,
      path: episode.path,
      title: episode.title,
      mediaItemId: episode.mediaItemId,
      duration: episode.duration,
      durationLimit: episode.durationLimit,
      tags: episode.tags,
    };
  }

  static fromRequestObject(requestObject: any): Episode {
    return new Episode(
      requestObject.season,
      requestObject.episode,
      requestObject.episodeNumber,
      requestObject.path,
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.durationLimit,
      requestObject.tags,
    );
  }
}

export class Show {
  public title: string;
  public mediaItemId: string;
  public alias: string;
  public imdb: string;
  public durationLimit: number;
  public overDuration: boolean;
  public firstEpisodeOverDuration: boolean;
  public tags: string[];
  public secondaryTags: string[];
  public episodeCount: number;
  public episodes: Episode[];

  constructor(
    title: string,
    mediaItemId: string,
    alias: string,
    imdb: string,
    durationLimit: number,
    overDuration: boolean,
    firstEpisodeOverDuration: boolean,
    tags: string[],
    secondaryTags: string[],
    episodeCount: number,
    episodes: Episode[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.alias = alias;
    this.imdb = imdb;
    this.durationLimit = durationLimit;
    this.overDuration = overDuration;
    this.firstEpisodeOverDuration = firstEpisodeOverDuration;
    this.tags = tags;
    this.secondaryTags = secondaryTags;
    this.episodeCount = episodeCount;
    this.episodes = episodes;
  }

  static fromMongoObject(mongoObject: any): Show {
    return new Show(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.alias,
      mongoObject.imdb,
      mongoObject.durationLimit,
      mongoObject.overDuration,
      mongoObject.firstEpisodeOverDuration,
      mongoObject.tags,
      mongoObject.secondaryTags,
      mongoObject.episodeCount,
      mongoObject.episodes.map((episode: any) =>
        Episode.fromMongoObject(episode),
      ),
    );
  }

  static toMongoObject(show: Show): any {
    return {
      title: show.title,
      mediaItemId: show.mediaItemId,
      alias: show.alias,
      imdb: show.imdb,
      durationLimit: show.durationLimit,
      overDuration: show.overDuration,
      firstEpisodeOverDuration: show.firstEpisodeOverDuration,
      tags: show.tags,
      secondaryTags: show.secondaryTags,
      episodeCount: show.episodeCount,
      episodes: show.episodes.map((episode: Episode) =>
        Episode.toMongoObject(episode),
      ),
    };
  }

  static fromRequestObject(requestObject: any): Show {
    return new Show(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.alias,
      requestObject.imdb,
      requestObject.durationLimit,
      requestObject.overDuration,
      requestObject.firstEpisodeOverDuration,
      requestObject.tags,
      requestObject.secondaryTags,
      requestObject.episodeCount,
      requestObject.episodes.map((episode: any) =>
        Episode.fromRequestObject(episode),
      ),
    );
  }
}

export const ShowModel: Model<IShow> = mongoose.model<IShow>(
  'Show',
  ShowSchema,
);
