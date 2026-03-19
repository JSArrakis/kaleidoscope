export class Short {
    title;
    mediaItemId;
    duration;
    path;
    type;
    tags;
    constructor(title, mediaItemId, duration, path, type, tags) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.duration = duration;
        this.path = path;
        this.type = type;
        this.tags = tags;
    }
}
