import { Tag } from './tag';

export class SegmentedTags {
  eraTags: Tag[];
  genreTags: Tag[];
  aestheticTags: Tag[];
  specialtyTags: Tag[];
  ageGroupTags: Tag[];
  holidayTags: Tag[];

  constructor(
    eraTags: Tag[],
    genreTags: Tag[],
    aestheticTags: Tag[],
    specialtyTags: Tag[],
    ageGroupTags: Tag[],
    holidayTags: Tag[],
  ) {
    this.eraTags = eraTags;
    this.genreTags = genreTags;
    this.aestheticTags = aestheticTags;
    this.specialtyTags = specialtyTags;
    this.ageGroupTags = ageGroupTags;
    this.holidayTags = holidayTags;
  }
}
