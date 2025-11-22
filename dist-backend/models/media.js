"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
class Media {
    constructor(shows, movies, shorts, music, promos, defaultPromos, commercials, defaultCommercials, blocks) {
        this.shows = shows;
        this.movies = movies;
        this.shorts = shorts;
        this.music = music;
        this.promos = promos;
        this.defaultPromos = defaultPromos;
        this.commercials = commercials;
        this.defaultCommercials = defaultCommercials;
        this.blocks = blocks;
    }
}
exports.Media = Media;
