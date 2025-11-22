import { Block } from './block';
import { MediaType } from './enum/mediaTypes';
import { Movie } from './movie';
import { Episode, Show } from './show';
import { Tag } from './tag';

export class SelectedMedia {
  media: Movie | Block | Episode;
  showTitle: string;
  type: MediaType;
  time: number;
  duration: number;
  tags: Tag[];

  constructor(
    media: Movie | Block | Episode,
    showTitle: string,
    type: MediaType,
    time: number,
    duration: number,
    tags: Tag[],
  ) {
    this.media = media;
    this.showTitle = showTitle;
    this.type = type;
    this.time = time;
    this.duration = duration;
    this.tags = tags;
  }
}
