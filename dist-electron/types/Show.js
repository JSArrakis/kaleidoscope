export class Show {
    title;
    mediaItemId;
    alias;
    imdb;
    durationLimit;
    firstEpisodeOverDuration;
    tags;
    secondaryTags;
    type;
    episodeCount;
    episodes;
    constructor(title, mediaItemId, alias, imdb, durationLimit, firstEpisodeOverDuration, tags, secondaryTags, type, episodeCount, episodes) {
        this.title = title;
        this.mediaItemId = mediaItemId;
        this.alias = alias;
        this.imdb = imdb;
        this.durationLimit = durationLimit;
        this.firstEpisodeOverDuration = firstEpisodeOverDuration;
        this.tags = tags;
        this.secondaryTags = secondaryTags;
        this.type = type;
        this.episodeCount = episodeCount;
        this.episodes = episodes;
    }
}
