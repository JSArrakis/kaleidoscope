import { Tag } from './tag';
import { MediaType } from './enum/mediaTypes';

export interface BaseMedia {
  title: string;
  mediaItemId: string;
  duration: number;
  path: string;
  type: MediaType;
  tags: Tag[];
}
