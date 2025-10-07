export interface IFacet {
  facetId: string;
  genre: string;
  aesthetic: string;
  relationships: IFacetRelationship[];
}

export interface IFacetRelationship {
  facetId: string;
  distance: number;
}

export class FacetRelationship {
  facetId: string;
  distance: number;
  constructor(facetId: string, distance: number) {
    this.facetId = facetId;
    this.distance = distance;
  }
}

export class Facet {
  facetId: string;
  genre: string;
  aesthetic: string;
  relationships: FacetRelationship[];
  constructor(
    facetId: string,
    genre: string,
    aesthetic: string,
    relationships: FacetRelationship[],
  ) {
    this.facetId = facetId;
    this.genre = genre;
    this.aesthetic = aesthetic;
    this.relationships = relationships;
  }

  static fromRequestObject(requestObject: any): Facet {
    return new Facet(
      requestObject.facetId,
      requestObject.genre,
      requestObject.aesthetic,
      requestObject.relationships.map(
        (rel: any) => new FacetRelationship(rel.facetId, rel.distance),
      ),
    );
  }

  static fromDatabaseObject(dbObject: any): Facet {
    return new Facet(
      dbObject.facetId,
      dbObject.genre,
      dbObject.aesthetic,
      dbObject.relationships.map(
        (rel: any) => new FacetRelationship(rel.facetId, rel.distance),
      ),
    );
  }

  toDatabaseObject(): any {
    return {
      facetId: this.facetId,
      genre: this.genre,
      aesthetic: this.aesthetic,
      relationships: this.relationships,
    };
  }
}
