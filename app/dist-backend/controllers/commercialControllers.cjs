"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommercialHandler = createCommercialHandler;
exports.deleteCommercialHandler = deleteCommercialHandler;
exports.updateCommercialHandler = updateCommercialHandler;
exports.getCommercialHandler = getCommercialHandler;
exports.getAllCommercialsHandler = getAllCommercialsHandler;
exports.transformCommercialFromRequest = transformCommercialFromRequest;
const express_validator_1 = require("express-validator");
const commercial_1 = require("../models/commercial.cjs");
const utilities_1 = require("../utils/utilities.cjs");
const commercialRepository_1 = require("../repositories/commercialRepository.cjs");
async function createCommercialHandler(req, res) {
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
        let transformedComm = await transformCommercialFromRequest(req.body, mediaItemId);
        // Insert commercial into database
        await commercialRepository_1.commercialRepository.create(transformedComm);
        res
            .status(200)
            .json({ message: `Commercial ${transformedComm.title} Created` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function deleteCommercialHandler(req, res) {
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
}
async function updateCommercialHandler(req, res) {
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
        let updatedCommercial = await transformCommercialFromRequest(req.body, commercial.mediaItemId);
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
}
async function getCommercialHandler(req, res) {
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
}
async function getAllCommercialsHandler(req, res) {
    const commercials = commercialRepository_1.commercialRepository.findAll();
    res.status(200).json(commercials);
    return;
}
async function transformCommercialFromRequest(commercial, mediaItemId) {
    let parsedCommercial = await commercial_1.Commercial.fromRequestObject(commercial);
    parsedCommercial.mediaItemId = mediaItemId;
    if (parsedCommercial.duration > 0) {
        return parsedCommercial;
    }
    try {
        console.log(`Getting duration for ${parsedCommercial.path}`);
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedCommercial.path);
        parsedCommercial.duration = durationInSeconds; // Update duration value
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot process commercial "${parsedCommercial.title}": ${errorMessage}`);
    }
    return parsedCommercial;
}
