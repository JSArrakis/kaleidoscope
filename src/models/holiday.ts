import mongoose, { Model } from 'mongoose';

export interface IHoliday {
  name: string;
  seasonStartDate: Date;
  seasonEndDate: Date;
  holidayDate: Date;
}

export const HolidaySchema = new mongoose.Schema({
  name: String,
  seasonStartDate: Date,
  seasonEndDate: Date,
  holidayDate: Date,
});

export class Holiday {
  name: string;
  seasonStartDate: Date;
  seasonEndDate: Date;
  holidayDate: Date;

  constructor(
    name: string,
    seasonStartDate: Date,
    seasonEndDate: Date,
    holidayDate: Date,
  ) {
    this.name = name;
    this.seasonStartDate = seasonStartDate;
    this.seasonEndDate = seasonEndDate;
    this.holidayDate = holidayDate;
  }

  static fromMongoObject(mongoObject: any): Holiday {
    return new Holiday(
      mongoObject.name,
      mongoObject.seasonStartDate,
      mongoObject.seasonEndDate,
      mongoObject.holidayDate,
    );
  }

  static toMongoObject(holiday: Holiday): any {
    return {
      name: holiday.name,
      seasonStartDate: holiday.seasonStartDate,
      seasonEndDate: holiday.seasonEndDate,
      holidayDate: holiday.holidayDate,
    };
  }

  static fromRequestObject(requestObject: any): Holiday {
    return new Holiday(
      requestObject.name,
      requestObject.seasonStartDate,
      requestObject.seasonEndDate,
      requestObject.holidayDate,
    );
  }
}

export const HolidayModel: Model<IHoliday> = mongoose.model<IHoliday>(
  'Holiday',
  HolidaySchema,
);
