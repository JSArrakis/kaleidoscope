"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStream = initializeStream;
exports.initializeOnDeckStream = initializeOnDeckStream;
exports.addItemToOnDeck = addItemToOnDeck;
exports.removeFirstItemFromOnDeck = removeFirstItemFromOnDeck;
exports.addToUpcomingStream = addToUpcomingStream;
exports.getUpcomingStream = getUpcomingStream;
exports.getOnDeckStream = getOnDeckStream;
exports.getOnDeckStreamLength = getOnDeckStreamLength;
exports.isContinuousStream = isContinuousStream;
exports.setContinuousStream = setContinuousStream;
exports.getContinuousStreamArgs = getContinuousStreamArgs;
exports.setContinuousStreamArgs = setContinuousStreamArgs;
exports.addInitialMediaBlocks = addInitialMediaBlocks;
exports.removeFirstItemFromUpcoming = removeFirstItemFromUpcoming;
exports.setStreamVariationInSeconds = setStreamVariationInSeconds;
exports.getStreamVariationInSeconds = getStreamVariationInSeconds;
exports.getStreamStatus = getStreamStatus;
exports.stopContinuousStream = stopContinuousStream;
const mediaBlock_1 = require("../models/mediaBlock.cjs");
const streamConstructor_1 = require("./streamConstructor.cjs");
const streamTypes_1 = require("../models/enum/streamTypes.cjs");
const moment_1 = __importDefault(require("moment"));
const bufferEngine_1 = require("./bufferEngine.cjs");
const holidayService_1 = require("./holidayService.cjs");
const tagsRepository_1 = require("../repositories/tagsRepository.cjs");
const movieRepository_1 = require("../repositories/movieRepository.cjs");
const showRepository_1 = require("../repositories/showRepository.cjs");
const progressionManager_1 = require("./progressionManager.cjs");
const vlcService = __importStar(require("./vlcService.cjs"));
const common_1 = require("../utils/common.cjs");
let upcoming = [];
let onDeck = [];
let continuousStream = false;
let args;
let streamVarianceInSeconds = 0;
let startOfDay;
// Helper function to convert tag names to Tag objects
function getTagByName(tagName) {
    return tagsRepository_1.tagRepository.findByName(tagName);
}
function getTagsByNames(tagNames) {
    return tagNames
        .map(name => getTagByName(name))
        .filter((tag) => tag !== null);
}
// Helper function to pick a random show or movie from the database
// Flips a coin to decide between show and movie, then returns a random one
// Accounts for cases where one type may not have any entries in the database
// Respects show progression to return the appropriate episode for the stream type
function getRandomShowOrMovie(streamType) {
    // Check how many shows and movies exist
    const showCount = showRepository_1.showRepository.count();
    const movieCount = movieRepository_1.movieRepository.count();
    // If neither exists, return null
    if (showCount === 0 && movieCount === 0) {
        return null;
    }
    // If only one type exists, use that
    if (showCount === 0) {
        return movieRepository_1.movieRepository.findRandomMovie();
    }
    if (movieCount === 0) {
        const randomShow = showRepository_1.showRepository.findRandomShow();
        if (randomShow) {
            // Use progressionManager to get the next episode based on show progression
            return (0, progressionManager_1.GetNextEpisode)(randomShow, streamType);
        }
        return null;
    }
    // Both types exist, flip a coin
    const coinFlip = Math.random() < 0.5; // true = show, false = movie
    if (coinFlip) {
        const randomShow = showRepository_1.showRepository.findRandomShow();
        if (randomShow) {
            // Use progressionManager to get the next episode based on show progression
            return (0, progressionManager_1.GetNextEpisode)(randomShow, streamType);
        }
        // Fall back to a random movie if something unexpected happens
        return movieRepository_1.movieRepository.findRandomMovie();
    }
    else {
        return movieRepository_1.movieRepository.findRandomMovie();
    }
}
async function initializeStream(config, streamArgs, streamType, cadence = false) {
    // Constructs the stream based on the config, continuous stream args, and available media
    // The stream is assigned to upcoming stream which the background service will use to populate the on deck stream
    // The stream is constructed to fill the time until 12:00am
    // The background service will run construct stream again 30 minutes before the end of the day to fill the time until 12:00am the next day
    // Step 1: Find the first time point where a media block happens (:00 or :30)
    const now = (0, moment_1.default)().unix();
    let endTime;
    // const nextProgrammingBlock = getNextProgrammingBlock();
    if (streamType === streamTypes_1.StreamType.Cont) {
        endTime = (0, moment_1.default)().endOf('day').unix();
    }
    else {
        endTime = streamArgs.EndTime || (0, moment_1.default)().endOf('day').unix();
    }
    const alignedTime = (0, common_1.findNextCadenceTime)(now);
    // Step 2: Pick a random show or movie from the database
    const firstMedia = getRandomShowOrMovie(streamType);
    if (!firstMedia) {
        return 'No movies or shows found in the database';
    }
    let initialMediaBlock;
    // Step 4: Create an initial buffer if there is time between now and the first time point
    if (cadence && alignedTime > now) {
        const bufferDuration = alignedTime - now;
        // Create buffer using tags from the selected media
        const halfATags = [];
        const halfBTags = firstMedia.tags || [];
        const activeHolidayTags = (0, holidayService_1.getActiveHolidaysFromDB)();
        const bufferResult = (0, bufferEngine_1.createBuffer)(bufferDuration, halfATags, halfBTags, activeHolidayTags);
        // Step 5: Push that first initial buffer as a media block without a main show or movie
        const initialBufferBlock = new mediaBlock_1.MediaBlock(bufferResult.buffer, // buffer
        undefined, // mainBlock (no main media for buffer-only block)
        now);
        initialMediaBlock = initialBufferBlock;
    }
    else if (!cadence) {
        initialMediaBlock = new mediaBlock_1.MediaBlock([], // buffer
        firstMedia, // episode or movie
        now);
    }
    if (initialMediaBlock !== undefined) {
        onDeck.push(initialMediaBlock);
    }
    else {
        return 'Failed to create initial media block for stream initialization';
    }
    // Add media to VLC playlist and start playback immediately so there is less delay
    // between "now" and when media starts playing.
    // This is to reduce to timing drift, so we dont have correct alignment later.
    // TODO Create Module for this and put it in a switch for upcoming integrations with
    // Plex and Jellyfin
    await vlcService.initializeVLCService(getContinuousStreamArgs().Password);
    await addInitialMediaBlocks();
    await vlcService.playVLC();
    const constructedStream = (0, streamConstructor_1.constructStream)(streamTypes_1.StreamType.Cont, alignedTime > now ? alignedTime : now, // Start construction at aligned time or now
    cadence, firstMedia);
    if (constructedStream[1] !== '') {
        return constructedStream[1];
    }
    upcoming.push(...constructedStream[0]);
    return '';
}
function initializeOnDeckStream() {
    for (let i = 0; i < 2; i++) {
        if (upcoming.length > 0) {
            let selectedObject = upcoming.shift();
            if (selectedObject != null || selectedObject != undefined) {
                onDeck.push(selectedObject);
            }
        }
    }
}
function addItemToOnDeck(mediaBlocks) {
    onDeck.push(...mediaBlocks);
}
function removeFirstItemFromOnDeck() {
    return onDeck.shift();
}
function removeFirstItemFromUpcoming() {
    return upcoming.shift();
}
function addToUpcomingStream(mediaBlocks) {
    upcoming.push(...mediaBlocks);
}
function getUpcomingStream() {
    return upcoming;
}
function getOnDeckStream() {
    return onDeck;
}
function getOnDeckStreamLength() {
    return onDeck.length;
}
function isContinuousStream() {
    return continuousStream;
}
function setContinuousStream(value) {
    continuousStream = value;
}
function getContinuousStreamArgs() {
    return args;
}
function setContinuousStreamArgs(value) {
    args = value;
}
function getStreamVariationInSeconds() {
    return streamVarianceInSeconds;
}
function setStreamVariationInSeconds(value) {
    streamVarianceInSeconds = value;
}
function getStreamStatus() {
    return {
        isContinuous: continuousStream,
        hasUpcomingStream: upcoming.length > 0,
        onDeckLength: onDeck.length,
        upcomingLength: upcoming.length,
        streamArgs: args
            ? {
                title: args.Title,
                env: args.Env,
                hasPassword: !!args.Password,
            }
            : null,
    };
}
function stopContinuousStream() {
    continuousStream = false;
    upcoming = [];
    onDeck = [];
    // Note: VLC client cleanup should be handled separately
}
async function addInitialMediaBlocks() {
    for (const item of onDeck) {
        await vlcService.addMediaBlockToPlaylist(item);
    }
}
