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
exports.createShortHandler = createShortHandler;
exports.deleteShortHandler = deleteShortHandler;
exports.updateShortHandler = updateShortHandler;
exports.getShortHandler = getShortHandler;
exports.getAllShortsHandler = getAllShortsHandler;
exports.transformShortFromRequest = transformShortFromRequest;
const express_validator_1 = require("express-validator");
const short_1 = require("../models/short");
const utilities_1 = require("../utils/utilities");
const shortRepository_1 = require("../repositories/shortRepository");
function createShortHandler(req, res) {
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
        // Retrieve short from MongoDB using short load title if it exists
        const short = shortRepository_1.shortRepository.findByMediaItemId(mediaItemId);
        // If it exists, return error
        if (short) {
            res.status(400).json({
                message: `Short with mediaItemId ${mediaItemId} already exists`,
            });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let transformedShort = yield transformShortFromRequest(req.body, mediaItemId);
            // Insert short into database
            shortRepository_1.shortRepository.create(transformedShort);
            res
                .status(200)
                .json({ message: `Short ${transformedShort.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function deleteShortHandler(req, res) {
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
        // Retrieve short from MongoDB using short load title if it exists
        const short = shortRepository_1.shortRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!short) {
            res.status(400).json({
                message: `Short with mediaItemId ${mediaItemId} does not exist`,
            });
            return;
        }
        // If it exists, delete it
        shortRepository_1.shortRepository.delete(mediaItemId);
        res.status(200).json({ message: `Short ${short.title} Deleted` });
        return;
    });
}
function updateShortHandler(req, res) {
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
        // Retrieve short from MongoDB using short load title if it exists
        const short = shortRepository_1.shortRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!short) {
            res.status(400).json({ message: 'Short does not exist' });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedShort = yield transformShortFromRequest(req.body, short.mediaItemId);
            // Update short in database
            yield shortRepository_1.shortRepository.update(mediaItemId, updatedShort);
            res.status(200).json({ message: `Short ${updatedShort.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getShortHandler(req, res) {
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
        // Retrieve short from MongoDB using short load title if it exists using request params
        const short = shortRepository_1.shortRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!short) {
            res
                .status(404)
                .json({ message: `Short with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(short);
        return;
    });
}
function getAllShortsHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const shorts = shortRepository_1.shortRepository.findAll();
        res.status(200).json(shorts);
        return;
    });
}
function transformShortFromRequest(short, mediaItemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedShort = yield short_1.Short.fromRequestObject(short);
        parsedShort.mediaItemId = mediaItemId;
        if (parsedShort.duration > 0) {
            return parsedShort;
        }
        try {
            console.log(`Getting duration for ${parsedShort.path}`);
            let durationInSeconds = yield (0, utilities_1.getMediaDuration)(parsedShort.path);
            parsedShort.duration = durationInSeconds; // Update duration value
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot process short "${parsedShort.title}": ${errorMessage}`);
        }
        return parsedShort;
    });
}
