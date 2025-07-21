export interface IHoliday {
  name: string;
  tagId: string;
  holidayDates: string[];
  exclusionGenres: string[];
  seasonStartDate?: string;
  seasonEndDate?: string;
}

export class Holiday {
  name: string;
  tagId: string;
  holidayDates: string[];
  exclusionGenres: string[];
  seasonStartDate?: string;
  seasonEndDate?: string;

  constructor(
    name: string,
    tagId: string,
    holidayDates: string[],
    exclusionGenres: string[],
    seasonStartDate?: string,
    seasonEndDate?: string,
  ) {
    this.name = name;
    this.tagId = tagId;
    this.holidayDates = holidayDates;
    this.exclusionGenres = exclusionGenres;
    this.seasonStartDate = seasonStartDate;
    this.seasonEndDate = seasonEndDate;
  }

  static fromRequestObject(requestObject: any): Holiday {
    return new Holiday(
      requestObject.name,
      requestObject.tagId,
      requestObject.holidayDates,
      requestObject.exclusionGenres || [],
      requestObject.seasonStartDate,
      requestObject.seasonEndDate,
    );
  }
}