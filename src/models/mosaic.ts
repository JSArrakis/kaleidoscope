import { MediaTag } from './const/tagTypes';

export interface IMosaic {
  tagId: string;
  tags: MediaTag[];
  musicGenres: string[];
  title?: string;
}

export class Mosaic {
  tagId: string;
  tags: MediaTag[];
  musicGenres: string[];
  title?: string;

  constructor(
    tagId: string,
    tags: MediaTag[],
    musicGenres: string[],
    title?: string,
  ) {
    this.tagId = tagId;
    this.tags = tags;
    this.musicGenres = musicGenres;
    this.title = title;
  }

  static fromRequestObject(requestObject: any): Mosaic {
    return new Mosaic(
      requestObject.tagId,
      requestObject.tags,
      requestObject.musicGenres,
      requestObject.title,
    );
  }
}
