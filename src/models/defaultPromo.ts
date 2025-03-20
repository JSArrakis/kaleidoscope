import mongoose, { Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';

export interface IDefaultPromo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];
}

export const DefaultPromoSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class DefaultPromo {
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

  static fromMongoObject(mongoObject: any): DefaultPromo {
    return new DefaultPromo(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      mongoObject.type,
      mongoObject.tags,
    );
  }

  static toMongoObject(movie: DefaultPromo): any {
    return {
      title: movie.title,
      loadTitle: movie.mediaItemId,
      duration: movie.duration,
      path: movie.path,
      type: movie.type,
      tags: movie.tags,
    };
  }

  static fromRequestObject(requestObject: any): DefaultPromo {
    return new DefaultPromo(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Promo,
      requestObject.tags,
    );
  }
}

export const DefaultPromoModel: Model<IDefaultPromo> =
  mongoose.model<IDefaultPromo>('DefaultPromo', DefaultPromoSchema);
