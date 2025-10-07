import { Show } from '../models/show';
import { Movie } from '../models/movie';
import { Promo } from '../models/promo';
import { Commercial } from '../models/commercial';
import { Music } from '../models/music';
import { Short } from '../models/short';
import { Holiday } from '../models/holiday';
import { Mosaic } from '../models/mosaic';

// Import repositories
import { movieRepository } from '../repositories/movieRepository';
import { showRepository } from '../repositories/showRepository';
import { commercialRepository } from '../repositories/commercialRepository';
import { promoRepository } from '../repositories/promoRepository';
import { musicRepository } from '../repositories/musicRepository';
import { shortRepository } from '../repositories/shortRepository';
import { tagRepository } from '../repositories/tagsRepository';

export async function loadMovies(): Promise<Movie[]> {
  const movies = movieRepository.findAll();
  if (!movies || movies.length === 0) {
    console.log('No Movies Found');
    return [];
  }
  console.log(movies.length + ' Movies loaded');
  return movies;
}

export async function loadShows(): Promise<Show[]> {
  const shows = showRepository.findAll();
  if (!shows || shows.length === 0) {
    console.log('No Shows Found');
    return [];
  }
  console.log(shows.length + ' Shows loaded');
  return shows;
}

export async function loadPromos(): Promise<Promo[]> {
  const promos = promoRepository.findAll() as Promo[];
  if (!promos || promos.length === 0) {
    console.log('No Promos Found');
    return [];
  }
  console.log(promos.length + ' Promos loaded');
  return promos;
}

export async function loadDefaultPromos(): Promise<Promo[]> {
  // For now, return regular promos - you may want to implement a separate default_promos table
  const promos = promoRepository.findAll() as Promo[];
  if (!promos || promos.length === 0) {
    console.log('No Default Promos Found');
    return [];
  }
  console.log(promos.length + ' Default Promos loaded');
  return promos;
}

export async function loadCommercials(): Promise<Commercial[]> {
  const commercials = commercialRepository.findAll();
  if (!commercials || commercials.length === 0) {
    console.log('No Commercials Found');
    return [];
  }
  console.log(commercials.length + ' Commercials loaded');
  return commercials;
}

export async function loadDefaultCommercials(): Promise<Commercial[]> {
  // For now, return regular commercials - you may want to implement a separate default_commercials table
  const commercials = commercialRepository.findAll();
  if (!commercials || commercials.length === 0) {
    console.log('No Default Commercials Found');
    return [];
  }
  console.log(commercials.length + ' Default Commercials loaded');
  return commercials;
}

export async function loadMusic(): Promise<Music[]> {
  const music = musicRepository.findAll() as Music[];
  if (!music || music.length === 0) {
    console.log('No Music Found');
    return [];
  }
  console.log(music.length + ' Music loaded');
  return music;
}

export async function loadShorts(): Promise<Short[]> {
  const shorts = shortRepository.findAll() as Short[];
  if (!shorts || shorts.length === 0) {
    console.log('No Shorts Found');
    return [];
  }
  console.log(shorts.length + ' Shorts loaded');
  return shorts;
}

export async function loadHolidays(): Promise<Holiday[]> {
  // Load holidays as tags with type "Holiday" from tagsRepository
  const holidayTags = tagRepository.findByType('Holiday');

  if (!holidayTags || holidayTags.length === 0) {
    console.log('No Holidays Found');
    return [];
  }

  // Convert Tag objects to Holiday objects
  const holidays: Holiday[] = holidayTags.map(
    tag =>
      new Holiday(
        tag.name,
        tag.tagId,
        tag.holidayDates || [],
        tag.exclusionGenres || [],
        tag.seasonStartDate,
        tag.seasonEndDate,
      ),
  );

  console.log(holidays.length + ' Holidays loaded');
  return holidays;
}

// export async function loadMosaics(): Promise<Mosaic[]> {
//   const mosaics = mosaicRepository.findAll() as Mosaic[];
//   if (!mosaics || mosaics.length === 0) {
//     console.log('No Mosaics Found');
//     return [];
//   }
//   console.log(mosaics.length + ' Mosaics loaded');
//   return mosaics;
// }
