import { MediaType } from './enum/mediaTypes';
import { MediaTag } from './const/tagTypes';
import { tagRepository } from '../repositories/tagsRepository';

export interface IBumper {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];
}

export class Bumper {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];

  constructor(
    title: string,
    loadtitle: string,
    duration: number,
    path: string,
    type: number,
    tags: MediaTag[],
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
    const tags: MediaTag[] = [];
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
