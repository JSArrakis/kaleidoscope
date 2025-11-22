export interface IHoliday {
  name: string;
  tagId: string;
  type: string;
  holidayDates: string[];
  exclusionTags: string[];
  seasonStartDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  seasonEndDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
}

export class Holiday {
  name: string;
  tagId: string;
  holidayDates: string[];
  exclusionTags: string[];
  seasonStartDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)
  seasonEndDate?: string; // ISO datetime string (YYYY-MM-DD HH:MM:SS)

  constructor(
    name: string,
    tagId: string,
    holidayDates: string[],
    exclusionTags: string[],
    seasonStartDate?: string,
    seasonEndDate?: string,
  ) {
    this.name = name;
    this.tagId = tagId;
    this.holidayDates = holidayDates;
    this.exclusionTags = exclusionTags;
    this.seasonStartDate = seasonStartDate;
    this.seasonEndDate = seasonEndDate;
  }

  static fromRequestObject(requestObject: any): Holiday {
    return new Holiday(
      requestObject.name,
      requestObject.tagId,
      requestObject.holidayDates,
      requestObject.exclusionTags || [],
      requestObject.seasonStartDate,
      requestObject.seasonEndDate,
    );
  }
}
