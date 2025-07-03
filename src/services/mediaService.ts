import { Media } from '../models/media';
import { Config } from '../models/config';
import * as dataLoader from '../db/dataLoader';
import {
  createDefaultPromo,
  createDefaultCommercials,
} from '../db/defaultMedia';

import { StreamType } from '../models/enum/streamTypes';
import { IStreamRequest } from '../models/streamRequest';
import { Mosaic } from '../models/mosaic';
import { Holiday } from '../models/holiday';

let media: Media = new Media([], [], [], [], [], [], [], [], []);
let holidays: Holiday[] = [];
let currentHolidays: Holiday[] = [];
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
  // TODO - Uncomment when ready to create default media
  // await createDefaultCommercials(config);
  // await createDefaultPromo(config);

  console.log('Loading media entries from DB...');
  media = {
    shows: await dataLoader.loadShows(),
    movies: await dataLoader.loadMovies(),
    shorts: await dataLoader.loadShorts(),
    music: await dataLoader.loadMusic(),
    promos: await dataLoader.loadPromos(),
    defaultPromos: await dataLoader.loadDefaultPromos(),
    commercials: await dataLoader.loadCommercials(),
    defaultCommercials: await dataLoader.loadDefaultCommercials(),
    blocks: [],
  };

  await +config.defaultPromo;

  mosaics = await dataLoader.loadMosaics();
  holidays = await dataLoader.loadHolidays();
}

export function getHolidays(): Holiday[] {
  return holidays;
}

export function getCurrentHolidays(): Holiday[] {
  return currentHolidays;
}

export function setCurrentHolidays(): void {
  currentHolidays = holidays.filter(holiday => {
    const today = new Date();
    if (holiday.seasonStartDate && holiday.seasonEndDate) {
      return (
        today >= new Date(holiday.seasonStartDate) &&
        today <= new Date(holiday.seasonEndDate)
      );
    } else {
      return today === new Date(holiday.holidayDate);
    }
  });
}

export function getMedia(): Media {
  return media;
}

export function getMosaics(): Mosaic[] {
  return mosaics;
}
