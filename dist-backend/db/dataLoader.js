"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const holiday_1 = require("../models/holiday");
// Import repositories
const movieRepository_1 = require("../repositories/movieRepository");
const showRepository_1 = require("../repositories/showRepository");
const commercialRepository_1 = require("../repositories/commercialRepository");
const promoRepository_1 = require("../repositories/promoRepository");
const musicRepository_1 = require("../repositories/musicRepository");
const shortRepository_1 = require("../repositories/shortRepository");
const tagsRepository_1 = require("../repositories/tagsRepository");
function loadMovies() {
    return __awaiter(this, void 0, void 0, function* () {
        const movies = movieRepository_1.movieRepository.findAll();
        if (!movies || movies.length === 0) {
            console.log('No Movies Found');
            return [];
        }
        console.log(movies.length + ' Movies loaded');
        return movies;
    });
}
function loadShows() {
    return __awaiter(this, void 0, void 0, function* () {
        const shows = showRepository_1.showRepository.findAll();
        if (!shows || shows.length === 0) {
            console.log('No Shows Found');
            return [];
        }
        console.log(shows.length + ' Shows loaded');
        return shows;
    });
}
function loadPromos() {
    return __awaiter(this, void 0, void 0, function* () {
        const promos = promoRepository_1.promoRepository.findAll();
        if (!promos || promos.length === 0) {
            console.log('No Promos Found');
            return [];
        }
        console.log(promos.length + ' Promos loaded');
        return promos;
    });
}
function loadDefaultPromos() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return regular promos - you may want to implement a separate default_promos table
        const promos = promoRepository_1.promoRepository.findAll();
        if (!promos || promos.length === 0) {
            console.log('No Default Promos Found');
            return [];
        }
        console.log(promos.length + ' Default Promos loaded');
        return promos;
    });
}
function loadCommercials() {
    return __awaiter(this, void 0, void 0, function* () {
        const commercials = commercialRepository_1.commercialRepository.findAll();
        if (!commercials || commercials.length === 0) {
            console.log('No Commercials Found');
            return [];
        }
        console.log(commercials.length + ' Commercials loaded');
        return commercials;
    });
}
function loadDefaultCommercials() {
    return __awaiter(this, void 0, void 0, function* () {
        // For now, return regular commercials - you may want to implement a separate default_commercials table
        const commercials = commercialRepository_1.commercialRepository.findAll();
        if (!commercials || commercials.length === 0) {
            console.log('No Default Commercials Found');
            return [];
        }
        console.log(commercials.length + ' Default Commercials loaded');
        return commercials;
    });
}
function loadMusic() {
    return __awaiter(this, void 0, void 0, function* () {
        const music = musicRepository_1.musicRepository.findAll();
        if (!music || music.length === 0) {
            console.log('No Music Found');
            return [];
        }
        console.log(music.length + ' Music loaded');
        return music;
    });
}
function loadShorts() {
    return __awaiter(this, void 0, void 0, function* () {
        const shorts = shortRepository_1.shortRepository.findAll();
        if (!shorts || shorts.length === 0) {
            console.log('No Shorts Found');
            return [];
        }
        console.log(shorts.length + ' Shorts loaded');
        return shorts;
    });
}
function loadHolidays() {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
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
