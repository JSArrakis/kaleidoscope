"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectedMedia = void 0;
class SelectedMedia {
    constructor(media, showTitle, type, time, duration, tags) {
        this.media = media;
        this.showTitle = showTitle;
        this.type = type;
        this.time = time;
        this.duration = duration;
        this.tags = tags;
    }
}
exports.SelectedMedia = SelectedMedia;
