"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bumper = void 0;
const mediaTypes_1 = require("./enum/mediaTypes");
const tagsRepository_1 = require("../repositories/tagsRepository");
class Bumper {
    constructor(title, loadtitle, duration, path, type, tags) {
        this.title = title;
        this.mediaItemId = loadtitle;
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
        return new Bumper(requestObject.title, requestObject.mediaItemId, requestObject.duration, requestObject.path, mediaTypes_1.MediaType.Bumper, tags);
    }
}
exports.Bumper = Bumper;
