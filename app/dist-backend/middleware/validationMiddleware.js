"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMusicValidationRules = exports.deleteMusicValidationRules = exports.updateMusicValidationRules = exports.createMusicValidationRules = exports.getBumperValidationRules = exports.deleteBumperValidationRules = exports.updateBumperValidationRules = exports.createBumperValidationRules = exports.getPromoValidationRules = exports.deletePromoValidationRules = exports.updatePromoValidationRules = exports.createPromoValidationRules = exports.getHolidayValidationRules = exports.deleteHolidayValidationRules = exports.updateHolidayValidationRules = exports.createHolidayValidationRules = exports.getAgeGroupsValidationRules = exports.deleteAgeGroupValidationRules = exports.updateAgeGroupValidationRules = exports.createAgeGroupValidationRules = exports.getTagsValidationRules = exports.deleteTagValidationRules = exports.updateTagValidationRules = exports.createTagValidationRules = exports.getShortValidationRules = exports.deleteShortValidationRules = exports.updateShortValidationRules = exports.createShortValidationRules = exports.getCommercialValidationRules = exports.deleteCommercialValidationRules = exports.updateCommercialValidationRules = exports.createCommercialValidationRules = exports.getCollectionValidationRules = exports.deleteCollectionValidationRules = exports.updateCollectionValidationRules = exports.createCollectionValidationRules = exports.getBufferValidationRules = exports.deleteBufferValidationRules = exports.updateBufferValidationRules = exports.bulkCreateBufferValidationRules = exports.createBufferValidationRules = exports.getShowValidationRules = exports.deleteShowValidationRules = exports.updateShowValidationRules = exports.createShowValidationRules = exports.getMovieValidationRules = exports.deleteMovieValidationRules = exports.updateMovieValidationRules = exports.createMovieValidationRules = void 0;
exports.createMediaValidation = createMediaValidation;
const express_validator_1 = require("express-validator");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const movie_1 = require("../models/movie");
const tagsRepository_1 = require("../repositories/tagsRepository");
// Helper function to validate tag names exist in database
function validateTagNamesExist(tagNames) {
    for (const tagName of tagNames) {
        const tag = tagsRepository_1.tagRepository.findByName(tagName);
        if (!tag) {
            throw new Error(`Tag "${tagName}" does not exist in the database`);
        }
    }
    return true;
}
exports.createMovieValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be a full PC, Mac, Linux, or network path that Kaleidoscope can access.');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.R_OK);
        }
        catch (err) {
            throw new Error('Path is not accessible by Kaleidoscope.');
        }
        return true;
    }),
];
exports.updateMovieValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('alias').isString(),
    (0, express_validator_1.body)('imdb').isString(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('collections')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (!(item instanceof movie_1.CollectionReference)) {
                throw new Error('collections must be an array of Collection Reference objects');
            }
        }
        return true;
    }),
];
exports.deleteMovieValidationRules = [];
exports.getMovieValidationRules = [];
// ===========================================
//              SHOW VALIDATION
// ===========================================
exports.createShowValidationRules = [
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    // episodes must be an array of Episode objects
    (0, express_validator_1.body)('episodes')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'object') {
                throw new Error('episodes must be an array of Episode objects');
            }
        }
        return true;
    }),
    // Each episode must have the following fields
    (0, express_validator_1.body)('episodes.*.mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('episodes.*.path').isString().notEmpty(),
    (0, express_validator_1.body)('episodes.*.episodeNumber').isNumeric().notEmpty(),
    (0, express_validator_1.body)('episodes.*.episodeNumber').custom((value, { req }) => {
        const episodeNumbers = req.body.episodes.map((episode) => episode.episodeNumber);
        if (episodeNumbers.indexOf(value) !== episodeNumbers.lastIndexOf(value)) {
            throw new Error('Episode number must be unique in the episodes array');
        }
        return true;
    }),
    (0, express_validator_1.body)('episodes.*.tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Episode tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
];
exports.updateShowValidationRules = [
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    // episodes must be an array of Episode objects
    (0, express_validator_1.body)('episodes')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'object') {
                throw new Error('episodes must be an array of Episode objects');
            }
        }
        return true;
    }),
    // Each episode must have the following fields
    (0, express_validator_1.body)('episodes.*.mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('episodes.*.path').isString().notEmpty(),
    (0, express_validator_1.body)('episodes.*.episodeNumber').isNumeric().notEmpty(),
    (0, express_validator_1.body)('episodes.*.episodeNumber').custom((value, { req }) => {
        const episodeNumbers = req.body.episodes.map((episode) => episode.episodeNumber);
        if (episodeNumbers.indexOf(value) !== episodeNumbers.lastIndexOf(value)) {
            throw new Error('Episode number must be unique in the episodes array');
        }
        return true;
    }),
    (0, express_validator_1.body)('episodes.*.tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Episode tags must be an array of tag names (strings)');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
];
exports.deleteShowValidationRules = [];
exports.getShowValidationRules = [];
// ===========================================
//          BUFFER MEDIA VALIDATION
// ===========================================
function createMediaValidation(media) {
    if (!media.title || typeof media.title !== 'string') {
        return 'Media must have a "title" field that is a string';
    }
    if (!media.path || typeof media.path !== 'string') {
        return 'Media must have a "path" field that is the file path of the target media file a string';
    }
    if (!media.tags ||
        !Array.isArray(media.tags) ||
        media.tags.length < 1 ||
        !media.tags.every((tag) => typeof tag === 'string')) {
        return 'Media must have a "tags" field that must provided as a non-empty array of strings for each buffer media';
    }
    return '';
}
exports.createBufferValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray({ min: 1 })
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('tags must be an array of strings');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('path').isString().notEmpty(),
];
exports.bulkCreateBufferValidationRules = [];
exports.updateBufferValidationRules = [
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray({ min: 1 })
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('tags must be an array of strings');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('path').isString().notEmpty(),
];
exports.deleteBufferValidationRules = [];
exports.getBufferValidationRules = [];
// ===========================================
//          COLLECTION VALIDATION
// ===========================================
exports.createCollectionValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    // if there are items in the request body, they must be an array
    (0, express_validator_1.body)('items')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'object') {
                throw new Error('items must be an array of objects');
            }
            if (!item.mediaItemId || typeof item.mediaItemId !== 'string') {
                throw new Error('items must have a "MediaItemId" field that is a string');
            }
            if (!item.mediaItemTitle || typeof item.mediaItemTitle !== 'string') {
                throw new Error('items must have a "MediaItemTitle" field that is a string');
            }
            if (!item.sequence || typeof item.sequence !== 'number') {
                throw new Error('items must have a "Sequence" field that is a number');
            }
        }
        return true;
    }),
];
exports.updateCollectionValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    // if there are items in the request body, they must be an array
    (0, express_validator_1.body)('items')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'object') {
                throw new Error('items must be an array of objects');
            }
            if (!item.mediaItemId || typeof item.mediaItemId !== 'string') {
                throw new Error('items must have a "MediaItemId" field that is a string');
            }
            if (!item.mediaItemTitle || typeof item.mediaItemTitle !== 'string') {
                throw new Error('items must have a "MediaItemTitle" field that is a string');
            }
            if (!item.sequence || typeof item.sequence !== 'number') {
                throw new Error('items must have a "Sequence" field that is a number');
            }
        }
        return true;
    }),
];
exports.deleteCollectionValidationRules = [];
exports.getCollectionValidationRules = [];
// ===========================================
//          COMMERCIAL VALIDATION
// ===========================================
exports.createCommercialValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('type').isNumeric().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.updateCommercialValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('type').isNumeric(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .custom(value => {
        if (value && !path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        if (value) {
            try {
                fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
            }
            catch (err) {
                throw new Error('Path does not exist');
            }
        }
        return true;
    }),
];
exports.deleteCommercialValidationRules = [];
exports.getCommercialValidationRules = [];
// ===========================================
//          SHORT VALIDATION
// ===========================================
exports.createShortValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('type').isNumeric().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.updateShortValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('type').isNumeric(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .custom(value => {
        if (value && !path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        if (value) {
            try {
                fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
            }
            catch (err) {
                throw new Error('Path does not exist');
            }
        }
        return true;
    }),
];
exports.deleteShortValidationRules = [];
exports.getShortValidationRules = [];
// ===========================================
//          TAG VALIDATION
// ===========================================
exports.createTagValidationRules = [
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value) => {
        // Check if tag name already exists
        if (tagsRepository_1.tagRepository.isNameTaken(value)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
];
exports.updateTagValidationRules = [
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value, { req }) => {
        // Check if tag name already exists (excluding current tag)
        const currentTagId = req.params?.tagId || req.body?.tagId;
        if (tagsRepository_1.tagRepository.isNameTaken(value, currentTagId)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
];
exports.deleteTagValidationRules = [];
exports.getTagsValidationRules = [];
// ===========================================
//          AGE GROUP VALIDATION
// ===========================================
exports.createAgeGroupValidationRules = [
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value) => {
        // Check if tag name already exists
        if (tagsRepository_1.tagRepository.isNameTaken(value)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
    (0, express_validator_1.body)('sequence').isNumeric().notEmpty(),
];
exports.updateAgeGroupValidationRules = [
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value, { req }) => {
        // Check if tag name already exists (excluding current tag)
        const currentTagId = req.params?.tagId || req.body?.tagId;
        if (tagsRepository_1.tagRepository.isNameTaken(value, currentTagId)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
    (0, express_validator_1.body)('sequence').isNumeric().notEmpty(),
];
exports.deleteAgeGroupValidationRules = [];
exports.getAgeGroupsValidationRules = [];
// ===========================================
//           HOLIDAY VALIDATION
// ===========================================
exports.createHolidayValidationRules = [
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value) => {
        // Check if tag name already exists
        if (tagsRepository_1.tagRepository.isNameTaken(value)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('holidayDates')
        .isArray({ min: 1 })
        .custom((value) => {
        for (const item of value) {
            // strings must to be in MM-DD format
            if (typeof item !== 'string' || !/^\d{2}-\d{2}$/.test(item)) {
                throw new Error('holidayDates must be an array of strings in MM-DD format');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('exclusionGenres')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('exclusionGenres must be an array of strings');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('seasonStartDate')
        .isString()
        .matches(/^\d{2}-\d{2}$/),
    (0, express_validator_1.body)('seasonEndDate')
        .isString()
        .matches(/^\d{2}-\d{2}$/),
];
exports.updateHolidayValidationRules = [
    (0, express_validator_1.body)('tagId').isString().notEmpty(),
    (0, express_validator_1.body)('name')
        .isString()
        .notEmpty()
        .custom((value, { req }) => {
        // Check if tag name already exists (excluding current tag)
        const currentTagId = req.params?.tagId || req.body?.tagId;
        if (tagsRepository_1.tagRepository.isNameTaken(value, currentTagId)) {
            throw new Error(`Tag name "${value}" already exists`);
        }
        return true;
    }),
    (0, express_validator_1.body)('holidayDates')
        .isArray({ min: 1 })
        .custom((value) => {
        for (const item of value) {
            // strings must to be in MM-DD format
            if (typeof item !== 'string' || !/^\d{2}-\d{2}$/.test(item)) {
                throw new Error('holidayDates must be an array of strings in MM-DD format');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('exclusionGenres')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('exclusionGenres must be an array of strings');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('seasonStartDate')
        .isString()
        .matches(/^\d{2}-\d{2}$/),
    (0, express_validator_1.body)('seasonEndDate')
        .isString()
        .matches(/^\d{2}-\d{2}$/),
];
exports.deleteHolidayValidationRules = [];
exports.getHolidayValidationRules = [];
exports.createPromoValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('type').isNumeric().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.updatePromoValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('type').isNumeric(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.deletePromoValidationRules = [];
exports.getPromoValidationRules = [];
exports.createBumperValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('type').isNumeric().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.updateBumperValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('type').isNumeric(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.deleteBumperValidationRules = [];
exports.getBumperValidationRules = [];
exports.createMusicValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('artist').isString(),
    (0, express_validator_1.body)('type').isNumeric().notEmpty(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .notEmpty()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.updateMusicValidationRules = [
    (0, express_validator_1.body)('mediaItemId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString(),
    (0, express_validator_1.body)('artist').isString(),
    (0, express_validator_1.body)('type').isNumeric(),
    (0, express_validator_1.body)('tags')
        .isArray()
        .custom((value) => {
        for (const item of value) {
            if (typeof item !== 'string') {
                throw new Error('Tags must be an array of strings');
            }
        }
        // Validate that all tag names exist in the database
        return validateTagNamesExist(value);
    }),
    (0, express_validator_1.body)('path')
        .isString()
        .custom(value => {
        if (!path_1.default.isAbsolute(value)) {
            throw new Error('Path must be an absolute path');
        }
        try {
            fs_1.default.accessSync(value, fs_1.default.constants.F_OK);
        }
        catch (err) {
            throw new Error('Path does not exist');
        }
        return true;
    }),
];
exports.deleteMusicValidationRules = [];
exports.getMusicValidationRules = [];
