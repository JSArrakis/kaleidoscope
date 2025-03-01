import { Block } from './block';
import { MediaType } from './enum/mediaTypes';
import { Movie } from './movie';
import { Episode, Show } from './show';

export class SelectedMedia {
  Media: Movie | Block | Episode;
  ShowTitle: string;
  Type: MediaType;
  Time: number;
  Duration: number;
  Tags: string[];

  constructor(
    media: Movie | Block | Episode,
    showTitle: string,
    type: MediaType,
    time: number,
    duration: number,
    tags: string[],
  ) {
    this.Media = media;
    this.ShowTitle = showTitle;
    this.Type = type;
    this.Time = time;
    this.Duration = duration;
    this.Tags = tags;
  }
}
