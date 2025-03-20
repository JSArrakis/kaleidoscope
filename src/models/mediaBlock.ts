import { Block } from './block';
import { Commercial } from './commercial';
import { Movie } from './movie';
import { Music } from './music';
import { Promo } from './promo';
import { Short } from './short';
import { Episode } from './show';

export class MediaBlock {
  buffer: (Promo | Music | Commercial | Short)[];
  mainBlock?: Episode | Movie | Block;
  initialBuffer: (Promo | Music | Commercial | Short)[];
  startTime?: number;

  constructor(
    buffer: (Promo | Music | Commercial | Short)[],
    initialBuffer: (Promo | Music | Commercial | Short)[],
    mainBlock?: Episode | Movie | Block,
    startTime?: number,
  ) {
    this.buffer = buffer;
    this.mainBlock = mainBlock;
    this.initialBuffer = initialBuffer;
    this.startTime = startTime;
  }
}
