import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';
import { Tag } from './tag';

export interface ICommercial extends BaseMedia {
  type: MediaType;
}

export class Commercial {
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

  static async fromRequestObject(requestObject: any): Promise<Commercial> {
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

    return new Commercial(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Commercial,
      tags,
    );
  }
}
