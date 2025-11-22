"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTagHandler = createTagHandler;
exports.deleteTagHandler = deleteTagHandler;
exports.getTagHandler = getTagHandler;
exports.getAllTagsByTypeHandler = getAllTagsByTypeHandler;
exports.getAllTagsHandler = getAllTagsHandler;
const express_validator_1 = require("express-validator");
const tagsRepository_1 = require("../repositories/tagsRepository");
const tagTypes_1 = require("../models/const/tagTypes");
const tag_1 = require("../models/tag");
const utilities_1 = require("../utils/utilities");
/**
 * Convert MM-DD format to ISO datetime format for holiday season dates
 */
function convertHolidayDatesForDatabase(requestBody) {
    const processedBody = { ...requestBody };
    // Only process if this is a Holiday tag
    if (processedBody.type === tagTypes_1.TagType.Holiday) {
        // Convert seasonStartDate from MM-DD to YYYY-MM-DD HH:MM:SS
        if (processedBody.seasonStartDate &&
            typeof processedBody.seasonStartDate === 'string') {
            processedBody.seasonStartDate = (0, utilities_1.parseToISODateTime)(processedBody.seasonStartDate, '00:00:00');
        }
        // Convert seasonEndDate from MM-DD to YYYY-MM-DD HH:MM:SS
        if (processedBody.seasonEndDate &&
            typeof processedBody.seasonEndDate === 'string') {
            processedBody.seasonEndDate = (0, utilities_1.parseToISODateTime)(processedBody.seasonEndDate, '23:59:59');
        }
    }
    return processedBody;
}
async function createTagHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let tagId = req.body.tagId;
    if (!tagId) {
        res.status(400).json({ message: 'tagId is required' });
        return;
    }
    let type = req.body.type;
    if (!type) {
        res.status(400).json({ message: 'type is required' });
        return;
    }
    // Validate type against known tag types
    if (!(0, tagTypes_1.isValidTagType)(type)) {
        res.status(400).json({ message: `Invalid tag type: ${type}` });
        return;
    }
    const tag = tagsRepository_1.tagRepository.findByTagId(tagId);
    if (tag) {
        res.status(400).json({ message: `Tag with ID ${tagId} already exists` });
        return;
    }
    try {
        // Convert MM-DD dates to ISO datetime format for Holiday tags
        const processedBody = convertHolidayDatesForDatabase(req.body);
        const tagObject = tag_1.Tag.fromRequestObject(processedBody);
        tagsRepository_1.tagRepository.create(tagObject);
        res.status(200).json({ message: `Tag ${req.body.name} Created` });
    }
    catch (error) {
        if (error.message.includes('already exists')) {
            res.status(400).json({ message: error.message });
        }
        else {
            console.error('Error creating tag:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    return;
}
async function deleteTagHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let tagId = req.query.tagId;
    if (!tagId) {
        res.status(400).json({ message: 'tagId is required' });
        return;
    }
    const tag = tagsRepository_1.tagRepository.findByTagId(tagId);
    if (!tag) {
        res.status(400).json({ message: `Tag with ID ${tagId} does not exist` });
        return;
    }
    tagsRepository_1.tagRepository.delete(tagId);
    res.status(200).json({ message: `Tag ${tag.name} Deleted` });
    return;
}
async function getTagHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let tagId = req.query.tagId;
    if (!tagId) {
        res.status(400).json({ message: 'tagId is required' });
        return;
    }
    const tag = tagsRepository_1.tagRepository.findByTagId(tagId);
    if (!tag) {
        res.status(404).json({ message: `Tag with ID ${tagId} does not exist` });
        return;
    }
    res.status(200).json(tag);
    return;
}
async function getAllTagsByTypeHandler(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    let type = req.query.type;
    if (!type) {
        res.status(400).json({ message: 'type is required' });
        return;
    }
    // Validate type against known tag types
    if (!(0, tagTypes_1.isValidTagType)(type)) {
        res.status(400).json({ message: `Invalid tag type: ${type}` });
        return;
    }
    const tags = await tagsRepository_1.tagRepository.findByType(type);
    if (tags.length === 0) {
        res.status(404).json({ message: `No tags found for type ${type}` });
        return;
    }
    res.status(200).json(tags);
    return;
}
async function getAllTagsHandler(req, res) {
    const tags = await tagsRepository_1.tagRepository.findAll();
    res.status(200).json(tags);
    return;
}
