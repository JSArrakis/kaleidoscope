export interface IAgeGroup {
  tagId: string;
  name: string;
  sequence: number;
}

export class AgeGroup {
  tagId: string;
  name: string;
  sequence: number;

  constructor(tagId: string, name: string, sequence: number) {
    this.tagId = tagId;
    this.name = name;
    this.sequence = sequence;
  }

  static fromRequestObject(requestObject: any): AgeGroup {
    return new AgeGroup(
      requestObject.tagId,
      requestObject.name,
      requestObject.sequence,
    );
  }
}