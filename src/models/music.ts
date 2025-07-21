import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';

export interface IMusic extends BaseMedia {
  title: string;
  artist: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: number;
  tags: string[];
}

export class Music {
  title: string;
  artist: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];

  constructor(
    title: string,
    artist: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: number,
    tags: string[],
  ) {
    this.title = title;
    this.artist = artist;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static fromRequestObject(requestObject: any): Music {
    return new Music(
      requestObject.title,
      requestObject.artist,
      requestObject.mediaItemId,
      requestObject.duration,
      requestObject.path,
      MediaType.Music,
      requestObject.tags,
    );
  }
}
