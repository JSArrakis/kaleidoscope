import mongoose, { Model, Schema } from 'mongoose';
import { BaseMedia } from './mediaInterface';

export interface IMovie extends BaseMedia {
  title: string;
  mediaItemId: string;
  alias: string;
  imdb: string;
  tags: string[];
  path: string;
  duration: number;
  durationlimit: number;
  collections: ICollectionReference[];
}

export interface ICollectionReference {
  curationRefId: string;
  title: string;
  sequence: number;
}

export class CollectionReference {
  curationRefId: string;
  title: string;
  sequence: number;

  constructor(id: string, title: string, sequence: number) {
    this.curationRefId = id;
    this.title = title;
    this.sequence = sequence;
  }
}

// Define the CollectionReference schema
const CollectionReferenceSchema = new Schema({
  curationRefId: String,
  title: String,
  sequence: Number,
});

export const MovieSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  alias: String,
  imdb: String,
  tags: [String],
  path: String,
  duration: Number,
  durationLimit: Number,
  collections: [CollectionReferenceSchema], // Reference the CollectionReference schema here
});

export class Movie {
  title: string;
  mediaItemId: string;
  alias: string;
  imdb: string;
  tags: string[];
  path: string;
  duration: number;
  durationLimit: number;
  collections: CollectionReference[];

  constructor(
    title: string,
    mediaItemId: string,
    alias: string,
    imdb: string,
    tags: string[],
    path: string,
    duration: number,
    durationLimit: number,
    collections: CollectionReference[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.alias = alias;
    this.imdb = imdb;
    this.tags = tags;
    this.path = path;
    this.duration = duration;
    this.durationLimit = durationLimit;
    this.collections = collections;
  }

  static fromMongoObject(mongoObject: any): Movie {
    return new Movie(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.alias,
      mongoObject.imdb,
      mongoObject.tags,
      mongoObject.path,
      mongoObject.duration,
      mongoObject.durationLimit,
      mongoObject.collections,
    );
  }

  static toMongoObject(movie: Movie): any {
    return {
      title: movie.title,
      loadTitle: movie.mediaItemId,
      alias: movie.alias,
      imdb: movie.imdb,
      tags: movie.tags,
      path: movie.path,
      duration: movie.duration,
      durationLimit: movie.durationLimit,
      collections: movie.collections,
    };
  }

  static fromRequestObject(requestObject: any): Movie {
    return new Movie(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.alias,
      requestObject.imdb,
      requestObject.tags,
      requestObject.path,
      requestObject.duration,
      requestObject.durationLimit,
      requestObject.collections,
    );
  }
}

export const MovieModel: Model<IMovie> = mongoose.model<IMovie>(
  'Movie',
  MovieSchema,
);
