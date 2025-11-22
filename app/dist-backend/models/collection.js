"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionItem = exports.Collection = void 0;
class Collection {
    constructor(mediaItemId, title, description, items) {
        this.mediaItemId = mediaItemId;
        this.title = title;
        this.description = description;
        this.items = items;
    }
    static fromRequestObject(requestObject) {
        return new Collection(requestObject.mediaItemId, requestObject.title, requestObject.description, requestObject.items);
    }
}
exports.Collection = Collection;
class CollectionItem {
    constructor(mediaItemId, mediaItemTitle, sequence) {
        this.mediaItemId = mediaItemId;
        this.mediaItemTitle = mediaItemTitle;
        this.sequence = sequence;
    }
    static fromRequestObject(requestObject) {
        return new CollectionItem(requestObject.mediaItemId, requestObject.mediaItemTitle, requestObject.sequence);
    }
}
exports.CollectionItem = CollectionItem;
