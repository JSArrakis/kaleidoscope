import mongoose, { Model } from 'mongoose';
import { MediaType } from './enum/mediaTypes';
import { BaseMedia } from './mediaInterface';

export interface IDefaultCommercial extends BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  Type: Number;
  tags: string[];
}

export const DefaultCommercialSchema = new mongoose.Schema({
  title: String,
  mediaItemId: String,
  duration: Number,
  path: String,
  type: Number,
  tags: [String],
});

export class DefaultCommercial {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: number;
  tags: string[];

  constructor(
    title: string,
    mediaItemId: string,
    duration: number,
    path: string,
    type: number,
    tags: string[],
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.duration = duration;
    this.path = path;
    this.type = type;
    this.tags = tags;
  }

  static fromMongoObject(mongoObject: any): DefaultCommercial {
    return new DefaultCommercial(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.duration,
      mongoObject.path,
      MediaType.Commercial,
      mongoObject.tags,
    );
  }

  static toMongoObject(commercial: DefaultCommercial): any {
    return {
      title: commercial.title,
      loadTitle: commercial.mediaItemId,
      duration: commercial.duration,
      path: commercial.path,
      type: commercial.type,
      tags: commercial.tags,
    };
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

export const DefaultCommercialModel: Model<IDefaultCommercial> =
  mongoose.model<IDefaultCommercial>(
    'DefaultCommercial',
    DefaultCommercialSchema,
  );
