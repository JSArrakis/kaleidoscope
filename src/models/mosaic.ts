export interface IMosaic {
  key: string;
  genres: string[];
  musicGenres: string[];
  musicSubGenres: string[];
}

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

  static fromRequestObject(requestObject: any): Mosaic {
    return new Mosaic(
      requestObject.key,
      requestObject.genre,
      requestObject.musicGenres,
      requestObject.musicSubGenres,
    );
  }
}
