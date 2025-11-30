import { MediaType } from './enum/mediaTypes';
import { Tag } from './tag';
import { BaseMedia } from './mediaInterface';
import { tagRepository } from '../repositories/tagsRepository';

export interface IBumper extends BaseMedia {
  type: MediaType;
}

export class Bumper {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: MediaType;
  tags: Tag[];

  constructor(
    title: string,
    loadtitle: string,
    duration: number,
    path: string,
    type: MediaType,
    tags: Tag[],
  ) {
    this.title = title;
    this.mediaItemId = loadtitle;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static async fromRequestObject(requestObject: any): Promise<Bumper> {
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

    return new Bumper(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Bumper,
      tags,
    );
  }
}
