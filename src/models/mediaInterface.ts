import { MediaTag } from './const/tagTypes';

export interface BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  tags: MediaTag[];
}
