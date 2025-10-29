import { Database } from 'better-sqlite3';
import { getDB } from '../db/sqlite';
import { Mosaic, IMosaic } from '../models/mosaic';

export class MosaicRepository {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  // Create a new mosaic
  create(mosaic: Mosaic): Mosaic {
    const stmt = this.database.prepare(`
      INSERT INTO mosaics (mosaicId, facetId, musicalGenres, name, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const dbObj = mosaic.toDatabaseObject();
    stmt.run(
      dbObj.mosaicId,
      dbObj.facetId,
      dbObj.musicalGenres,
      dbObj.name,
      dbObj.description,
    );

    return mosaic;
  }

  // Find mosaic by ID
  findByMosaicId(mosaicId: string): Mosaic | null {
    const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE mosaicId = ?
    `);
    const row = stmt.get(mosaicId);

    if (!row) return null;
    return Mosaic.fromDatabaseObject(row);
  }

  // Find all mosaics for a specific facet
  findByFacetId(facetId: string): Mosaic[] {
    const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE facetId = ?
    `);
    const rows = stmt.all(facetId);

    return rows.map(row => Mosaic.fromDatabaseObject(row));
  }

  // Find mosaics that contain any of the specified musical genres
  findByMusicalGenres(musicalGenres: string[]): Mosaic[] {
    if (musicalGenres.length === 0) return [];

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
    return rows.map(row => Mosaic.fromDatabaseObject(row));
  }

  // Find mosaics by multiple facet IDs (for when we have multiple facets from adjacent media)
  findByFacetIds(facetIds: string[]): Mosaic[] {
    if (facetIds.length === 0) return [];

    const placeholders = facetIds.map(() => '?').join(',');
    const stmt = this.database.prepare(`
      SELECT * FROM mosaics WHERE facetId IN (${placeholders})
    `);

    const rows = stmt.all(...facetIds);
    return rows.map(row => Mosaic.fromDatabaseObject(row));
  }

  // Get all mosaics
  findAll(): Mosaic[] {
    const stmt = this.database.prepare('SELECT * FROM mosaics');
    const rows = stmt.all();

    return rows.map(row => Mosaic.fromDatabaseObject(row));
  }

  // Update an existing mosaic
  update(mosaic: Mosaic): boolean {
    const stmt = this.database.prepare(`
      UPDATE mosaics 
      SET facetId = ?, musicalGenres = ?, name = ?, description = ?
      WHERE mosaicId = ?
    `);

    const dbObj = mosaic.toDatabaseObject();
    const result = stmt.run(
      dbObj.facetId,
      dbObj.musicalGenres,
      dbObj.name,
      dbObj.description,
      dbObj.mosaicId,
    );

    return result.changes > 0;
  }

  // Delete a mosaic
  delete(mosaicId: string): boolean {
    const stmt = this.database.prepare(
      'DELETE FROM mosaics WHERE mosaicId = ?',
    );
    const result = stmt.run(mosaicId);

    return result.changes > 0;
  }

  // Find mosaics that contain ALL of the specified musical genres
  findByAllMusicalGenres(musicalGenres: string[]): Mosaic[] {
    if (musicalGenres.length === 0) return [];

    const conditions = musicalGenres
      .map(() => "JSON_EXTRACT(musicalGenres, '$') LIKE '%' || ? || '%'")
      .join(' AND ');

    const stmt = this.database.prepare(`
      SELECT * FROM mosaics 
      WHERE ${conditions}
    `);

    const rows = stmt.all(...musicalGenres);
    return rows.map(row => Mosaic.fromDatabaseObject(row));
  }

  // Get count of mosaics
  count(): number {
    const stmt = this.database.prepare('SELECT COUNT(*) as count FROM mosaics');
    const result = stmt.get() as { count: number };
    return result.count;
  }
}

// Create and export singleton instance
export const mosaicRepository = new MosaicRepository(getDB());
