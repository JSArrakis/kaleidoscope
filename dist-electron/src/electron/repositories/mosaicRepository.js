import { getDB } from "../db/sqlite.js";
export class MosaicRepository {
    get db() {
        return getDB();
    }
    /**
     * Create a new mosaic
     */
    create(mosaic) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO mosaics (mosaicId, facetId, musicalGenres, name, description)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(mosaic.mosaicId, mosaic.facetId, JSON.stringify(mosaic.musicalGenres), mosaic.name || null, mosaic.description || null);
        });
        transaction();
        return this.findByMosaicId(mosaic.mosaicId);
    }
    /**
     * Find mosaic by ID
     */
    findByMosaicId(mosaicId) {
        const stmt = this.db.prepare(`SELECT * FROM mosaics WHERE mosaicId = ?`);
        const row = stmt.get(mosaicId);
        if (!row)
            return null;
        return this.mapRowToMosaic(row);
    }
    /**
     * Find all mosaics for a specific facet
     */
    findByFacetId(facetId) {
        const stmt = this.db.prepare(`SELECT * FROM mosaics WHERE facetId = ?`);
        const rows = stmt.all(facetId);
        return rows.map((row) => this.mapRowToMosaic(row));
    }
    /**
     * Find all mosaics
     */
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM mosaics ORDER BY name`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToMosaic(row));
    }
    /**
     * Find mosaics by multiple facet IDs
     */
    findByFacetIds(facetIds) {
        if (facetIds.length === 0)
            return [];
        const placeholders = facetIds.map(() => "?").join(",");
        const stmt = this.db.prepare(`SELECT * FROM mosaics WHERE facetId IN (${placeholders})`);
        const rows = stmt.all(...facetIds);
        return rows.map((row) => this.mapRowToMosaic(row));
    }
    /**
     * Find mosaics that contain any of the specified musical genres
     */
    findByMusicalGenres(musicalGenres) {
        if (musicalGenres.length === 0)
            return [];
        const allMosaics = this.findAll();
        return allMosaics.filter((mosaic) => musicalGenres.some((genre) => mosaic.musicalGenres.includes(genre)));
    }
    /**
     * Find mosaics that contain ALL of the specified musical genres
     */
    findByAllMusicalGenres(musicalGenres) {
        if (musicalGenres.length === 0)
            return [];
        const allMosaics = this.findAll();
        return allMosaics.filter((mosaic) => musicalGenres.every((genre) => mosaic.musicalGenres.includes(genre)));
    }
    /**
     * Update an existing mosaic
     */
    update(mosaicId, mosaic) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE mosaics 
        SET facetId = ?, musicalGenres = ?, name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mosaicId = ?
      `);
            const result = stmt.run(mosaic.facetId, JSON.stringify(mosaic.musicalGenres), mosaic.name || null, mosaic.description || null, mosaicId);
            if (result.changes === 0)
                return null;
        });
        transaction();
        return this.findByMosaicId(mosaicId);
    }
    /**
     * Delete a mosaic
     */
    delete(mosaicId) {
        const stmt = this.db.prepare(`DELETE FROM mosaics WHERE mosaicId = ?`);
        const result = stmt.run(mosaicId);
        return result.changes > 0;
    }
    /**
     * Count total mosaics
     */
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM mosaics`);
        const result = stmt.get();
        return result.count;
    }
    /**
     * Map database row to Mosaic object
     */
    mapRowToMosaic(row) {
        let musicalGenres = [];
        try {
            musicalGenres = JSON.parse(row.musicalGenres || "[]");
        }
        catch {
            musicalGenres = [];
        }
        return {
            mosaicId: row.mosaicId,
            facetId: row.facetId,
            musicalGenres,
            name: row.name,
            description: row.description,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
// Singleton instance
export const mosaicRepository = new MosaicRepository();
