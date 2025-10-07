import { TagType } from './const/tagTypes';

export interface ITag {
  tagId: string;
  name: string;
  type: TagType;
  // Holiday-specific fields (optional)
  holidayDates?: string[];
  exclusionGenres?: string[];
  seasonStartDate?: string;
  seasonEndDate?: string;
  // Age Group-specific fields (optional)
  sequence?: number;
}

export class Tag {
  tagId: string;
  name: string;
  type: TagType;
  // Holiday-specific fields
  holidayDates?: string[];
  exclusionGenres?: string[];
  seasonStartDate?: string;
  seasonEndDate?: string;
  // Age Group-specific fields
  sequence?: number;

  constructor(
    tagId: string,
    name: string,
    type: TagType,
    holidayDates?: string[],
    exclusionGenres?: string[],
    seasonStartDate?: string,
    seasonEndDate?: string,
    sequence?: number,
  ) {
    this.tagId = tagId;
    this.name = name;
    this.type = type;
    this.holidayDates = holidayDates;
    this.exclusionGenres = exclusionGenres;
    this.seasonStartDate = seasonStartDate;
    this.seasonEndDate = seasonEndDate;
    this.sequence = sequence;
  }

  static fromRequestObject(requestObject: any): Tag {
    return new Tag(
      requestObject.tagId,
      requestObject.name,
      requestObject.type,
      requestObject.holidayDates,
      requestObject.exclusionGenres,
      requestObject.seasonStartDate,
      requestObject.seasonEndDate,
      requestObject.sequence,
    );
  }

  // Helper methods to check tag type
  isHoliday(): boolean {
    return this.type === TagType.Holiday;
  }

  isAgeGroup(): boolean {
    return this.type === TagType.AgeGroup;
  }

  isRegularTag(): boolean {
    return [
      TagType.Aesthetic,
      TagType.Era,
      TagType.Genre,
      TagType.Specialty,
    ].includes(this.type);
  }
}
