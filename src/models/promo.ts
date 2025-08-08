import { MediaType } from './enum/mediaTypes';
import { MediaTag } from './const/tagTypes';

export interface IPromo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];
}

export class Promo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];

  constructor(
    title: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: number,
    tags: MediaTag[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static async fromRequestObject(requestObject: any): Promise<Promo> {
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

    return new Promo(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Promo,
      tags,
    );
  }
}
