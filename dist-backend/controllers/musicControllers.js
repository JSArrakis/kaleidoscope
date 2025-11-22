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
exports.createMusicHandler = createMusicHandler;
exports.deleteMusicHandler = deleteMusicHandler;
exports.updateMusicHandler = updateMusicHandler;
exports.getMusicHandler = getMusicHandler;
exports.getAllMusicHandler = getAllMusicHandler;
exports.transformMusicFromRequest = transformMusicFromRequest;
const express_validator_1 = require("express-validator");
const music_1 = require("../models/music");
const utilities_1 = require("../utils/utilities");
const musicRepository_1 = require("../repositories/musicRepository");
function createMusicHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'mediaItemId is required' });
            return;
        }
        // Retrieve music from MongoDB using music load title if it exists
        const music = musicRepository_1.musicRepository.findByMediaItemId(mediaItemId);
        // If it exists, return error
        if (music) {
            res
                .status(400)
                .json({ message: `Music Video with ID ${mediaItemId} already exists` });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let transformedMusic = yield transformMusicFromRequest(req.body, mediaItemId);
            // Insert music into database
            musicRepository_1.musicRepository.create(transformedMusic);
            res
                .status(200)
                .json({ message: `Music Video ${transformedMusic.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function deleteMusicHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.query.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'mediaItemId is required' });
            return;
        }
        // Retrieve music from MongoDB using music load title if it exists
        const music = musicRepository_1.musicRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!music) {
            res
                .status(400)
                .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, delete it
        musicRepository_1.musicRepository.delete(mediaItemId);
        res.status(200).json({ message: 'Music Deleted' });
        return;
    });
}
function updateMusicHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'mediaItemId is required' });
            return;
        }
        // Retrieve music from MongoDB using music load title if it exists
        const music = musicRepository_1.musicRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!music) {
            res
                .status(400)
                .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedMusic = yield transformMusicFromRequest(req.body, music.mediaItemId);
            // Update music in database
            musicRepository_1.musicRepository.update(mediaItemId, updatedMusic);
            res
                .status(200)
                .json({ message: `Music Video ${updatedMusic.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getMusicHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.query.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'mediaItemId is required' });
            return;
        }
        // Retrieve music from MongoDB using music load title if it exists using request params
        const music = musicRepository_1.musicRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!music) {
            res
                .status(404)
                .json({ message: `Music Video with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(music);
        return;
    });
}
function getAllMusicHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const music = musicRepository_1.musicRepository.findAll();
        res.status(200).json(music);
        return;
    });
}
function transformMusicFromRequest(music, mediaItemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedMusic = yield music_1.Music.fromRequestObject(music);
        parsedMusic.mediaItemId = mediaItemId;
        if (parsedMusic.duration > 0) {
            return parsedMusic;
        }
        try {
            console.log(`Getting duration for ${parsedMusic.path}`);
            let durationInSeconds = yield (0, utilities_1.getMediaDuration)(parsedMusic.path);
            parsedMusic.duration = durationInSeconds; // Update duration value
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot process music "${parsedMusic.title}": ${errorMessage}`);
        }
        return parsedMusic;
    });
}
