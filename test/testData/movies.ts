import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';
import { MainGenres } from '../../src/models/const/mainGenres';
import { Movie } from '../../src/models/movie';

export const inception = new Movie(
  'Inception',
  'inception',
  'inception',
  'tt1375666',
  [
    MainGenres.Action,
    MainGenres.SciFi,
    MainGenres.Adventure,
    AgeGroups.Mature,
    Eras.ttens,
  ],
  '/path/inception.mp4',
  8880,
  9000,
  [],
);
export const therock = new Movie(
  'The Rock',
  'therock',
  'therock',
  'tt0117500',
  [MainGenres.Action, AgeGroups.Mature, Eras.nnineties],
  '/path/therock.mp4',
  8160,
  9000,
  [],
);

export const thematrix = new Movie(
  'The Matrix',
  'thematrix',
  'matrix',
  'tt0133093',
  [MainGenres.Action, MainGenres.SciFi, AgeGroups.YoungAdult, Eras.nnineties],
  '/path/therock.mp4',
  8160,
  9000,
  [],
);

export const interstellar = new Movie(
  'Interstellar',
  'interstellar',
  'interstellar',
  'tt0816692',
  [MainGenres.SciFi, AgeGroups.YoungAdult, Eras.ttens],
  '/path/interstellar.mp4',
  10140,
  10800,
  [],
);
export const dune = new Movie(
  'Dune',
  'dune',
  'dune',
  'tt1160419',
  [
    MainGenres.SpaceOpera,
    MainGenres.SciFi,
    AgeGroups.YoungAdult,
    Eras.ttwenties,
  ],
  '/path/dune.mp4',
  9120,
  10800,
  [],
);
export const terminator2 = new Movie(
  'Terminator 2: Judgement Day',
  'terminator2',
  'terminator2',
  'tt0103064',
  [
    MainGenres.Action,
    MainGenres.Horror,
    MainGenres.SciFi,
    AgeGroups.Mature,
    Eras.nnineties,
  ],
  '/path/terminator2.mp4',
  9300,
  10800,
  [],
);

export const therescuersdownunder = new Movie(
  'The Rescuers Down Under',
  'therescuersdownunder',
  'therescuersdownunder',
  'tt0100477',
  [MainGenres.Action, MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
  '/path/therescuersdownunder.mp4',
  4620,
  5400,
  [],
);

export const agoofymovie = new Movie(
  'A Goofy Movie',
  'agoofymovie',
  'agoofymovie',
  'tt0113198',
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
  '/path/agoofymovie.mp4',
  4680,
  5400,
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
