import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';
import { Tag } from './tag';
import { tagRepository } from '../repositories/tagsRepository';

export interface IMusic extends BaseMedia {
  artist: string;
  type: MediaType;
}

export class Music {
  title: string;
  artist: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: MediaType;
  tags: Tag[];

  constructor(
    title: string,
    artist: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: MediaType,
    tags: Tag[],
  ) {
    this.title = title;
    this.artist = artist;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static async fromRequestObject(requestObject: any): Promise<Music> {
    // Convert tag names to Tag objects
    const tags: Tag[] = [];
    if (requestObject.tags && Array.isArray(requestObject.tags)) {
      for (const tagName of requestObject.tags) {
        const tag = tagRepository.findByName(tagName);
        if (tag) {
          tags.push(tag);
        }
      }
    }

    return new Music(
      requestObject.title,
      requestObject.artist,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Music,
      tags,
    );
  }
}
