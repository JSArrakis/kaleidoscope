import mongoose, { Model } from 'mongoose';

export interface IAgeGroup {
  tagId: string;
  name: string;
  sequence: number;
}

export const AgeGroupSchema = new mongoose.Schema({
  tagId: String,
  name: String,
  sequence: Number,
});

export class AgeGroup {
  tagId: string;
  name: string;
  sequence: number;

  constructor(tagId: string, name: string, sequence: number) {
    this.tagId = tagId;
    this.name = name;
    this.sequence = sequence;
  }

  static fromMongoObject(mongoObject: any): AgeGroup {
    return new AgeGroup(
      mongoObject.tagId,
      mongoObject.name,
      mongoObject.sequence,
    );
  }

  static toMongoObject(AgeGroup: AgeGroup): any {
    return {
      tagId: AgeGroup.tagId,
      name: AgeGroup.name,
      sequence: AgeGroup.sequence,
    };
  }

  static fromRequestObject(requestObject: any): AgeGroup {
    return new AgeGroup(
      requestObject.tagId,
      requestObject.name,
      requestObject.sequence,
    );
  }
}

export const AgeGroupModel: Model<IAgeGroup> = mongoose.model<IAgeGroup>(
  'AgeGroup',
  AgeGroupSchema,
);