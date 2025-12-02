import { createMovie } from "../../../factories/movie.factory";
import { ageGroupTags, aestheticTags, eraTags, genreTags } from "../tags";

export const inception = createMovie(
  "Inception",
  "inception",
  "inception",
  "tt1375666",
  "/path/inception.mp4",
  8880,
  9000,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.thriller,
    aestheticTags.nearFuture,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.twentytens,
  ]
);

export const therock = createMovie(
  "The Rock",
  "therock",
  "therock",
  "tt0117500",
  "/path/therock.mp4",
  8160,
  9000,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.thriller,
    aestheticTags.military,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ]
);

export const thematrix = createMovie(
  "The Matrix",
  "thematrix",
  "matrix",
  "tt0133093",
  "/path/thematrix.mp4",
  8160,
  9000,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.action,
    aestheticTags.cyberpunk,
    aestheticTags.contemporary,
    ageGroupTags.youngAdult,
    eraTags.nineties,
  ]
);

export const interstellar = createMovie(
  "Interstellar",
  "interstellar",
  "interstellar",
  "tt0816692",
  "/path/interstellar.mp4",
  10140,
  10800,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.nearFuture,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ]
);

export const dune = createMovie(
  "Dune",
  "dune",
  "dune",
  "tt1160419",
  "/path/dune.mp4",
  9120,
  10800,
  MediaType.Movie,
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.spaceOpera,
    ageGroupTags.youngAdult,
    eraTags.twentytwenties,
  ]
);

export const terminator2 = createMovie(
  "Terminator 2: Judgement Day",
  "terminator2",
  "terminator2",
  "tt0103064",
  "/path/terminator2.mp4",
  9300,
  10800,
  MediaType.Movie,
  [
    genreTags.action,
    genreTags.scifi,
    genreTags.horror,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ]
);

export const therescuersdownunder = createMovie(
  "The Rescuers Down Under",
  "therescuersdownunder",
  "therescuersdownunder",
  "tt0100477",
  "/path/therescuersdownunder.mp4",
  4620,
  5400,
  MediaType.Movie,
  [
    genreTags.adventure,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ]
);

export const agoofymovie = createMovie(
  "A Goofy Movie",
  "agoofymovie",
  "agoofymovie",
  "tt0113198",
  "/path/agoofymovie.mp4",
  4680,
  5400,
  MediaType.Movie,
  [
    genreTags.comedy,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ]
);

export const movies = [
  inception,
  therock,
  thematrix,
  interstellar,
  dune,
  terminator2,
  therescuersdownunder,
  agoofymovie,
];
