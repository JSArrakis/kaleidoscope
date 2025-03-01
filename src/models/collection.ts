import mongoose, { Model } from 'mongoose';

export interface ICollection {
  ID: string;
  Title: string;
  Description: string;
  Items: ICollectionItem[];
}

export const CollectionSchema = new mongoose.Schema({
  ID: String,
  Title: String,
  Description: String,
  Items: [
    {
      MediaItemId: String,
      MediaItemTitle: String,
      Sequence: Number,
    },
  ],
});

export class Collection {
  ID: string;
  Title: string;
  Description: string;
  Items: CollectionItem[];

  constructor(
    id: string,
    title: string,
    description: string,
    items: CollectionItem[],
  ) {
    this.ID = id;
    this.Title = title;
    this.Description = description;
    this.Items = items;
  }

  static fromMongoObject(mongoObject: any): Collection {
    return new Collection(
      mongoObject.id,
      mongoObject.title,
      mongoObject.description,
      mongoObject.items,
    );
  }

  static toMongoObject(collection: Collection): any {
    return {
      id: collection.ID,
      title: collection.Title,
      description: collection.Description,
      items: collection.Items,
    };
  }

  static fromRequestObject(requestObject: any): Collection {
    return new Collection(
      requestObject.id,
      requestObject.title,
      requestObject.description,
      requestObject.items,
    );
  }
}

export interface ICollectionItem {
  MediaItemId: string;
  MediaItemTitle: string;
  Sequence: number;
}

export class CollectionItem {
  MediaItemId: string;
  MediaItemTitle: string;
  Sequence: number;

  constructor(mediaItemId: string, mediaItemTitle: string, sequence: number) {
    this.MediaItemId = mediaItemId;
    this.MediaItemTitle = mediaItemTitle;
    this.Sequence = sequence;
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
