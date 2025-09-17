import { Tag } from './tag';

export interface IFacet {
  source: Tag[];
  targets: Tag[][];
}

export class Facet {
  source: Tag[];
  targets: Tag[][];

  constructor(
    source: Tag[],
    targets: Tag[][],
  ) {
    this.source = source;
    this.targets = targets;
  }

  static async fromRequestObject(requestObject: any): Promise<Facet> {

    return new Facet(
      requestObject.source,
      requestObject.targets,
    );
  }
}
