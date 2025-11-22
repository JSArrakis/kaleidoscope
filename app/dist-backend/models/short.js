"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Short = void 0;
const mediaTypes_1 = require("./enum/mediaTypes");
class Short {
    constructor(title, loadtitle, duration, path, type, tags) {
        this.title = title;
        this.mediaItemId = loadtitle;
        this.duration = duration;
        this.path = path;
        this.type = type;
        this.tags = tags;
    }
    static async fromRequestObject(requestObject) {
        const { tagRepository } = await Promise.resolve().then(() => __importStar(require('../repositories/tagsRepository')));
        // Convert tag names to Tag objects
        let tags = [];
        if (requestObject.tags && Array.isArray(requestObject.tags)) {
            for (const tagName of requestObject.tags) {
                const tag = tagRepository.findByName(tagName);
                if (tag) {
                    tags.push(tag);
                }
            }
        }
        return new Short(requestObject.title, requestObject.mediaItemId, requestObject.duration, requestObject.path, mediaTypes_1.MediaType.Short, tags);
    }
}
exports.Short = Short;
