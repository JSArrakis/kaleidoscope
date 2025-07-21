import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';

export interface IShort extends BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: string[];
}

export class Short {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];

  constructor(
    title: string,
    loadtitle: string,
    duration: number,
    path: string,
    type: number,
    tags: string[],
  ) {
    this.title = title;
    this.mediaItemId = loadtitle;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static fromRequestObject(requestObject: any): Short {
    return new Short(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Short,
      requestObject.tags,
    );
  }
}
