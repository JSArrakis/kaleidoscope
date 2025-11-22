"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowProgression = exports.MediaProgression = void 0;
class MediaProgression {
    constructor(title, type, shows) {
        this.title = title;
        this.type = type;
        this.shows = shows;
    }
}
exports.MediaProgression = MediaProgression;
class ShowProgression {
    constructor(loadTitle, episode) {
        this.mediaItemId = loadTitle;
        this.episode = episode;
    }
}
exports.ShowProgression = ShowProgression;
