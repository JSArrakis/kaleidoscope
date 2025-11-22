"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformShowFromRequest = transformShowFromRequest;
exports.transformMovieFromRequest = transformMovieFromRequest;
exports.updateMovieFromRequest = updateMovieFromRequest;
exports.transformCommercialFromRequest = transformCommercialFromRequest;
exports.transformMusicFromRequest = transformMusicFromRequest;
exports.transformPromoFromRequest = transformPromoFromRequest;
exports.transformShortFromRequest = transformShortFromRequest;
exports.segmentTags = segmentTags;
const show_1 = require("../models/show.cjs");
const movie_1 = require("../models/movie.cjs");
const commercial_1 = require("../models/commercial.cjs");
const music_1 = require("../models/music.cjs");
const promo_1 = require("../models/promo.cjs");
const short_1 = require("../models/short.cjs");
const segmentedTags_1 = require("../models/segmentedTags.cjs");
// import { Eras } from '../models/const/eras';
// import { MainGenres } from '../models/const/mainGenres';
// import { AgeGroups } from '../models/const/ageGroups';
const utilities_1 = require("../utils/utilities.cjs");
async function transformShowFromRequest(show, loadTitle) {
    let parsedShow = show_1.Show.fromRequestObject(show);
    parsedShow.mediaItemId = loadTitle;
    parsedShow.alias = parsedShow.mediaItemId;
    for (const episode of parsedShow.episodes) {
        if (episode.duration > 0)
            continue; // Skip if duration is already set
        console.log(`Getting duration for ${episode.path}`);
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(episode.path);
        episode.duration = durationInSeconds; // Update duration value
        episode.durationLimit =
            Math.floor(episode.duration / 1800) * 1800 +
                (episode.duration % 1800 > 0 ? 1800 : 0);
        // set episode load title using show load title and episode number
    }
    //create an accounting of how many different duration limits there are and create a map of it
    let durationLimitsMap = new Map();
    parsedShow.episodes.forEach(episode => {
        if (durationLimitsMap.has(episode.durationLimit)) {
            durationLimitsMap.set(episode.durationLimit, durationLimitsMap.get(episode.durationLimit) + 1);
        }
        else {
            durationLimitsMap.set(episode.durationLimit, 1);
        }
    });
    //use the map to determine which duration limit is the most common and use that as the show duration limit
    let maxCount = 0;
    let maxDurationLimit = 0;
    durationLimitsMap.forEach((value, key) => {
        if (value > maxCount) {
            maxCount = value;
            maxDurationLimit = key;
        }
    });
    parsedShow.durationLimit = maxDurationLimit;
    //assume the episodes of the show are in order and set the episode number to the index of the episode in the array + 1
    parsedShow.episodes.forEach((episode, index) => {
        episode.episodeNumber = index + 1;
        episode.mediaItemId = `${parsedShow.mediaItemId}-${episode.episodeNumber}`;
        // Set overDuration flag if episode duration exceeds show's duration limit
        episode.overDuration = episode.duration > parsedShow.durationLimit;
    });
    //set the episode count to the length of the episodes array
    parsedShow.episodeCount = parsedShow.episodes.length;
    return parsedShow;
}
async function transformMovieFromRequest(movie, loadTitle) {
    let parsedMovie = movie_1.Movie.fromRequestObject(movie);
    parsedMovie.mediaItemId = loadTitle;
    parsedMovie.alias = parsedMovie.mediaItemId;
    if (parsedMovie.duration > 0) {
        return parsedMovie;
    }
    console.log(`Getting duration for ${parsedMovie.path}`);
    let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedMovie.path);
    parsedMovie.duration = durationInSeconds; // Update duration value
    parsedMovie.durationLimit =
        Math.floor(parsedMovie.duration / 1800) * 1800 +
            (parsedMovie.duration % 1800 > 0 ? 1800 : 0);
    return parsedMovie;
}
async function updateMovieFromRequest(update, movie) {
    let parsedMovie = movie_1.Movie.fromRequestObject(update);
    movie.Tags = parsedMovie.tags;
    return movie;
}
async function transformCommercialFromRequest(buffer) {
    let parsedCommercial = await commercial_1.Commercial.fromRequestObject(buffer);
    if (parsedCommercial.duration > 0) {
        return parsedCommercial;
    }
    console.log(`Getting duration for ${parsedCommercial.path}`);
    let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedCommercial.path);
    parsedCommercial.duration = durationInSeconds; // Update duration value
    return parsedCommercial;
}
async function transformMusicFromRequest(buffer) {
    let parsedMusic = await music_1.Music.fromRequestObject(buffer);
    if (parsedMusic.duration > 0) {
        return parsedMusic;
    }
    console.log(`Getting duration for ${parsedMusic.path}`);
    let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedMusic.path);
    parsedMusic.duration = durationInSeconds; // Update duration value
    return parsedMusic;
}
async function transformPromoFromRequest(buffer) {
    let parsedPromo = await promo_1.Promo.fromRequestObject(buffer);
    if (parsedPromo.duration > 0) {
        return parsedPromo;
    }
    console.log(`Getting duration for ${parsedPromo.path}`);
    let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedPromo.path);
    parsedPromo.duration = durationInSeconds; // Update duration value
    return parsedPromo;
}
async function transformShortFromRequest(buffer) {
    let parsedShort = await short_1.Short.fromRequestObject(buffer);
    if (parsedShort.duration > 0) {
        return parsedShort;
    }
    console.log(`Getting duration for ${parsedShort.path}`);
    let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedShort.path);
    parsedShort.duration = durationInSeconds; // Update duration value
    return parsedShort;
}
function segmentTags(tags) {
    let segmentedTags = new segmentedTags_1.SegmentedTags([], [], [], [], [], []);
    tags.forEach(tag => {
        segmentedTags.specialtyTags.push(tag);
    });
    // Deduplicate by tag name
    const uniqByName = (arr) => Object.values(arr.reduce((acc, t) => {
        acc[t.name] = t;
        return acc;
    }, {}));
    segmentedTags.eraTags = uniqByName(segmentedTags.eraTags);
    segmentedTags.genreTags = uniqByName(segmentedTags.genreTags);
    segmentedTags.specialtyTags = uniqByName(segmentedTags.specialtyTags);
    segmentedTags.ageGroupTags = uniqByName(segmentedTags.ageGroupTags);
    segmentedTags.holidayTags = uniqByName(segmentedTags.holidayTags);
    return segmentedTags;
}
