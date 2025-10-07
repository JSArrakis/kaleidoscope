import { MediaTag } from './const/tagTypes';

export class SegmentedTags {
  eraTags: MediaTag[];
  genreTags: MediaTag[];
  specialtyTags: MediaTag[];
  ageGroupTags: MediaTag[];
  holidayTags: MediaTag[];

  constructor(
    eraTags: MediaTag[],
    genreTags: MediaTag[],
    specialtyTags: MediaTag[],
    ageGroupTags: MediaTag[],
    holidayTags: MediaTag[],
  ) {
    this.eraTags = eraTags;
    this.genreTags = genreTags;
    this.specialtyTags = specialtyTags;
    this.ageGroupTags = ageGroupTags;
    this.holidayTags = holidayTags;
  }
}
