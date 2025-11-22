import { Media } from '../models/media';
import { Config } from '../models/config';
import * as dataLoader from '../db/dataLoader';
import { StreamType } from '../models/enum/streamTypes';
import { IStreamRequest } from '../models/streamRequest';
import { initializeHolidayService } from './holidayService';
import { initializePromoService } from './promoService';

let media: Media = new Media([], [], [], [], [], [], [], [], []);
let streamType: StreamType = StreamType.Adhoc;
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
    promos: [], // Promos are now handled by promoService
    defaultPromos: [], // Default promos are now handled by promoService
    commercials: await dataLoader.loadCommercials(),
    defaultCommercials: await dataLoader.loadDefaultCommercials(),
    blocks: [],
  };

  // Initialize the new centralized services
  await initializeHolidayService();
  await initializePromoService();
}

export function getMedia(): Media {
  return media;
}

// TODO: Implement mosaic loading when mosaic system is ready
export function getMosaics(): any[] {
  return []; // Return empty array for now
}
