import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';
import { MainGenres } from '../../src/models/const/mainGenres';
import { Movie } from '../../src/models/movie';
import { Tag } from '../../src/models/tag';

// Create mock Tag objects for testing
const mockTags = {
  // Genre tags
  action: new Tag('action', MainGenres.Action, 'Genre'),
  adventure: new Tag('adventure', MainGenres.Adventure, 'Genre'),
  scifi: new Tag('scifi', MainGenres.SciFi, 'Genre'),
  horror: new Tag('horror', MainGenres.Horror, 'Genre'),
  spaceOpera: new Tag('space-opera', MainGenres.SpaceOpera, 'Genre'),

  // Age Group tags
  mature: new Tag(
    'mature',
    AgeGroups.Mature,
    'AgeGroup',
    undefined,
    undefined,
    undefined,
    undefined,
    4,
  ),
  youngAdult: new Tag(
    'youngadult',
    AgeGroups.YoungAdult,
    'AgeGroup',
    undefined,
    undefined,
    undefined,
    undefined,
    3,
  ),
  kids: new Tag(
    'kids',
    AgeGroups.Kids,
    'AgeGroup',
    undefined,
    undefined,
    undefined,
    undefined,
    1,
  ),

  // Era tags
  nnineties: new Tag('1990s', Eras.nnineties, 'Era'),
  ttens: new Tag('2010s', Eras.ttens, 'Era'),
  ttwenties: new Tag('2020s', Eras.ttwenties, 'Era'),
};

export const inception = new Movie(
  'Inception',
  'inception',
  'inception',
  'tt1375666',
  [
    mockTags.action,
    mockTags.scifi,
    mockTags.adventure,
    mockTags.mature,
    mockTags.ttens,
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
  [mockTags.action, mockTags.mature, mockTags.nnineties],
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
  [mockTags.action, mockTags.scifi, mockTags.youngAdult, mockTags.nnineties],
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
  [mockTags.scifi, mockTags.youngAdult, mockTags.ttens],
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
    mockTags.spaceOpera,
    mockTags.scifi,
    mockTags.youngAdult,
    mockTags.ttwenties,
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
    mockTags.action,
    mockTags.horror,
    mockTags.scifi,
    mockTags.mature,
    mockTags.nnineties,
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
  [mockTags.action, mockTags.adventure, mockTags.kids, mockTags.nnineties],
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
  [mockTags.adventure, mockTags.kids, mockTags.nnineties],
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
