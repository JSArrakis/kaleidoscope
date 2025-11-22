"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvConfiguration = void 0;
class EnvConfiguration {
    constructor(title, mediaItemId, favorites, blackList, defaultTags, defaultPromo) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.favorites = favorites;
        this.blackList = blackList;
        this.defaultTags = defaultTags;
        this.defaultPromo = defaultPromo;
    }
    static fromRequestObject(requestObject) {
        return new EnvConfiguration(requestObject.title, requestObject.mediaItemId, requestObject.favorites, requestObject.blackList, requestObject.defaultTags, requestObject.defaultPromo);
    }
}
exports.EnvConfiguration = EnvConfiguration;
