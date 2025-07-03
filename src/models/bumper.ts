import mongoose, { Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';

export interface IBumper {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];
}

export const BumperSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class Bumper {
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

  static fromMongoObject(mongoObject: any): Bumper {
    return new Bumper(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      mongoObject.type,
      mongoObject.tags,
    );
  }

  static toMongoObject(movie: Bumper): any {
    return {
      title: movie.title,
      loadTitle: movie.mediaItemId,
      duration: movie.duration,
      path: movie.path,
      type: movie.type,
      tags: movie.tags,
    };
  }

  static fromRequestObject(requestObject: any): Bumper {
    return new Bumper(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Bumper,
      requestObject.tags,
    );
  }
}

export const BumperModel: Model<IBumper> = mongoose.model<IBumper>(
  'Bumper',
  BumperSchema,
);
