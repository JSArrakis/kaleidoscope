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
  mediaItemId: string;
  title: string;
  sequence: number;
}

export class CollectionReference {
  mediaItemId: string;
  title: string;
  sequence: number;

  constructor(id: string, title: string, sequence: number) {
    this.mediaItemId = id;
    this.title = title;
    this.sequence = sequence;
  }

  static fromRequestObject(requestObject: any): CollectionReference {
    return new CollectionReference(
      requestObject.mediaItemId,
      requestObject.title,
      requestObject.sequence,
    );
  }
}

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
