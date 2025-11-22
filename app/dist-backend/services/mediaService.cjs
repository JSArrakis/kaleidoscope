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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStreamType = setStreamType;
exports.getStreamType = getStreamType;
exports.setArgs = setArgs;
exports.getArgs = getArgs;
exports.loadMedia = loadMedia;
exports.getMedia = getMedia;
exports.getMosaics = getMosaics;
const media_1 = require("../models/media.cjs");
const dataLoader = __importStar(require("../db/dataLoader.cjs"));
const streamTypes_1 = require("../models/enum/streamTypes.cjs");
const holidayService_1 = require("./holidayService.cjs");
const promoService_1 = require("./promoService.cjs");
let media = new media_1.Media([], [], [], [], [], [], [], [], []);
let streamType = streamTypes_1.StreamType.Adhoc;
let args;
function setStreamType(value) {
    streamType = value;
}
function getStreamType() {
    return streamType;
}
function setArgs(value) {
    args = value;
}
function getArgs() {
    return args;
}
async function loadMedia(config) {
    // TODO - Uncomment when ready to create default media
    // await createDefaultCommercials(config);
    // await createDefaultPromo(config);
    console.log('Loading media entries from DB...');
    media = {
        shows: await dataLoader.loadShows(),
        movies: await dataLoader.loadMovies(),
        shorts: await dataLoader.loadShorts(),
        music: await dataLoader.loadMusic(),
        promos: [], // Promos are now handled by promoService
        defaultPromos: [], // Default promos are now handled by promoService
        commercials: await dataLoader.loadCommercials(),
        defaultCommercials: await dataLoader.loadDefaultCommercials(),
        blocks: [],
    };
    // Initialize the new centralized services
    await (0, holidayService_1.initializeHolidayService)();
    await (0, promoService_1.initializePromoService)();
}
function getMedia() {
    return media;
}
// TODO: Implement mosaic loading when mosaic system is ready
function getMosaics() {
    return []; // Return empty array for now
}
