import mongoose, { Document, Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';

export interface IShort extends BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: string[];
}

export const ShortSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class Short {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];

  constructor(
    title: string,
    loadtitle: string,
    duration: number,
    path: string,
    type: number,
    tags: string[],
  ) {
    this.title = title;
    this.mediaItemId = loadtitle;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static fromMongoObject(mongoObject: any): Short {
    return new Short(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      mongoObject.type,
      mongoObject.tags,
    );
  }

  static toMongoObject(movie: Short): any {
    return {
      title: movie.title,
      mediaItemId: movie.mediaItemId,
      duration: movie.duration,
      path: movie.path,
      type: movie.type,
      tags: movie.tags,
    };
  }

  static fromRequestObject(requestObject: any): Short {
    return new Short(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Short,
      requestObject.tags,
    );
  }
}

export const ShortModel: Model<IShort> = mongoose.model<IShort>(
  'Short',
  ShortSchema,
);
