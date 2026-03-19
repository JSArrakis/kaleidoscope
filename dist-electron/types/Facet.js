export class FacetRelationship {
    facetId;
    distance;
    constructor(facetId, distance) {
        this.facetId = facetId;
        this.distance = distance;
    }
}
export class Facet {
    facetId;
    genre;
    aesthetic;
    relationships;
    constructor(facetId, genre, aesthetic, relationships) {
        this.facetId = facetId;
        this.genre = genre;
        this.aesthetic = aesthetic;
        this.relationships = relationships;
    }
}
