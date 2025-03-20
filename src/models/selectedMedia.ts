import { Block } from './block';
import { MediaType } from './enum/mediaTypes';
import { Movie } from './movie';
import { Episode, Show } from './show';

export class SelectedMedia {
  media: Movie | Block | Episode;
  showTitle: string;
  type: MediaType;
  time: number;
  duration: number;
  tags: string[];

  constructor(
    media: Movie | Block | Episode,
    showTitle: string,
    type: MediaType,
    time: number,
    duration: number,
    tags: string[],
  ) {
    this.media = media;
    this.showTitle = showTitle;
    this.type = type;
    this.time = time;
    this.duration = duration;
    this.tags = tags;
  }
}
