/**
 * Runtime enum definitions for the renderer process.
 * These mirror the ambient declarations in types.d.ts and can be imported
 * wherever enum values are required at runtime.
 */

export enum MediaType {
  Show = "Show",
  Episode = "Episode",
  Movie = "Movie",
  Short = "Short",
  Music = "Music",
  Commercial = "Commercial",
  Promo = "Promo",
  Bumper = "Bumper",
}

export enum TagType {
  Aesthetic = "Aesthetic",
  Era = "Era",
  Genre = "Genre",
  Specialty = "Specialty",
  Holiday = "Holiday",
  AgeGroup = "AgeGroup",
  MusicalGenre = "MusicalGenre",
}

export enum StreamType {
  Cont = "Cont",
  Adhoc = "Adhoc",
}
