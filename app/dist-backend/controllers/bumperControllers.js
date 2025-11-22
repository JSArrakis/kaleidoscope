"use strict";
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
async function createBumperHandler(req, res) {
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
        let transformedBumper = await transformBumperFromRequest(req.body, mediaItemId);
        // Insert bumper into database
        await bumperRepository_1.bumperRepository.create(transformedBumper);
        res
            .status(200)
            .json({ message: `Bumper ${transformedBumper.title} Created` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function deleteBumperHandler(req, res) {
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
}
async function updateBumperHandler(req, res) {
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
        let updatedBumper = await transformBumperFromRequest(req.body, bumper.mediaItemId);
        // Update bumper in database
        bumperRepository_1.bumperRepository.update(bumper.mediaItemId, updatedBumper);
        res.status(200).json({ message: `Bumper ${updatedBumper.title} Updated` });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: errorMessage });
    }
    return;
}
async function getBumperHandler(req, res) {
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
}
async function getAllBumpersHandler(req, res) {
    const bumpers = bumperRepository_1.bumperRepository.findAll();
    res.status(200).json(bumpers);
    return;
}
async function transformBumperFromRequest(bumper, mediaItemId) {
    let parsedBumper = await bumper_1.Bumper.fromRequestObject(bumper);
    parsedBumper.mediaItemId = mediaItemId;
    if (parsedBumper.duration > 0) {
        return parsedBumper;
    }
    try {
        console.log(`Getting duration for ${parsedBumper.path}`);
        let durationInSeconds = await (0, utilities_1.getMediaDuration)(parsedBumper.path);
        parsedBumper.duration = durationInSeconds; // Update duration value
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Cannot process bumper "${parsedBumper.title}": ${errorMessage}`);
    }
    return parsedBumper;
}
