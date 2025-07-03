import mongoose, { Model } from 'mongoose';

export interface ITag {
  tagId: string;
  name: string;
}

export const TagSchema = new mongoose.Schema({
  tagId: String,
  name: String,
});

export class Tag {
  tagId: string;
  name: string;

  constructor(tagId: string, name: string) {
    this.tagId = tagId;
    this.name = name;
  }

  static fromMongoObject(mongoObject: any): Tag {
    return new Tag(mongoObject.tagId, mongoObject.name);
  }

  static toMongoObject(Tag: Tag): any {
    return {
      tagId: Tag.tagId,
      name: Tag.name,
    };
  }

  static fromRequestObject(requestObject: any): Tag {
    return new Tag(requestObject.tagId, requestObject.name);
  }
}

export const AestheticTagModel: Model<ITag> = mongoose.model<ITag>(
  'AestheticTag',
  TagSchema,
  'aestheticTags',
);

export const GenreTagModel: Model<ITag> = mongoose.model<ITag>(
  'GenreTag',
  TagSchema,
  'genreTags',
);

export const EraTagModel: Model<ITag> = mongoose.model<ITag>(
  'EraTag',
  TagSchema,
  'eraTags',
);

export const SpecialtyTagModel: Model<ITag> = mongoose.model<ITag>(
  'SpecialtyTag',
  TagSchema,
  'specialtyTags',
);

export const MusicGenreModel: Model<ITag> = mongoose.model<ITag>(
  'MusicGenre',
  TagSchema,
  'musicGenres',
);
