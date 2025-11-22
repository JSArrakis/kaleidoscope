"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movie = exports.CollectionReference = void 0;
const mediaTypes_1 = require("./enum/mediaTypes.cjs");
const tagsRepository_1 = require("../repositories/tagsRepository.cjs");
class CollectionReference {
    constructor(id, title, sequence) {
        this.mediaItemId = id;
        this.title = title;
        this.sequence = sequence;
    }
    static fromRequestObject(requestObject) {
        return new CollectionReference(requestObject.mediaItemId, requestObject.title, requestObject.sequence);
    }
}
exports.CollectionReference = CollectionReference;
class Movie {
    constructor(title, mediaItemId, alias, imdb, tags, path, duration, durationLimit, type, collections) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.alias = alias;
        this.imdb = imdb;
        this.tags = tags;
        this.path = path;
        this.duration = duration;
        this.durationLimit = durationLimit;
        this.type = type;
        this.collections = collections;
    }
    static fromRequestObject(requestObject) {
        // Handle tag names - convert tag names (strings) to Tag objects
        const tags = [];
        for (const tagName of requestObject.tags) {
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
        return new Movie(requestObject.title, requestObject.mediaItemId, requestObject.alias, requestObject.imdb, tags, requestObject.path, requestObject.duration, requestObject.durationLimit, mediaTypes_1.MediaType.Movie, requestObject.collections || []);
    }
}
exports.Movie = Movie;
