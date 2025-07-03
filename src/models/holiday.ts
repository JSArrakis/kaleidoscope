import mongoose, { Model } from 'mongoose';

export interface IHoliday {
  name: string;
  tagId: string;
  holidayDates: string[];
  exclusionGenres: string[];
  seasonStartDate?: string;
  seasonEndDate?: string;
}

export const HolidaySchema = new mongoose.Schema({
  name: String,
  tagId: {
    type: String,
    index: true,
  },
  holidayDates: [String],
  exclusionGenres: [String],
  seasonStartDate: String,
  seasonEndDate: String,
});

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

  static fromMongoObject(mongoObject: any): Holiday {
    return new Holiday(
      mongoObject.name,
      mongoObject.tagId,
      mongoObject.holidayDates,
      mongoObject.exclusionGenres || [],
      mongoObject.seasonStartDate,
      mongoObject.seasonEndDate,
    );
  }

  static toMongoObject(holiday: Holiday): any {
    return {
      name: holiday.name,
      tagId: holiday.tagId,
      holidayDates: holiday.holidayDates,
      exclusionGenres: holiday.exclusionGenres || [],
      seasonStartDate: holiday.seasonStartDate,
      seasonEndDate: holiday.seasonEndDate,
    };
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

export const HolidayModel: Model<IHoliday> = mongoose.model<IHoliday>(
  'Holiday',
  HolidaySchema,
);
