import { ShowModel, Show } from '../models/show';
import { MovieModel, Movie } from '../models/movie';
import { PromoModel, Promo } from '../models/promo';
import { CommercialModel, Commercial } from '../models/commercial';
import { MusicModel, Music } from '../models/music';
import { ShortModel, Short } from '../models/short';
import { HolidayModel, Holiday } from '../models/holiday';
import { DefaultCommercialModel } from '../models/defaultCommercial';
import { DefaultPromoModel } from '../models/defaultPromo';
import { MosaicModel, Mosaic } from '../models/mosaic';

export async function loadMovies(): Promise<Movie[]> {
  const movies = (await MovieModel.find()) as Movie[];
  if (!movies || movies.length === 0) {
    console.log('No Movies Found');
    return [];
  }
  console.log(movies.length + ' Movies loaded');
  return movies;
}

export async function loadShows(): Promise<Show[]> {
  const shows = (await ShowModel.find()) as Show[];
  if (!shows || shows.length === 0) {
    console.log('No Shows Found');
    return [];
  }
  console.log(shows.length + ' Shows loaded');
  return shows;
}

export async function loadPromos(): Promise<Promo[]> {
  const promos = (await PromoModel.find()) as Promo[];
  if (!promos || promos.length === 0) {
    console.log('No Promos Found');
    return [];
  }
  console.log(promos.length + ' Promos loaded');
  return promos;
}

export async function loadDefaultPromos(): Promise<Promo[]> {
  const promos = (await DefaultPromoModel.find()) as Promo[];
  if (!promos || promos.length === 0) {
    console.log('No Default Promos Found');
    return [];
  }
  console.log(promos.length + ' Default Promos loaded');
  return promos;
}

export async function loadCommercials(): Promise<Commercial[]> {
  const commercials = (await CommercialModel.find()) as Commercial[];
  if (!commercials || commercials.length === 0) {
    console.log('No Commercials Found');
    return [];
  }
  console.log(commercials.length + ' Commercials loaded');
  return commercials;
}

export async function loadDefaultCommercials(): Promise<Commercial[]> {
  const commercials = (await DefaultCommercialModel.find()) as Commercial[];
  if (!commercials || commercials.length === 0) {
    console.log('No Default Commercials Found');
    return [];
  }
  console.log(commercials.length + ' Default Commercials loaded');
  return commercials;
}

export async function loadMusic(): Promise<Music[]> {
  const music = (await MusicModel.find()) as Music[];
  if (!music || music.length === 0) {
    console.log('No Music Found');
    return [];
  }
  console.log(music.length + ' Music loaded');
  return music;
}

export async function loadShorts(): Promise<Short[]> {
  const shorts = (await ShortModel.find()) as Short[];
  if (!shorts || shorts.length === 0) {
    console.log('No Shorts Found');
    return [];
  }
  console.log(shorts.length + ' Shorts loaded');
  return shorts;
}

export async function loadHolidays(): Promise<Holiday[]> {
  const holidays = await HolidayModel.find();
  if (!holidays || holidays.length === 0) {
    console.log('No Holidays Found');
    return [];
  }
  console.log(holidays.length + ' Holidays loaded');
  return holidays;
}

export async function loadMosaics(): Promise<Mosaic[]> {
  const mosaics = await MosaicModel.find();
  if (!mosaics || mosaics.length === 0) {
    console.log('No Mosaics Found');
    return [];
  }
  console.log(mosaics.length + ' Mosaics loaded');
  return mosaics;
}
