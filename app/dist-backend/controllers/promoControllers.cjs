"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromoHandler = createPromoHandler;
exports.deletePromoHandler = deletePromoHandler;
exports.updatePromoHandler = updatePromoHandler;
exports.getPromoHandler = getPromoHandler;
exports.getAllPromosHandler = getAllPromosHandler;
exports.transformPromoFromRequest = transformPromoFromRequest;
const express_validator_1 = require("express-validator");
const promo_1 = require("../models/promo.cjs");
const utilities_1 = require("../utils/utilities.cjs");
const promoRepository_1 = require("../repositories/promoRepository.cjs");
async function createPromoHandler(req, res) {
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
        let transformedPromo = await transformPromoFromRequest(req.body, mediaItemId);
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
}
async function deletePromoHandler(req, res) {
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
}
async function updatePromoHandler(req, res) {
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
        let updatedPromo = await transformPromoFromRequest(req.body, promo.mediaItemId);
        // Update promo in database
        promoRepository_1.promoRepository.update(mediaItemId, updatedPromo);
        res.status(200).json({ message: `Promo ${updatedPromo.title} Updated` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function getPromoHandler(req, res) {
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
}
async function getAllPromosHandler(req, res) {
    const promos = promoRepository_1.promoRepository.findAll();
    res.status(200).json(promos);
    return;
}
async function transformPromoFromRequest(promo, mediaItemId) {
    let parsedPromo = await promo_1.Promo.fromRequestObject(promo);
    parsedPromo.mediaItemId = mediaItemId;
    if (parsedPromo.duration > 0) {
        return parsedPromo;
    }
    try {
        console.log(`Getting duration for ${parsedPromo.path}`);
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedPromo.path);
        parsedPromo.duration = durationInSeconds; // Update duration value
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot process promo "${parsedPromo.title}": ${errorMessage}`);
    }
    return parsedPromo;
}
