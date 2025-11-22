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
exports.createShowHandler = createShowHandler;
exports.deleteShowHandler = deleteShowHandler;
exports.updateShowHandler = updateShowHandler;
exports.getShowHandler = getShowHandler;
exports.getAllShowsHandler = getAllShowsHandler;
exports.transformShowFromRequest = transformShowFromRequest;
const express_validator_1 = require("express-validator");
const utilities_1 = require("../utils/utilities");
const showRepository_1 = require("../repositories/showRepository");
function createShowHandler(req, res) {
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
        const show = showRepository_1.showRepository.findByMediaItemId(mediaItemId);
        if (show) {
            res.status(400).json({
                message: `Show with mediaItemId: ${req.body.mediaItemId} already exists`,
            });
            return;
        }
        // If it doesn't exist, perform transformations
        try {
            let createdShow = yield transformShowFromRequest(req.body);
            // TODO: Check for duplicate episode paths on this show
            // If there are duplicate episode paths, return error
            const episodePaths = createdShow.episodes.map(episode => episode.path);
            const uniqueEpisodePaths = new Set(episodePaths);
            if (uniqueEpisodePaths.size !== episodePaths.length) {
                res.status(400).json({
                    message: 'Show contains duplicate episode paths',
                    duplicatePaths: episodePaths.filter((path, index) => episodePaths.indexOf(path) !== index),
                });
                return;
            }
            // Insert show into database
            showRepository_1.showRepository.create(createdShow);
            res.status(200).json({ message: `Show ${createdShow.title} Created` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
// Delete Show by Load Title
function deleteShowHandler(req, res) {
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
        // Retrieve show from MongoDB using show load title if it exists
        const show = showRepository_1.showRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!show) {
            res.status(400).json({ message: 'Show does not exist' });
            return;
        }
        // If it exists, delete it
        showRepository_1.showRepository.delete(mediaItemId);
        res.status(200).json({ message: `Show ${show.title} Deleted` });
        return;
    });
}
function updateShowHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let mediaItemId = req.body.mediaItemId;
        if (!mediaItemId) {
            res.status(400).json({ message: 'MediaItemId is required' });
            return;
        }
        // Retrieve show from MongoDB using show load title if it exists
        const show = showRepository_1.showRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!show) {
            res
                .status(400)
                .json({ message: `Show with ID ${mediaItemId} does not exist` });
            return;
        }
        // If it exists, perform transformations
        try {
            let updatedShow = yield transformShowFromRequest(req.body);
            const episodePaths = updatedShow.episodes.map(episode => episode.path);
            const uniqueEpisodePaths = new Set(episodePaths);
            if (uniqueEpisodePaths.size !== episodePaths.length) {
                res.status(400).json({
                    message: 'Show contains duplicate episode paths',
                    duplicatePaths: episodePaths.filter((path, index) => episodePaths.indexOf(path) !== index),
                });
                return;
            }
            // Update show in database
            showRepository_1.showRepository.update(mediaItemId, updatedShow);
            res.status(200).json({ message: `Show ${updatedShow.title} Updated` });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json({ message: errorMessage });
        }
        return;
    });
}
function getShowHandler(req, res) {
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
        const show = showRepository_1.showRepository.findByMediaItemId(mediaItemId);
        // If it doesn't exist, return error
        if (!show) {
            res
                .status(404)
                .json({ message: `Show with ID ${mediaItemId} does not exist` });
            return;
        }
        res.status(200).json(show);
        return;
    });
}
function getAllShowsHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const shows = showRepository_1.showRepository.findAll();
        res.status(200).json(shows);
        return;
    });
}
function transformShowFromRequest(show) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const episode of show.episodes) {
            if (episode.duration > 0)
                continue; // Skip if duration is already set
            episode.showItemId = show.mediaItemId; // Set showItemId for the episode
            console.log(`Getting duration for ${episode.path}`);
            try {
                let durationInSeconds = yield (0, utilities_1.getMediaDuration)(episode.path);
                episode.duration = durationInSeconds; // Update duration value
                episode.durationLimit =
                    Math.floor(episode.duration / 1800) * 1800 +
                        (episode.duration % 1800 > 0 ? 1800 : 0);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Cannot process episode "${episode.title}" of show "${show.title}": ${errorMessage}`);
            }
            // set episode load title using show load title and episode number
        }
        //create an accounting of how many different duration limits there are and create a map of it
        let durationLimitsMap = new Map();
        show.episodes.forEach(episode => {
            if (durationLimitsMap.has(episode.durationLimit)) {
                durationLimitsMap.set(episode.durationLimit, durationLimitsMap.get(episode.durationLimit) + 1);
            }
            else {
                durationLimitsMap.set(episode.durationLimit, 1);
            }
        });
        //use the map to determine which duration limit is the most common and use that as the show duration limit
        let maxCount = 0;
        let maxDurationLimit = 0;
        durationLimitsMap.forEach((value, key) => {
            if (value > maxCount) {
                maxCount = value;
                maxDurationLimit = key;
            }
        });
        show.durationLimit = maxDurationLimit;
        // Set overDuration on individual episodes if they exceed the duration limit
        show.episodes.forEach(episode => {
            episode.overDuration = episode.duration > show.durationLimit;
        });
        // Set firstEpisodeOverDuration on the show only if the first episode is over duration
        show.firstEpisodeOverDuration =
            show.episodes.length > 0 && show.episodes[0].overDuration;
        //set the episode count to the length of the episodes array
        show.episodeCount = show.episodes.length;
        //specific epdiode tags that are not presenting in the show tags are added as secondary tags
        const showTagIds = new Set(show.tags.map(tag => tag.tagId));
        const secondaryTagsSet = new Set();
        show.episodes.forEach(episode => {
            episode.tags.forEach(tag => {
                if (!showTagIds.has(tag.tagId)) {
                    secondaryTagsSet.add(tag.tagId);
                }
            });
        });
        // Convert secondary tag IDs back to Tag objects
        show.secondaryTags = Array.from(secondaryTagsSet)
            .map(tagId => {
            // Find the tag object from any episode that has it
            for (const episode of show.episodes) {
                const foundTag = episode.tags.find(tag => tag.tagId === tagId);
                if (foundTag)
                    return foundTag;
            }
            return null;
        })
            .filter(tag => tag !== null);
        //create a list of episodes that is sorted by episode.episode disregarding the fields episodeNumber and season
        const sortedEpisodes = show.episodes.sort((a, b) => {
            if (a.episode < b.episode)
                return -1;
            if (a.episode > b.episode)
                return 1;
            return 0;
        });
        // If the first episode is over the duration limit, set the show to first episode over duration
        if (sortedEpisodes.length > 0) {
            show.firstEpisodeOverDuration =
                sortedEpisodes[0].duration > show.durationLimit;
        }
        else {
            show.firstEpisodeOverDuration = false;
        }
        return show;
    });
}
