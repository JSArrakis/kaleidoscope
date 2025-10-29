import { Movie } from '../../src/models/movie';
import { MediaType } from '../../src/models/enum/mediaTypes';
import { ageGroupTags, aestheticTags, eraTags, genreTags } from './tags';

export const inception = new Movie(
  'Inception',
  'inception',
  'inception',
  'tt1375666',
  [
    genreTags.scifi,
    genreTags.thriller,
    aestheticTags.nearFuture,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.twentytens,
  ],
  '/path/inception.mp4',
  8880,
  9000,
  MediaType.Movie,
  [],
);

export const therock = new Movie(
  'The Rock',
  'therock',
  'therock',
  'tt0117500',
  [
    genreTags.action,
    genreTags.thriller,
    aestheticTags.military,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ],
  '/path/therock.mp4',
  8160,
  9000,
  MediaType.Movie,
  [],
);

export const thematrix = new Movie(
  'The Matrix',
  'thematrix',
  'matrix',
  'tt0133093',
  [
    genreTags.scifi,
    genreTags.action,
    aestheticTags.cyberpunk,
    aestheticTags.contemporary,
    ageGroupTags.youngAdult,
    eraTags.nineties,
  ],
  '/path/thematrix.mp4',
  8160,
  9000,
  MediaType.Movie,
  [],
);

export const interstellar = new Movie(
  'Interstellar',
  'interstellar',
  'interstellar',
  'tt0816692',
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.nearFuture,
    ageGroupTags.youngAdult,
    eraTags.twentytens,
  ],
  '/path/interstellar.mp4',
  10140,
  10800,
  MediaType.Movie,
  [],
);

export const dune = new Movie(
  'Dune',
  'dune',
  'dune',
  'tt1160419',
  [
    genreTags.scifi,
    genreTags.drama,
    aestheticTags.spaceOpera,
    ageGroupTags.youngAdult,
    eraTags.twentytwenties,
  ],
  '/path/dune.mp4',
  9120,
  10800,
  MediaType.Movie,
  [],
);

export const terminator2 = new Movie(
  'Terminator 2: Judgement Day',
  'terminator2',
  'terminator2',
  'tt0103064',
  [
    genreTags.action,
    genreTags.scifi,
    genreTags.horror,
    aestheticTags.contemporary,
    ageGroupTags.mature,
    eraTags.nineties,
  ],
  '/path/terminator2.mp4',
  9300,
  10800,
  MediaType.Movie,
  [],
);

export const therescuersdownunder = new Movie(
  'The Rescuers Down Under',
  'therescuersdownunder',
  'therescuersdownunder',
  'tt0100477',
  [
    genreTags.adventure,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ],
  '/path/therescuersdownunder.mp4',
  4620,
  5400,
  MediaType.Movie,
  [],
);

export const agoofymovie = new Movie(
  'A Goofy Movie',
  'agoofymovie',
  'agoofymovie',
  'tt0113198',
  [
    genreTags.comedy,
    genreTags.drama,
    aestheticTags.animation,
    aestheticTags.contemporary,
    ageGroupTags.family,
    eraTags.nineties,
  ],
  '/path/agoofymovie.mp4',
  4680,
  5400,
  MediaType.Movie,
  [],
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
