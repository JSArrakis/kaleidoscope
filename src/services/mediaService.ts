import { Media } from '../models/media';
import { Config } from '../models/config';
import * as dataLoader from '../db/dataLoader';
import {
  createDefaultPromo,
  createDefaultCommercials,
} from '../db/defaultMedia';
import { loadDefaultEnvConfig } from '../config/configService';
import { StreamType } from '../models/enum/streamTypes';
import { IStreamRequest } from '../models/streamRequest';
import { Mosaic } from '../models/mosaic';

let media: Media = new Media([], [], [], [], [], [], [], [], []);
let mosaics: Mosaic[] = [];
let streamType: StreamType;
let args: IStreamRequest;

export function setStreamType(value: StreamType): void {
  streamType = value;
}

export function getStreamType(): StreamType {
  return streamType;
}

export function setArgs(value: IStreamRequest): void {
  args = value;
}

export function getArgs(): IStreamRequest {
  return args;
}

export async function loadMedia(config: Config): Promise<void> {
  await createDefaultCommercials(config);
  await createDefaultPromo(config);

  console.log('Loading media entries from DB...');
  media = {
    Shows: await dataLoader.loadShows(),
    Movies: await dataLoader.loadMovies(),
    Shorts: await dataLoader.loadShorts(),
    Music: await dataLoader.loadMusic(),
    Promos: await dataLoader.loadPromos(),
    DefaultPromos: await dataLoader.loadDefaultPromos(),
    Commercials: await dataLoader.loadCommercials(),
    DefaultCommercials: await dataLoader.loadDefaultCommercials(),
    Blocks: [],
  };

  await loadDefaultEnvConfig(config.DefaultPromo);

  mosaics = await dataLoader.loadMosaics();
}

export function getMedia(): Media {
  return media;
}

export function getMosaics(): Mosaic[] {
  return mosaics;
}
