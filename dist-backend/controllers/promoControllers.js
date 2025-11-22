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
exports.createPromoHandler = createPromoHandler;
exports.deletePromoHandler = deletePromoHandler;
exports.updatePromoHandler = updatePromoHandler;
exports.getPromoHandler = getPromoHandler;
exports.getAllPromosHandler = getAllPromosHandler;
exports.transformPromoFromRequest = transformPromoFromRequest;
const express_validator_1 = require("express-validator");
const promo_1 = require("../models/promo");
const utilities_1 = require("../utils/utilities");
const promoRepository_1 = require("../repositories/promoRepository");
function createPromoHandler(req, res) {
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
        // Retrieve promo from MongoDB using promo load title if it exists
        const promo = promoRepository_1.promoRepository.findByMediaItemId(mediaItemId);
        // If it exists, return error
        if (promo) {
            res
                .status(400)
                .json({ message: `Promo with ID ${mediaItemId} already exists` });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let transformedPromo = yield transformPromoFromRequest(req.body, mediaItemId);
            // Insert promo into database
            promoRepository_1.promoRepository.create(transformedPromo);
            res
                .status(200)
                .json({ message: `Promo ${transformedPromo.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function deletePromoHandler(req, res) {
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
        // Retrieve promo from MongoDB using promo load title if it exists
        const promo = promoRepository_1.promoRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!promo) {
            res
                .status(400)
                .json({ message: `Promo with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, delete it
        promoRepository_1.promoRepository.delete(mediaItemId);
        res.status(200).json({ message: `Promo ${promo.title} Deleted` });
        return;
    });
}
function updatePromoHandler(req, res) {
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
        // Retrieve promo from MongoDB using promo load title if it exists
        const promo = promoRepository_1.promoRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!promo) {
            res
                .status(400)
                .json({ message: `Promo with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedPromo = yield transformPromoFromRequest(req.body, promo.mediaItemId);
            // Update promo in database
            promoRepository_1.promoRepository.update(mediaItemId, updatedPromo);
            res.status(200).json({ message: `Promo ${updatedPromo.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getPromoHandler(req, res) {
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
        // Retrieve promo from MongoDB using promo load title if it exists using request params
        const promo = promoRepository_1.promoRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!promo) {
            res
                .status(404)
                .json({ message: `Promo with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(promo);
        return;
    });
}
function getAllPromosHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const promos = promoRepository_1.promoRepository.findAll();
        res.status(200).json(promos);
        return;
    });
}
function transformPromoFromRequest(promo, mediaItemId) {
    return __awaiter(this, void 0, void 0, function* () {
        let parsedPromo = yield promo_1.Promo.fromRequestObject(promo);
        parsedPromo.mediaItemId = mediaItemId;
        if (parsedPromo.duration > 0) {
            return parsedPromo;
        }
        try {
            console.log(`Getting duration for ${parsedPromo.path}`);
            let durationInSeconds = yield (0, utilities_1.getMediaDuration)(parsedPromo.path);
            parsedPromo.duration = durationInSeconds; // Update duration value
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot process promo "${parsedPromo.title}": ${errorMessage}`);
        }
        return parsedPromo;
    });
}
