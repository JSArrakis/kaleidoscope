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
exports.createBumperHandler = createBumperHandler;
exports.deleteBumperHandler = deleteBumperHandler;
exports.updateBumperHandler = updateBumperHandler;
exports.getBumperHandler = getBumperHandler;
exports.getAllBumpersHandler = getAllBumpersHandler;
exports.transformBumperFromRequest = transformBumperFromRequest;
const express_validator_1 = require("express-validator");
const bumper_1 = require("../models/bumper");
const utilities_1 = require("../utils/utilities");
const bumperRepository_1 = require("../repositories/bumperRepository");
function createBumperHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'Media Item ID is required' });
            return;
        }
        const bumper = bumperRepository_1.bumperRepository.findByMediaItemId(mediaItemId);
        // If it exists, return error
        if (bumper) {
            res
                .status(400)
                .json({ message: `Bumper with Id ${mediaItemId} already exists` });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let transformedBumper = yield transformBumperFromRequest(req.body, mediaItemId);
            // Insert bumper into database
            yield bumperRepository_1.bumperRepository.create(transformedBumper);
            res
                .status(200)
                .json({ message: `Bumper ${transformedBumper.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function deleteBumperHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.query.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'Media Item ID is required' });
            return;
        }
        // Retrieve bumper from MongoDB using bumper load title if it exists
        const bumper = bumperRepository_1.bumperRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!bumper) {
            res.status(400).json({ message: 'Bumper does not exist' });
            return;
        }
        // If it exists, delete it
        bumperRepository_1.bumperRepository.delete(mediaItemId);
        res.status(200).json({ message: 'Bumper Deleted' });
        return;
    });
}
function updateBumperHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'Media Item ID is required' });
            return;
        }
        // Retrieve bumper from MongoDB using bumper load title if it exists
        const bumper = bumperRepository_1.bumperRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!bumper) {
            res
                .status(400)
                .json({ message: `Bumper with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedBumper = yield transformBumperFromRequest(req.body, bumper.mediaItemId);
            // Update bumper in database
            bumperRepository_1.bumperRepository.update(bumper.mediaItemId, updatedBumper);
            res.status(200).json({ message: `Bumper ${updatedBumper.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getBumperHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.query.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'Media Item ID is required' });
            return;
        }
        // Retrieve bumper from MongoDB using bumper load title if it exists using request params
        const bumper = bumperRepository_1.bumperRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!bumper) {
            res
                .status(404)
                .json({ message: `Bumper with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(bumper);
        return;
    });
}
function getAllBumpersHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const bumpers = bumperRepository_1.bumperRepository.findAll();
        res.status(200).json(bumpers);
        return;
    });
}
function transformBumperFromRequest(bumper, mediaItemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedBumper = yield bumper_1.Bumper.fromRequestObject(bumper);
        parsedBumper.mediaItemId = mediaItemId;
        if (parsedBumper.duration > 0) {
            return parsedBumper;
        }
        try {
            console.log(`Getting duration for ${parsedBumper.path}`);
            let durationInSeconds = yield (0, utilities_1.getMediaDuration)(parsedBumper.path);
            parsedBumper.duration = durationInSeconds; // Update duration value
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot process bumper "${parsedBumper.title}": ${errorMessage}`);
        }
        return parsedBumper;
    });
}
