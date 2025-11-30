export interface ICollection {
  mediaItemId: string;
  title: string;
  description: string;
  items: ICollectionItem[];
}

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
