import mongoose, { Model, Schema } from 'mongoose';
import { BaseMedia } from './mediaInterface';

export interface IMovie extends BaseMedia {
  Title: string;
  LoadTitle: string;
  Alias: string;
  IMDB: string;
  Tags: string[];
  Path: string;
  Duration: number;
  DurationLimit: number;
  Collections: ICollectionReference[];
}

export interface ICollectionReference {
  ID: string;
  Title: string;
  Sequence: number;
}

export class CollectionReference {
  ID: string;
  Title: string;
  Sequence: number;

  constructor(id: string, title: string, sequence: number) {
    this.ID = id;
    this.Title = title;
    this.Sequence = sequence;
  }
}

// Define the CollectionReference schema
const CollectionReferenceSchema = new Schema({
  ID: String,
  Title: String,
  Sequence: Number,
});

export const MovieSchema = new mongoose.Schema({
  Title: String,
  LoadTitle: String,
  Alias: String,
  IMDB: String,
  Tags: [String],
  Path: String,
  Duration: Number,
  DurationLimit: Number,
  Collections: [CollectionReferenceSchema], // Reference the CollectionReference schema here
});

export class Movie {
  Title: string;
  LoadTitle: string;
  Alias: string;
  IMDB: string;
  Tags: string[];
  Path: string;
  Duration: number;
  DurationLimit: number;
  Collections: CollectionReference[];

  constructor(
    title: string,
    loadTitle: string,
    alias: string,
    imdb: string,
    tags: string[],
    path: string,
    duration: number,
    durationLimit: number,
    collections: CollectionReference[],
  ) {
    this.Title = title;
    this.LoadTitle = loadTitle;
    this.Alias = alias;
    this.IMDB = imdb;
    this.Tags = tags;
    this.Path = path;
    this.Duration = duration;
    this.DurationLimit = durationLimit;
    this.Collections = collections;
  }

  static fromMongoObject(mongoObject: any): Movie {
    return new Movie(
      mongoObject.title,
      mongoObject.loadTitle,
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
      title: movie.Title,
      loadTitle: movie.LoadTitle,
      alias: movie.Alias,
      imdb: movie.IMDB,
      tags: movie.Tags,
      path: movie.Path,
      duration: movie.Duration,
      durationLimit: movie.DurationLimit,
      collections: movie.Collections,
    };
  }

  static fromRequestObject(requestObject: any): Movie {
    return new Movie(
      requestObject.title,
      requestObject.loadTitle,
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
