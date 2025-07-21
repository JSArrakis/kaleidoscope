export interface IEnvConfiguration {
  title: string;
  mediaItemId: string;
  favorites: string[];
  blackList: string[];
  defaultTags: string[];
  defaultPromo: string;
}
export class EnvConfiguration {
  title: string;
  mediaItemId: string;
  favorites: string[];
  blackList: string[];
  defaultTags: string[];
  defaultPromo: string;

  constructor(
    title: string,
    mediaItemId: string,
    favorites: string[],
    blackList: string[],
    defaultTags: string[],
    defaultPromo: string,
  ) {
    this.title = title;
    this.mediaItemId = mediaItemId;
    this.favorites = favorites;
    this.blackList = blackList;
    this.defaultTags = defaultTags;
    this.defaultPromo = defaultPromo;
  }

  static fromRequestObject(requestObject: any): EnvConfiguration {
    return new EnvConfiguration(
      requestObject.title,
      requestObject.mediaItemId,
      requestObject.favorites,
      requestObject.blackList,
      requestObject.defaultTags,
      requestObject.defaultPromo,
    );
  }
}
