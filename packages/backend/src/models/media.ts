import { Show } from './show';
import { Movie } from './movie';
import { Short } from './short';
import { Music } from './music';
import { Promo } from './promo';
import { Commercial } from './commercial';
import { Block } from './block';

export class Media {
  shows: Show[];
  movies: Movie[];
  shorts: Short[];
  music: Music[];
  promos: Promo[];
  defaultPromos: Promo[];
  commercials: Commercial[];
  defaultCommercials: Commercial[];
  blocks: Block[];

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
    this.shows = shows;
    this.movies = movies;
    this.shorts = shorts;
    this.music = music;
    this.promos = promos;
    this.defaultPromos = defaultPromos;
    this.commercials = commercials;
    this.defaultCommercials = defaultCommercials;
    this.blocks = blocks;
  }
}
