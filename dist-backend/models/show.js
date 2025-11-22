"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Show = exports.Episode = void 0;
const mediaTypes_1 = require("./enum/mediaTypes");
const tagsRepository_1 = require("../repositories/tagsRepository");
class Episode {
    constructor(season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type, tags) {
        this.season = season;
        this.episode = episode;
        this.episodeNumber = episodeNumber;
        this.path = path;
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.showItemId = showItemId;
        this.duration = duration;
        this.durationLimit = durationLimit;
        this.overDuration = overDuration;
        this.type = type;
        this.tags = tags;
    }
    static fromRequestObject(requestObject) {
        // Handle tag names - convert tag names (strings) to Tag objects
        const tags = [];
        for (const tagName of requestObject.tags || []) {
            if (typeof tagName === 'string') {
                // Look up the tag by name in the database (try exact match first, then case-insensitive)
                let foundTag = tagsRepository_1.tagRepository.findByName(tagName);
                if (!foundTag) {
                    foundTag = tagsRepository_1.tagRepository.findByNameIgnoreCase(tagName);
                }
                if (foundTag) {
                    tags.push(foundTag);
                }
                else {
                    console.warn(`Tag with name "${tagName}" not found`);
                }
            }
        }
        return new Episode(requestObject.season, requestObject.episode, requestObject.episodeNumber, requestObject.path, requestObject.title, requestObject.mediaItemId, requestObject.showItemId, requestObject.duration, requestObject.durationLimit, requestObject.overDuration, mediaTypes_1.MediaType.Episode, tags);
    }
}
exports.Episode = Episode;
class Show {
    constructor(title, mediaItemId, alias, imdb, durationLimit, firstEpisodeOverDuration, tags, secondaryTags, type, episodeCount, episodes) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.alias = alias;
        this.imdb = imdb;
        this.durationLimit = durationLimit;
        this.firstEpisodeOverDuration = firstEpisodeOverDuration;
        this.tags = tags;
        this.secondaryTags = secondaryTags;
        this.type = type;
        this.episodeCount = episodeCount;
        this.episodes = episodes;
    }
    static fromRequestObject(requestObject) {
        var _a;
        // Handle tag names - convert tag names (strings) to Tag objects
        const tags = [];
        for (const tagName of requestObject.tags || []) {
            if (typeof tagName === 'string') {
                // Look up the tag by name in the database (try exact match first, then case-insensitive)
                let foundTag = tagsRepository_1.tagRepository.findByName(tagName);
                if (!foundTag) {
                    foundTag = tagsRepository_1.tagRepository.findByNameIgnoreCase(tagName);
                }
                if (foundTag) {
                    tags.push(foundTag);
                }
                else {
                    console.warn(`Tag with name "${tagName}" not found`);
                }
            }
        }
        // Handle secondary tags (initially empty, will be populated during transformation)
        const secondaryTags = [];
        return new Show(requestObject.title, requestObject.mediaItemId, requestObject.alias, requestObject.imdb, requestObject.durationLimit, requestObject.firstEpisodeOverDuration, tags, secondaryTags, mediaTypes_1.MediaType.Show, requestObject.episodeCount, ((_a = requestObject.episodes) === null || _a === void 0 ? void 0 : _a.map((episode) => Episode.fromRequestObject(episode))) || []);
    }
}
exports.Show = Show;
