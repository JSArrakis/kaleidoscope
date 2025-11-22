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
exports.createCommercialHandler = createCommercialHandler;
exports.deleteCommercialHandler = deleteCommercialHandler;
exports.updateCommercialHandler = updateCommercialHandler;
exports.getCommercialHandler = getCommercialHandler;
exports.getAllCommercialsHandler = getAllCommercialsHandler;
exports.transformCommercialFromRequest = transformCommercialFromRequest;
const express_validator_1 = require("express-validator");
const commercial_1 = require("../models/commercial");
const utilities_1 = require("../utils/utilities");
const commercialRepository_1 = require("../repositories/commercialRepository");
function createCommercialHandler(req, res) {
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
        const commercial = commercialRepository_1.commercialRepository.findByMediaItemId(mediaItemId);
        // If it exists, return error
        if (commercial) {
            res
                .status(400)
                .json({ message: `Commercial with Id ${mediaItemId} already exists` });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let transformedComm = yield transformCommercialFromRequest(req.body, mediaItemId);
            // Insert commercial into database
            yield commercialRepository_1.commercialRepository.create(transformedComm);
            res
                .status(200)
                .json({ message: `Commercial ${transformedComm.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function deleteCommercialHandler(req, res) {
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
        // Retrieve commercial from MongoDB using commercial load title if it exists
        const commercial = commercialRepository_1.commercialRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!commercial) {
            res.status(400).json({ message: 'Commercial does not exist' });
            return;
        }
        // If it exists, delete it
        commercialRepository_1.commercialRepository.delete(mediaItemId);
        res.status(200).json({ message: 'Commercial Deleted' });
        return;
    });
}
function updateCommercialHandler(req, res) {
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
        // Retrieve commercial from MongoDB using commercial load title if it exists
        const commercial = commercialRepository_1.commercialRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!commercial) {
            res
                .status(400)
                .json({ message: `Commercial with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedCommercial = yield transformCommercialFromRequest(req.body, commercial.mediaItemId);
            // Update commercial in database
            commercialRepository_1.commercialRepository.update(commercial.mediaItemId, updatedCommercial);
            res
                .status(200)
                .json({ message: `Commercial ${updatedCommercial.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getCommercialHandler(req, res) {
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
        // Retrieve commercial from MongoDB using commercial load title if it exists using request params
        const commercial = commercialRepository_1.commercialRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!commercial) {
            res
                .status(404)
                .json({ message: `Commercial with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(commercial);
        return;
    });
}
function getAllCommercialsHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const commercials = commercialRepository_1.commercialRepository.findAll();
        res.status(200).json(commercials);
        return;
    });
}
function transformCommercialFromRequest(commercial, mediaItemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedCommercial = yield commercial_1.Commercial.fromRequestObject(commercial);
        parsedCommercial.mediaItemId = mediaItemId;
        if (parsedCommercial.duration > 0) {
            return parsedCommercial;
        }
        try {
            console.log(`Getting duration for ${parsedCommercial.path}`);
            let durationInSeconds = yield (0, utilities_1.getMediaDuration)(parsedCommercial.path);
            parsedCommercial.duration = durationInSeconds; // Update duration value
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot process commercial "${parsedCommercial.title}": ${errorMessage}`);
        }
        return parsedCommercial;
    });
}
