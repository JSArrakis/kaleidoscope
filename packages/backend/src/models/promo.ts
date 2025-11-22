import { MediaType } from './enum/mediaTypes';
import { Tag } from './tag';
import { BaseMedia } from './mediaInterface';

export interface IPromo extends BaseMedia {
  type: MediaType;
}

export class Promo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: MediaType;
  tags: Tag[];

  constructor(
    title: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: MediaType,
    tags: Tag[],
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
    let tags: Tag[] = [];
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
