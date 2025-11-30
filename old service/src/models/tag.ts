import { TagType } from './const/tagTypes';

export interface ITag {
  tagId: string;
  name: string;
  type: TagType;
  // Holiday-specific fields (optional)
  holidayDates?: string[];
  exclusionTags?: string[]; // tagIds of tags to exclude during this holiday
  seasonStartDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  seasonEndDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  explicitlyHoliday?: boolean; // if true, content should only play during holiday periods
  // Age Group-specific fields (optional)
  sequence?: number;
}

export class Tag {
  tagId: string;
  name: string;
  type: TagType;
  // Holiday-specific fields
  holidayDates?: string[];
  exclusionTags?: string[]; // tagIds of tags to exclude during this holiday
  seasonStartDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  seasonEndDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  explicitlyHoliday?: boolean; // if true, content should only play during holiday periods
  // Age Group-specific fields
  sequence?: number;

  constructor(
    tagId: string,
    name: string,
    type: TagType,
    holidayDates?: string[],
    exclusionTags?: string[],
    seasonStartDate?: string,
    seasonEndDate?: string,
    explicitlyHoliday?: boolean,
    sequence?: number,
  ) {
    this.tagId = tagId;
    this.name = name;
    this.type = type;
    this.holidayDates = holidayDates;
    this.exclusionTags = exclusionTags;
    this.seasonStartDate = seasonStartDate;
    this.seasonEndDate = seasonEndDate;
    this.explicitlyHoliday = explicitlyHoliday;
    this.sequence = sequence;
  }

  static fromRequestObject(requestObject: any): Tag {
    return new Tag(
      requestObject.tagId,
      requestObject.name,
      requestObject.type,
      requestObject.holidayDates,
      requestObject.exclusionTags,
      requestObject.seasonStartDate,
      requestObject.seasonEndDate,
      requestObject.explicitlyHoliday,
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

  // Helper method for holiday content restrictions
  isExplicitlyHoliday(): boolean {
    return this.explicitlyHoliday === true;
  }

  // Helper method to check if content can play outside holiday periods
  canPlayAnytime(): boolean {
    return !this.isExplicitlyHoliday();
  }
}
