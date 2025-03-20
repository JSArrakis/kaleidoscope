export class SegmentedTags {
  eraTags: string[];
  genreTags: string[];
  specialtyTags: string[];
  ageGroupTags: string[];
  holidayTags: string[];

  constructor(
    eraTags: string[],
    genreTags: string[],
    specialtyTags: string[],
    ageGroupTags: string[],
    holidayTags: string[],
  ) {
    this.eraTags = eraTags;
    this.genreTags = genreTags;
    this.specialtyTags = specialtyTags;
    this.ageGroupTags = ageGroupTags;
    this.holidayTags = holidayTags;
  }
}
