"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Facet = exports.FacetRelationship = void 0;
class FacetRelationship {
    constructor(facetId, distance) {
        this.facetId = facetId;
        this.distance = distance;
    }
}
exports.FacetRelationship = FacetRelationship;
class Facet {
    constructor(facetId, genre, aesthetic, relationships) {
        this.facetId = facetId;
        this.genre = genre;
        this.aesthetic = aesthetic;
        this.relationships = relationships;
    }
    static fromRequestObject(requestObject) {
        return new Facet(requestObject.facetId, requestObject.genre, // Expect Tag object from request
        requestObject.aesthetic, // Expect Tag object from request
        requestObject.relationships.map((rel) => new FacetRelationship(rel.facetId, rel.distance)));
    }
    static fromDatabaseObject(dbObject) {
        return new Facet(dbObject.facetId, dbObject.genre, // Will be Tag object from repository join
        dbObject.aesthetic, // Will be Tag object from repository join
        dbObject.relationships.map((rel) => new FacetRelationship(rel.facetId, rel.distance)));
    }
    toDatabaseObject() {
        return {
            facetId: this.facetId,
            genre: this.genre,
            aesthetic: this.aesthetic,
            relationships: this.relationships,
        };
    }
}
exports.Facet = Facet;
