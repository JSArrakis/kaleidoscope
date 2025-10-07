import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';
import { MediaTag } from './const/tagTypes';

export interface IDefaultCommercial extends BaseMedia {
  name: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: Number;
  tags: MediaTag[];
}

export class DefaultCommercial {
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

  static fromRequestObject(requestObject: any): DefaultCommercial {
    return new DefaultCommercial(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Commercial,
      requestObject.tags,
    );
  }
}
