export class Episode {
    season;
    episode;
    episodeNumber;
    path;
    title;
    mediaItemId;
    showItemId;
    duration;
    durationLimit;
    overDuration;
    type;
    tags;
    constructor(season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, overDuration, type, tags) {
        this.season = season;
        this.episode = episode;
        this.episodeNumber = episodeNumber;
        this.path = path;
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.showItemId = showItemId;
        this.duration = duration;
        this.durationLimit = durationLimit;
        this.overDuration = overDuration;
        this.type = type;
        this.tags = tags;
    }
}
