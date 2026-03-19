export class Movie {
    mediaItemId;
    title;
    alias;
    imdb;
    path;
    duration;
    durationLimit;
    tags;
    createdAt;
    updatedAt;
    constructor(mediaItemId, title, path, tags = [], alias, imdb, duration, durationLimit, createdAt, updatedAt) {
        this.mediaItemId = mediaItemId;
        this.title = title;
        this.path = path;
        this.tags = tags;
        this.alias = alias;
        this.imdb = imdb;
        this.duration = duration;
        this.durationLimit = durationLimit;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
export class CollectionReference {
    mediaItemId;
    title;
    sequence;
    constructor(id, title, sequence) {
        this.mediaItemId = id;
        this.title = title;
        this.sequence = sequence;
    }
}
