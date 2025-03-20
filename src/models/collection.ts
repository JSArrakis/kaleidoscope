import mongoose, { Model } from 'mongoose';

export interface ICollection {
  mediaItemId: string;
  title: string;
  description: string;
  items: ICollectionItem[];
}

export const CollectionSchema = new mongoose.Schema({
  mediaItemId: String,
  title: String,
  description: String,
  items: [
    {
      mediaItemId: String,
      mediaItemTitle: String,
      sequence: Number,
    },
  ],
});

export class Collection {
  mediaItemId: string;
  title: string;
  description: string;
  items: CollectionItem[];

  constructor(
    mediaItemId: string,
    title: string,
    description: string,
    items: CollectionItem[],
  ) {
    this.mediaItemId = mediaItemId;
    this.title = title;
    this.description = description;
    this.items = items;
  }

  static fromMongoObject(mongoObject: any): Collection {
    return new Collection(
      mongoObject.mediaItemId,
      mongoObject.title,
      mongoObject.description,
      mongoObject.items,
    );
  }

  static toMongoObject(collection: Collection): any {
    return {
      id: collection.mediaItemId,
      title: collection.title,
      description: collection.description,
      items: collection.items,
    };
  }

  static fromRequestObject(requestObject: any): Collection {
    return new Collection(
      requestObject.mediaItemId,
      requestObject.title,
      requestObject.description,
      requestObject.items,
    );
  }
}

export interface ICollectionItem {
  mediaItemId: string;
  mediaItemTitle: string;
  sequence: number;
}

export class CollectionItem {
  mediaItemId: string;
  mediaItemTitle: string;
  sequence: number;

  constructor(mediaItemId: string, mediaItemTitle: string, sequence: number) {
    this.mediaItemId = mediaItemId;
    this.mediaItemTitle = mediaItemTitle;
    this.sequence = sequence;
  }

  static fromRequestObject(requestObject: any): CollectionItem {
    return new CollectionItem(
      requestObject.mediaItemId,
      requestObject.mediaItemTitle,
      requestObject.sequence,
    );
  }
}

export const CollectionModel: Model<ICollection> = mongoose.model<ICollection>(
  'Collection',
  CollectionSchema,
);
