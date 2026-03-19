export class StagedMedia {
    scheduledMedia;
    injectedMovies;
    endTime;
    constructor(scheduledMedia, injectedMovies, endTime) {
        this.scheduledMedia = scheduledMedia;
        this.injectedMovies = injectedMovies;
        this.endTime = endTime;
    }
}
