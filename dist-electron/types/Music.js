export class Music {
    title;
    artist;
    mediaItemId;
    duration;
    path;
    type;
    tags;
    constructor(title, artist, mediaItemId, duration, path, type, tags) {
        this.title = title;
        this.artist = artist;
        this.mediaItemId = mediaItemId;
        this.duration = duration;
        this.path = path;
        this.type = type;
        this.tags = tags;
    }
}
