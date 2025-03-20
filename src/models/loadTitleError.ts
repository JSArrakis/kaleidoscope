export class LoadTitleError {
  mediaItemId: string;
  error: string;

  constructor(mediaItemId: string, error: string) {
    this.mediaItemId = mediaItemId;
    this.error = error;
  }
}
