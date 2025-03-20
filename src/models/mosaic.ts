import mongoose, { Model } from 'mongoose';

export interface IMosaic {
  key: string;
  genres: string[];
  musicGenres: string[];
  musicSubGenres: string[];
}

export const MosaicSchema = new mongoose.Schema({
  key: String,
  genres: [String],
  musicGenres: [String],
  musicSubGenres: [String],
});

export class Mosaic {
  key: string;
  genres: string[];
  musicGenres: string[];
  musicSubGenres: string[];

  constructor(
    key: string,
    genres: string[],
    musicGenres: string[],
    musicSubGenres: string[],
  ) {
    this.key = key;
    this.genres = genres;
    this.musicGenres = musicGenres;
    this.musicSubGenres = musicSubGenres;
  }

  static fromMongoObject(mongoObject: any): Mosaic {
    return new Mosaic(
      mongoObject.key,
      mongoObject.genre,
      mongoObject.musicGenres,
      mongoObject.musicSubGenres,
    );
  }

  static toMongoObject(mosaic: Mosaic): any {
    return {
      key: mosaic.key,
      genre: mosaic.genres,
      musicGenres: mosaic.musicGenres,
      musicSubGenres: mosaic.musicSubGenres,
    };
  }

  static fromRequestObject(requestObject: any): Mosaic {
    return new Mosaic(
      requestObject.key,
      requestObject.genre,
      requestObject.musicGenres,
      requestObject.musicSubGenres,
    );
  }
}

export const MosaicModel: Model<IMosaic> = mongoose.model<IMosaic>(
  'Mosaic',
  MosaicSchema,
);
