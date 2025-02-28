import { AgeGroups } from '../../src/models/const/ageGroups';
import { Eras } from '../../src/models/const/eras';
import { MainGenres } from '../../src/models/const/mainGenres';
import { MediaType } from '../../src/models/enum/mediaTypes';
import { Short } from '../../src/models/short';

export const code8 = new Short(
  'Code 8',
  'code8',
  600,
  '/path/code8.mp4',
  MediaType.Short,
  [
    MainGenres.Action,
    MainGenres.SciFi,
    AgeGroups.YoungAdult,
    Eras.twothousands,
  ],
);
export const lightsout = new Short(
  'Lights Out',
  'lightsout',
  180,
  '/path/lightsout.mp4',
  MediaType.Short,
  [MainGenres.Horror, AgeGroups.Mature, Eras.twothousands],
);
export const rakka = new Short(
  'Rakka',
  'rakka',
  480,
  '/path/rakka.mp4',
  MediaType.Short,
  [MainGenres.SciFi, AgeGroups.Mature, Eras.twothousands],
);
export const theblackhole = new Short(
  'The Black Hole',
  'theblackhole',
  180,
  '/path/theblackhole.mp4',
  MediaType.Short,
  [
    MainGenres.SciFi,
    MainGenres.Horror,
    AgeGroups.YoungAdult,
    Eras.twothousands,
  ],
);
export const cargo = new Short(
  'Cargo',
  'cargo',
  420,
  '/path/cargo.mp4',
  MediaType.Short,
  [MainGenres.Horror, AgeGroups.Mature, Eras.twothousands],
);
export const dust = new Short(
  'Dust',
  'dust',
  600,
  '/path/dust.mp4',
  MediaType.Short,
  [
    MainGenres.SciFi,
    MainGenres.Action,
    AgeGroups.YoungAdult,
    Eras.twothousands,
  ],
);
export const portal = new Short(
  'Portal',
  'portal',
  480,
  '/path/portal.mp4',
  MediaType.Short,
  [
    MainGenres.SciFi,
    MainGenres.Action,
    AgeGroups.YoungAdult,
    Eras.twothousands,
  ],
);
export const thegate = new Short(
  'The Gate',
  'thegate',
  360,
  '/path/thegate.mp4',
  MediaType.Short,
  [MainGenres.Horror, MainGenres.Action, AgeGroups.Mature, Eras.twothousands],
);
export const alienharvest = new Short(
  'Alien: Harvest',
  'alienharvest',
  540,
  '/path/alienharvest.mp4',
  MediaType.Short,
  [MainGenres.SciFi, MainGenres.Horror, AgeGroups.Mature, Eras.twothousands],
);
export const adam = new Short(
  'Adam',
  'adam',
  540,
  '/path/adam.mp4',
  MediaType.Short,
  [MainGenres.SciFi, AgeGroups.YoungAdult, Eras.twothousands],
);

export const gopherBroke = new Short(
  'Gopher Broke',
  'gopherbroke',
  300,
  '/path/gopherbroke.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.twothousands],
);

export const forTheBirds = new Short(
  'For the Birds',
  'forthebirds',
  240,
  '/path/forthebirds.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.nnineties],
);

export const boundin = new Short(
  'Boundin’',
  'boundin',
  300,
  '/path/boundin.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.twothousands],
);

export const tinToy = new Short(
  'Tin Toy',
  'tintoy',
  300,
  '/path/tintoy.mp4',
  MediaType.Short,
  [MainGenres.Adventure, MainGenres.SciFi, AgeGroups.Kids, Eras.nnineties],
);

export const theAdventuresOfAndreAndWallyB = new Short(
  'The Adventures of André and Wally B.',
  'andreandwallyb',
  120,
  '/path/andreandwallyb.mp4',
  MediaType.Short,
  [MainGenres.Adventure, MainGenres.SciFi, AgeGroups.Kids, Eras.nnineties],
);

export const luxoJunior = new Short(
  'Luxo Jr.',
  'luxojunior',
  120,
  '/path/luxojunior.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const oneManBand = new Short(
  'One Man Band',
  'onemanband',
  300,
  '/path/onemanband.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.twothousands],
);

export const lifted = new Short(
  'Lifted',
  'lifted',
  300,
  '/path/lifted.mp4',
  MediaType.Short,
  [MainGenres.SciFi, AgeGroups.Kids, Eras.twothousands],
);

export const knickknack = new Short(
  'Knick Knack',
  'knickknack',
  240,
  '/path/knickknack.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.nnineties],
);

export const partlyCloudy = new Short(
  'Partly Cloudy',
  'partlycloudy',
  300,
  '/path/partlycloudy.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.twothousands],
);

export const presto = new Short(
  'Presto',
  'presto',
  300,
  '/path/presto.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Kids, Eras.twothousands],
);

export const gerisGame = new Short(
  'Geri’s Game',
  'gerisgame',
  240,
  '/path/gerisgame.mp4',
  MediaType.Short,
  [MainGenres.Adventure, AgeGroups.Family, Eras.nnineties],
);

export const shorts = [
  code8,
  lightsout,
  rakka,
  theblackhole,
  cargo,
  dust,
  portal,
  thegate,
  alienharvest,
  adam,
];

export const bufferShorts = [
  code8,
  lightsout,
  rakka,
  theblackhole,
  cargo,
  dust,
  portal,
  thegate,
  alienharvest,
  adam,
  gopherBroke,
  forTheBirds,
  boundin,
  tinToy,
  theAdventuresOfAndreAndWallyB,
  luxoJunior,
  oneManBand,
  lifted,
  knickknack,
  partlyCloudy,
  presto,
  gerisGame,
];
