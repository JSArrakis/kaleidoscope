import { BaseMedia } from './mediaInterface';
import { Tag } from './tag';
import { MediaTag } from './const/tagTypes';
import { tagRepository } from '../repositories/tagsRepository';

export interface IMovie {
  title: string;
  mediaItemId: string;
  alias: string;
  imdb: string;
  tags: MediaTag[];
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
  tags: MediaTag[];
  path: string;
  duration: number;
  durationLimit: number;
  collections: CollectionReference[];

  constructor(
    title: string,
    mediaItemId: string,
    alias: string,
    imdb: string,
    tags: MediaTag[],
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
    // Handle tag names - convert tag names (strings) to Tag objects
    const tags: MediaTag[] = [];
    for (const tagName of requestObject.tags) {
      if (typeof tagName === 'string') {
        // Look up the tag by name in the database (try exact match first, then case-insensitive)
        let foundTag = tagRepository.findByName(tagName);
        if (!foundTag) {
          foundTag = tagRepository.findByNameIgnoreCase(tagName);
        }

        if (foundTag) {
          tags.push(foundTag);
        } else {
          console.warn(`Tag with name "${tagName}" not found`);
        }
      }
    }

    return new Movie(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.alias,
      requestObject.imdb,
      tags,
      requestObject.path,
      requestObject.duration,
      requestObject.durationLimit,
      requestObject.collections || [],
    );
  }
}
