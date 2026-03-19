export class SelectedMedia {
    media;
    showTitle;
    type;
    time;
    duration;
    tags;
    constructor(media, showTitle, type, time, duration, tags) {
        this.media = media;
        this.showTitle = showTitle;
        this.type = type;
        this.time = time;
        this.duration = duration;
        this.tags = tags;
    }
}
