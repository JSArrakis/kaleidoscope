import { MediaType } from './enum/mediaTypes';
import { MediaTag } from './const/tagTypes';

export interface IDefaultPromo {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: MediaTag[];
}

export class DefaultPromo {
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

  static fromRequestObject(requestObject: any): DefaultPromo {
    return new DefaultPromo(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Promo,
      requestObject.tags,
    );
  }
}
