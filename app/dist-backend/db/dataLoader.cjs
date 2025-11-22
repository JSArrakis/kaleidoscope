"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMovies = loadMovies;
exports.loadShows = loadShows;
exports.loadPromos = loadPromos;
exports.loadDefaultPromos = loadDefaultPromos;
exports.loadCommercials = loadCommercials;
exports.loadDefaultCommercials = loadDefaultCommercials;
exports.loadMusic = loadMusic;
exports.loadShorts = loadShorts;
exports.loadHolidays = loadHolidays;
const holiday_1 = require("../models/holiday.cjs");
// Import repositories
const movieRepository_1 = require("../repositories/movieRepository.cjs");
const showRepository_1 = require("../repositories/showRepository.cjs");
const commercialRepository_1 = require("../repositories/commercialRepository.cjs");
const promoRepository_1 = require("../repositories/promoRepository.cjs");
const musicRepository_1 = require("../repositories/musicRepository.cjs");
const shortRepository_1 = require("../repositories/shortRepository.cjs");
const tagsRepository_1 = require("../repositories/tagsRepository.cjs");
async function loadMovies() {
    const movies = movieRepository_1.movieRepository.findAll();
    if (!movies || movies.length === 0) {
        console.log('No Movies Found');
        return [];
    }
    console.log(movies.length + ' Movies loaded');
    return movies;
}
async function loadShows() {
    const shows = showRepository_1.showRepository.findAll();
    if (!shows || shows.length === 0) {
        console.log('No Shows Found');
        return [];
    }
    console.log(shows.length + ' Shows loaded');
    return shows;
}
async function loadPromos() {
    const promos = promoRepository_1.promoRepository.findAll();
    if (!promos || promos.length === 0) {
        console.log('No Promos Found');
        return [];
    }
    console.log(promos.length + ' Promos loaded');
    return promos;
}
async function loadDefaultPromos() {
    // For now, return regular promos - you may want to implement a separate default_promos table
    const promos = promoRepository_1.promoRepository.findAll();
    if (!promos || promos.length === 0) {
        console.log('No Default Promos Found');
        return [];
    }
    console.log(promos.length + ' Default Promos loaded');
    return promos;
}
async function loadCommercials() {
    const commercials = commercialRepository_1.commercialRepository.findAll();
    if (!commercials || commercials.length === 0) {
        console.log('No Commercials Found');
        return [];
    }
    console.log(commercials.length + ' Commercials loaded');
    return commercials;
}
async function loadDefaultCommercials() {
    // For now, return regular commercials - you may want to implement a separate default_commercials table
    const commercials = commercialRepository_1.commercialRepository.findAll();
    if (!commercials || commercials.length === 0) {
        console.log('No Default Commercials Found');
        return [];
    }
    console.log(commercials.length + ' Default Commercials loaded');
    return commercials;
}
async function loadMusic() {
    const music = musicRepository_1.musicRepository.findAll();
    if (!music || music.length === 0) {
        console.log('No Music Found');
        return [];
    }
    console.log(music.length + ' Music loaded');
    return music;
}
async function loadShorts() {
    const shorts = shortRepository_1.shortRepository.findAll();
    if (!shorts || shorts.length === 0) {
        console.log('No Shorts Found');
        return [];
    }
    console.log(shorts.length + ' Shorts loaded');
    return shorts;
}
async function loadHolidays() {
    // Load holidays as tags with type "Holiday" from tagsRepository
    const holidayTags = tagsRepository_1.tagRepository.findByType('Holiday');
    if (!holidayTags || holidayTags.length === 0) {
        console.log('No Holidays Found');
        return [];
    }
    // Convert Tag objects to Holiday objects
    const holidays = holidayTags.map(tag => new holiday_1.Holiday(tag.name, tag.tagId, tag.holidayDates || [], tag.exclusionTags || [], tag.seasonStartDate, tag.seasonEndDate));
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
