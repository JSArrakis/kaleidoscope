import mongoose, { Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';

export interface IPromo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];
}

export const PromoSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class Promo {
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

  static fromMongoObject(mongoObject: any): Promo {
    return new Promo(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      mongoObject.type,
      mongoObject.tags,
    );
  }

  static toMongoObject(movie: Promo): any {
    return {
      title: movie.title,
      loadTitle: movie.mediaItemId,
      duration: movie.duration,
      path: movie.path,
      type: movie.type,
      tags: movie.tags,
    };
  }

  static fromRequestObject(requestObject: any): Promo {
    return new Promo(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Promo,
      requestObject.tags,
    );
  }
}

export const PromoModel: Model<IPromo> = mongoose.model<IPromo>(
  'Promo',
  PromoSchema,
);
