import { MainGenres } from '../../src/models/const/mainGenres';
import {
  MusicGenres,
  MusicSubGenres,
} from '../../src/models/const/musicGenres';
import { Mosaic } from '../../src/models/mosaic';
import { makeTag } from '../utils/tagFactory';

export const actionMosaic: Mosaic = {
  tagId: MainGenres.Action,
  tags: [makeTag(MainGenres.Action)],
  musicGenres: [
    MusicGenres.Rock,
    MusicGenres.Metal,
    MusicGenres.Punk,
    MusicGenres.HipHop,
  ],
};

export const horrorMosaic: Mosaic = {
  tagId: MainGenres.Horror,
  tags: [makeTag(MainGenres.Horror)],
  musicGenres: [MusicGenres.Metal],
};

export const scifiMosaic: Mosaic = {
  tagId: MainGenres.SciFi,
  tags: [makeTag(MainGenres.SciFi)],
  musicGenres: [],
  // Keep musicSubGenres flattened into musicGenres for current tests
};

export const actionHorrorMosaic: Mosaic = {
  tagId: `${MainGenres.Action}-${MainGenres.Horror}`,
  tags: [makeTag(MainGenres.Action), makeTag(MainGenres.Horror)],
  musicGenres: [MusicGenres.Metal],
};

export const actionSciFiMosaic: Mosaic = {
  tagId: `${MainGenres.Action}-${MainGenres.SciFi}`,
  tags: [makeTag(MainGenres.Action), makeTag(MainGenres.SciFi)],
  musicGenres: [],
};

export const horrorSciFiMosaic: Mosaic = {
  tagId: `${MainGenres.Horror}-${MainGenres.SciFi}`,
  tags: [makeTag(MainGenres.Horror), makeTag(MainGenres.SciFi)],
  musicGenres: [],
};

export const actionHorrorSciFiMosaic: Mosaic = {
  tagId: `${MainGenres.Action}-${MainGenres.Horror}-${MainGenres.SciFi}`,
  tags: [
    makeTag(MainGenres.Action),
    makeTag(MainGenres.Horror),
    makeTag(MainGenres.SciFi),
  ],
  musicGenres: [MusicGenres.Metal],
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
