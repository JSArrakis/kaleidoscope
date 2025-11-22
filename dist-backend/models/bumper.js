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
    static fromRequestObject(requestObject) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.Bumper = Bumper;
