export class MediaProgression {
  title: string;
  type: string;
  shows: ShowProgression[];

  constructor(title: string, type: string, shows: ShowProgression[]) {
    this.title = title;
    this.type = type;
    this.shows = shows;
  }
}

export class ShowProgression {
  mediaItemId: string;
  episode: number;

  constructor(loadTitle: string, episode: number) {
    this.mediaItemId = loadTitle;
    this.episode = episode;
  }
}
