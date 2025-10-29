import { Block } from './block';
import { Commercial } from './commercial';
import { Movie } from './movie';
import { Music } from './music';
import { Promo } from './promo';
import { Short } from './short';
import { Episode } from './show';

export class MediaBlock {
  buffer: (Promo | Music | Commercial | Short)[];
  featureMedia?: Episode | Movie;
  startTime?: number;

  constructor(
    buffer: (Promo | Music | Commercial | Short)[],
    featureMedia?: Episode | Movie,
    startTime?: number,
  ) {
    this.buffer = buffer;
    this.featureMedia = featureMedia;
    this.startTime = startTime;
  }
}
