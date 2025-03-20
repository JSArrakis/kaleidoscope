import mongoose, { Model } from 'mongoose';

export interface IEnvConfiguration {
  title: string;
  mediaItemId: string;
  favorites: string[];
  blackList: string[];
  defaultTags: string[];
  defaultPromo: string;
}

export const EnvConfigurationSchema = new mongoose.Schema({
  title: String,
  mediaItemId: {
    type: String,
    index: true,
  },
  favorites: [String],
  blackList: [String],
  defaultTags: [String],
  defaultPromo: String,
});

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

  static fromMongoObject(mongoObject: any): EnvConfiguration {
    return new EnvConfiguration(
      mongoObject.title,
      mongoObject.mediaItemId,
      mongoObject.favorites,
      mongoObject.blackList,
      mongoObject.defaultTags,
      mongoObject.defaultPromo,
    );
  }

  static toMongoObject(envConfig: EnvConfiguration): any {
    return {
      title: envConfig.title,
      mediaItemId: envConfig.mediaItemId,
      favorites: envConfig.favorites,
      blackList: envConfig.blackList,
      defaultTags: envConfig.defaultTags,
      defaultPromo: envConfig.defaultPromo,
    };
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

export const EnvConfigurationModel: Model<IEnvConfiguration> =
  mongoose.model<IEnvConfiguration>('EnvConfiguration', EnvConfigurationSchema);
