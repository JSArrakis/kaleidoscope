import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';
import { MediaTag } from './const/tagTypes';

export interface IShort extends BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: MediaTag[];
}

export class Short {
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

  static async fromRequestObject(requestObject: any): Promise<Short> {
    const { tagRepository } = await import('../repositories/tagsRepository');
    
    // Convert tag names to Tag objects
    let tags: MediaTag[] = [];
    if (requestObject.tags && Array.isArray(requestObject.tags)) {
      for (const tagName of requestObject.tags) {
        const tag = tagRepository.findByName(tagName);
        if (tag) {
          tags.push(tag);
        }
      }
    }

    return new Short(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Short,
      tags,
    );
  }
}
