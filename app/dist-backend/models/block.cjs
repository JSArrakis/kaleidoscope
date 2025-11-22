"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockShow = exports.Block = void 0;
class Block {
    constructor(title, mediaItemId, type, duration, durationLimit, tags, startBumper, endBumper, promos, shows, path) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.type = type;
        this.duration = duration;
        this.durationLimit = durationLimit;
        this.tags = tags;
        this.startBumper = startBumper;
        this.endBumper = endBumper;
        this.promos = promos;
        this.shows = shows;
        this.path = path;
    }
}
exports.Block = Block;
class BlockShow {
    constructor(mediaItemId, sequence, subsequence, durationLimit, bumperStart, bumperEnd, episode) {
        this.mediaItemId = mediaItemId;
        this.sequence = sequence;
        this.subsequence = subsequence;
        this.durationLimit = durationLimit;
        this.bumperStart = bumperStart;
        this.bumperEnd = bumperEnd;
        this.episode = episode;
    }
}
exports.BlockShow = BlockShow;
