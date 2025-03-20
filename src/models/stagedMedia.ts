import { SelectedMedia } from './selectedMedia';

export class StagedMedia {
  scheduledMedia: SelectedMedia[];
  injectedMovies: SelectedMedia[];
  endTime: number;

  constructor(
    scheduledMedia: SelectedMedia[],
    injectedMovies: SelectedMedia[],
    endTime: number,
  ) {
    this.scheduledMedia = scheduledMedia;
    this.injectedMovies = injectedMovies;
    this.endTime = endTime;
  }
}
