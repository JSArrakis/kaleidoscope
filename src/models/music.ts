import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';
import { MediaTag } from './const/tagTypes';
import { tagRepository } from '../repositories/tagsRepository';

export interface IMusic extends BaseMedia {
  title: string;
  artist: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: MediaTag[];
}

export class Music {
  title: string;
  artist: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];

  constructor(
    title: string,
    artist: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: number,
    tags: MediaTag[],
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
    const tags: MediaTag[] = [];
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
