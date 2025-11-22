"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mosaic = void 0;
class Mosaic {
    constructor(mosaicId, facetId, musicalGenres, name, description) {
        this.mosaicId = mosaicId;
        this.facetId = facetId;
        this.musicalGenres = musicalGenres;
        this.name = name;
        this.description = description;
    }
    // Helper method to check if this mosaic contains a specific musical genre
    hasMusicalGenre(genreName) {
        return this.musicalGenres.includes(genreName);
    }
    // Convert from database object
    static fromDatabaseObject(dbObj) {
        return new Mosaic(dbObj.mosaicId, dbObj.facetId, JSON.parse(dbObj.musicalGenres || '[]'), // Parse JSON array from database
        dbObj.name, dbObj.description);
    }
    // Convert to database object
    toDatabaseObject() {
        return {
            mosaicId: this.mosaicId,
            facetId: this.facetId,
            musicalGenres: JSON.stringify(this.musicalGenres), // Store as JSON string
            name: this.name,
            description: this.description,
        };
    }
}
exports.Mosaic = Mosaic;
