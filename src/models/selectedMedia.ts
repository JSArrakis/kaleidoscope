import { Block } from './block';
import { MediaType } from './enum/mediaTypes';
import { Movie } from './movie';
import { Episode, Show } from './show';
import { MediaTag } from './const/tagTypes';

export class SelectedMedia {
  media: Movie | Block | Episode;
  showTitle: string;
  type: MediaType;
  time: number;
  duration: number;
  tags: MediaTag[];

  constructor(
    media: Movie | Block | Episode,
    showTitle: string,
    type: MediaType,
    time: number,
    duration: number,
    tags: MediaTag[],
  ) {
    this.media = media;
    this.showTitle = showTitle;
    this.type = type;
    this.time = time;
    this.duration = duration;
    this.tags = tags;
  }
}
