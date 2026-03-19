export class Collection {
    mediaItemId;
    title;
    description;
    items;
    constructor(mediaItemId, title, description, items) {
        this.mediaItemId = mediaItemId;
        this.title = title;
        this.description = description;
        this.items = items;
    }
}
export class CollectionItem {
    mediaItemId;
    mediaItemTitle;
    sequence;
    constructor(mediaItemId, mediaItemTitle, sequence) {
        this.mediaItemId = mediaItemId;
        this.mediaItemTitle = mediaItemTitle;
        this.sequence = sequence;
    }
}
