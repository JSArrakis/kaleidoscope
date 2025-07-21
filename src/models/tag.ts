export interface ITag {
  tagId: string;
  name: string;
  type: string;
}

export class Tag {
  tagId: string;
  name: string;
  type: string;

  constructor(tagId: string, name: string, type: string) {
    this.tagId = tagId;
    this.name = name;
    this.type = type;
  }

  static fromRequestObject(requestObject: any): Tag {
    return new Tag(requestObject.tagId, requestObject.name, requestObject.type);
  }
}
