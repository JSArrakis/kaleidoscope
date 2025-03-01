import { Show } from './show';
import { Movie } from './movie';
import { Short } from './short';
import { Music } from './music';
import { Promo } from './promo';
import { Commercial } from './commercial';
import { Block } from './block';

export class Media {
  Shows: Show[];
  Movies: Movie[];
  Shorts: Short[];
  Music: Music[];
  Promos: Promo[];
  DefaultPromos: Promo[];
  Commercials: Commercial[];
  DefaultCommercials: Commercial[];
  Blocks: Block[];

  constructor(
    shows: Show[],
    movies: Movie[],
    shorts: Short[],
    music: Music[],
    promos: Promo[],
    defaultPromos: Promo[],
    commercials: Commercial[],
    defaultCommercials: Commercial[],
    blocks: Block[],
  ) {
    this.Shows = shows;
    this.Movies = movies;
    this.Shorts = shorts;
    this.Music = music;
    this.Promos = promos;
    this.DefaultPromos = defaultPromos;
    this.Commercials = commercials;
    this.DefaultCommercials = defaultCommercials;
    this.Blocks = blocks;
  }
}
