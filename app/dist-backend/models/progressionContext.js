"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodeProgression = void 0;
class EpisodeProgression {
    constructor(showMediaItemId, streamType, currentEpisode, lastPlayed, nextEpisodeDurLimit, nextEpisodeOverDuration) {
        this.showMediaItemId = showMediaItemId;
        this.streamType = streamType;
        this.currentEpisode = currentEpisode;
        this.lastPlayed = lastPlayed;
        this.nextEpisodeDurLimit = nextEpisodeDurLimit;
        this.nextEpisodeOverDuration = nextEpisodeOverDuration;
    }
}
exports.EpisodeProgression = EpisodeProgression;
