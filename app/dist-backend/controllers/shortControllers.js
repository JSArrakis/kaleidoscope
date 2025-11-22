"use strict";
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
async function createShortHandler(req, res) {
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
        let transformedShort = await transformShortFromRequest(req.body, mediaItemId);
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
}
async function deleteShortHandler(req, res) {
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
}
async function updateShortHandler(req, res) {
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
        let updatedShort = await transformShortFromRequest(req.body, short.mediaItemId);
        // Update short in database
        await shortRepository_1.shortRepository.update(mediaItemId, updatedShort);
        res.status(200).json({ message: `Short ${updatedShort.title} Updated` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function getShortHandler(req, res) {
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
}
async function getAllShortsHandler(req, res) {
    const shorts = shortRepository_1.shortRepository.findAll();
    res.status(200).json(shorts);
    return;
}
async function transformShortFromRequest(short, mediaItemId) {
    let parsedShort = await short_1.Short.fromRequestObject(short);
    parsedShort.mediaItemId = mediaItemId;
    if (parsedShort.duration > 0) {
        return parsedShort;
    }
    try {
        console.log(`Getting duration for ${parsedShort.path}`);
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedShort.path);
        parsedShort.duration = durationInSeconds; // Update duration value
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot process short "${parsedShort.title}": ${errorMessage}`);
    }
    return parsedShort;
}
