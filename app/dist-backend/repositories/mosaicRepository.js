"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mosaicRepository = exports.MosaicRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const mosaic_1 = require("../models/mosaic");
class MosaicRepository {
    constructor(database) {
        this.database = database;
    }
    // Create a new mosaic
    create(mosaic) {
        const stmt = this.database.prepare(`
      INSERT INTO mosaics (mosaicId, facetId, musicalGenres, name, description)
      VALUES (?, ?, ?, ?, ?)
    `);
        const dbObj = mosaic.toDatabaseObject();
        stmt.run(dbObj.mosaicId, dbObj.facetId, dbObj.musicalGenres, dbObj.name, dbObj.description);
        return mosaic;
    }
    // Find mosaic by ID
    findByMosaicId(mosaicId) {
        const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE mosaicId = ?
    `);
        const row = stmt.get(mosaicId);
        if (!row)
            return null;
        return mosaic_1.Mosaic.fromDatabaseObject(row);
    }
    // Find all mosaics for a specific facet
    findByFacetId(facetId) {
        const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE facetId = ?
    `);
        const rows = stmt.all(facetId);
        return rows.map(row => mosaic_1.Mosaic.fromDatabaseObject(row));
    }
    // Find mosaics that contain any of the specified musical genres
    findByMusicalGenres(musicalGenres) {
        if (musicalGenres.length === 0)
            return [];
        // Build query to search within JSON array
        const placeholders = musicalGenres.map(() => '?').join(',');
        const conditions = musicalGenres
            .map(() => "JSON_EXTRACT(musicalGenres, '$') LIKE '%' || ? || '%'")
            .join(' OR ');
        const stmt = this.database.prepare(`
      SELECT * FROM mosaics 
      WHERE ${conditions}
    `);
        const rows = stmt.all(...musicalGenres);
        return rows.map(row => mosaic_1.Mosaic.fromDatabaseObject(row));
    }
    // Find mosaics by multiple facet IDs (for when we have multiple facets from adjacent media)
    findByFacetIds(facetIds) {
        if (facetIds.length === 0)
            return [];
        const placeholders = facetIds.map(() => '?').join(',');
        const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE facetId IN (${placeholders})
    `);
        const rows = stmt.all(...facetIds);
        return rows.map(row => mosaic_1.Mosaic.fromDatabaseObject(row));
    }
    // Get all mosaics
    findAll() {
        const stmt = this.database.prepare('SELECT * FROM mosaics');
        const rows = stmt.all();
        return rows.map(row => mosaic_1.Mosaic.fromDatabaseObject(row));
    }
    // Update an existing mosaic
    update(mosaic) {
        const stmt = this.database.prepare(`
      UPDATE mosaics 
      SET facetId = ?, musicalGenres = ?, name = ?, description = ?
      WHERE mosaicId = ?
    `);
        const dbObj = mosaic.toDatabaseObject();
        const result = stmt.run(dbObj.facetId, dbObj.musicalGenres, dbObj.name, dbObj.description, dbObj.mosaicId);
        return result.changes > 0;
    }
    // Delete a mosaic
    delete(mosaicId) {
        const stmt = this.database.prepare('DELETE FROM mosaics WHERE mosaicId = ?');
        const result = stmt.run(mosaicId);
        return result.changes > 0;
    }
    // Find mosaics that contain ALL of the specified musical genres
    findByAllMusicalGenres(musicalGenres) {
        if (musicalGenres.length === 0)
            return [];
        const conditions = musicalGenres
            .map(() => "JSON_EXTRACT(musicalGenres, '$') LIKE '%' || ? || '%'")
            .join(' AND ');
        const stmt = this.database.prepare(`
      SELECT * FROM mosaics 
      WHERE ${conditions}
    `);
        const rows = stmt.all(...musicalGenres);
        return rows.map(row => mosaic_1.Mosaic.fromDatabaseObject(row));
    }
    // Get count of mosaics
    count() {
        const stmt = this.database.prepare('SELECT COUNT(*) as count FROM mosaics');
        const result = stmt.get();
        return result.count;
    }
}
exports.MosaicRepository = MosaicRepository;
// Create and export singleton instance
exports.mosaicRepository = new MosaicRepository((0, sqlite_1.getDB)());
