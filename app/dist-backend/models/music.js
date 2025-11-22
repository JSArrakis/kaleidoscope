"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Music = void 0;
const mediaTypes_1 = require("./enum/mediaTypes");
const tagsRepository_1 = require("../repositories/tagsRepository");
class Music {
    constructor(title, artist, mediaItemId, duration, path, type, tags) {
        this.title = title;
        this.artist = artist;
        this.mediaItemId = mediaItemId;
        this.duration = duration;
        this.path = path;
        this.type = type;
        this.tags = tags;
    }
    static async fromRequestObject(requestObject) {
        // Convert tag names to Tag objects
        const tags = [];
        if (requestObject.tags && Array.isArray(requestObject.tags)) {
            for (const tagName of requestObject.tags) {
                const tag = tagsRepository_1.tagRepository.findByName(tagName);
                if (tag) {
                    tags.push(tag);
                }
            }
        }
        return new Music(requestObject.title, requestObject.artist, requestObject.mediaItemId, requestObject.duration, requestObject.path, mediaTypes_1.MediaType.Music, tags);
    }
}
exports.Music = Music;
