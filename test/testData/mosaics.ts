import { MainGenres } from '../../src/models/const/mainGenres';
import {
  MusicGenres,
  MusicSubGenres,
} from '../../src/models/const/musicGenres';
import { Mosaic } from '../../src/models/mosaic';

export const actionMosaic: Mosaic = {
  key: MainGenres.Action,
  genres: [MainGenres.Action],
  musicGenres: [
    MusicGenres.Rock,
    MusicGenres.Metal,
    MusicGenres.Punk,
    MusicGenres.HipHop,
  ],
  musicSubGenres: [],
};

export const horrorMosaic: Mosaic = {
  key: MainGenres.Horror,
  genres: [MainGenres.Horror],
  musicGenres: [MusicGenres.Metal],
  musicSubGenres: [
    MusicSubGenres.DarkWave,
    MusicSubGenres.IndustrialRock,
    MusicSubGenres.Synthwave,
    MusicSubGenres.AvantGarde,
  ],
};

export const scifiMosaic: Mosaic = {
  key: MainGenres.SciFi,
  genres: [MainGenres.SciFi],
  musicGenres: [],
  musicSubGenres: [
    MusicSubGenres.ElectronicMinimalist,
    MusicSubGenres.ElectronicAmbient,
    MusicSubGenres.NeoClassical,
  ],
};

export const actionHorrorMosaic: Mosaic = {
  key: `${MainGenres.Action}-${MainGenres.Horror}`,
  genres: [MainGenres.Action, MainGenres.Horror],
  musicGenres: [MusicGenres.Metal],
  musicSubGenres: [
    MusicSubGenres.IndustrialRock,
    MusicSubGenres.Synthwave,
    MusicSubGenres.PostRock,
  ],
};

export const actionSciFiMosaic: Mosaic = {
  key: `${MainGenres.Action}-${MainGenres.SciFi}`,
  genres: [MainGenres.Action, MainGenres.SciFi],
  musicGenres: [],
  musicSubGenres: [
    MusicSubGenres.Synthwave,
    MusicSubGenres.IndustrialRock,
    MusicSubGenres.NeoClassical,
    MusicSubGenres.Ambient,
  ],
};

export const horrorSciFiMosaic: Mosaic = {
  key: `${MainGenres.Horror}-${MainGenres.SciFi}`,
  genres: [MainGenres.Horror, MainGenres.SciFi],
  musicGenres: [],
  musicSubGenres: [
    MusicSubGenres.IndustrialRock,
    MusicSubGenres.DarkWave,
    MusicSubGenres.Synthwave,
    MusicSubGenres.AvantGarde,
  ],
};

export const actionHorrorSciFiMosaic: Mosaic = {
  key: `${MainGenres.Action}-${MainGenres.Horror}-${MainGenres.SciFi}`,
  genres: [MainGenres.Action, MainGenres.Horror, MainGenres.SciFi],
  musicGenres: [MusicGenres.Metal],
  musicSubGenres: [
    MusicSubGenres.IndustrialRock,
    MusicSubGenres.DarkAmbient,
    MusicSubGenres.Synthwave,
    MusicSubGenres.Breakcore,
  ],
};

export const mosaics: Mosaic[] = [
  actionMosaic,
  horrorMosaic,
  scifiMosaic,
  actionHorrorMosaic,
  actionSciFiMosaic,
  horrorSciFiMosaic,
  actionHorrorSciFiMosaic,
];
