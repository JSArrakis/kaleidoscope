import mongoose, { Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';

export interface IMusic extends BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: string[];
}

export const MusicSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class Music {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];

  constructor(
    title: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: number,
    tags: string[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static fromMongoObject(mongoObject: any): Music {
    return new Music(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      mongoObject.type,
      mongoObject.tags,
    );
  }

  static toMongoObject(movie: Music): any {
    return {
      title: movie.title,
      loadTitle: movie.mediaItemId,
      duration: movie.duration,
      path: movie.path,
      type: movie.type,
      tags: movie.tags,
    };
  }

  static fromRequestObject(requestObject: any): Music {
    return new Music(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Music,
      requestObject.tags,
    );
  }
}

export const MusicModel: Model<IMusic> = mongoose.model<IMusic>(
  'Music',
  MusicSchema,
);
