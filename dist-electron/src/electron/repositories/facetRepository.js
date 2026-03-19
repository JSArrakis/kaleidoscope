import { getDB } from "../db/sqlite.js";
import { randomUUID } from "crypto";
export class FacetRepository {
    get db() {
        return getDB();
    }
    /**
     * Create a new facet with the given genre and aesthetic tags
     */
    create(facet) {
        const transaction = this.db.transaction(() => {
            const facetId = randomUUID();
            const stmt = this.db.prepare(`
        INSERT INTO facets (facetId, genreId, aestheticId)
        VALUES (?, ?, ?)
      `);
            stmt.run(facetId, facet.genre?.tagId || null, facet.aesthetic?.tagId || null);
        });
        transaction();
        const createdFacet = this.findByFacetId(randomUUID());
        return createdFacet;
    }
    /**
     * Find a facet by its ID with all relationships loaded
     */
    findByFacetId(facetId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE facetId = ?`);
        const row = stmt.get(facetId);
        if (!row)
            return null;
        return this.mapRowToFacet(row);
    }
    /**
     * Find all facets
     */
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM facets ORDER BY facetId`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToFacet(row));
    }
    /**
     * Find all facets with a specific genre tag
     */
    findByGenreId(genreId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE genreId = ?`);
        const rows = stmt.all(genreId);
        return rows.map((row) => this.mapRowToFacet(row));
    }
    /**
     * Find all facets with a specific aesthetic tag
     */
    findByAestheticId(aestheticId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE aestheticId = ?`);
        const rows = stmt.all(aestheticId);
        return rows.map((row) => this.mapRowToFacet(row));
    }
    /**
     * Find a facet by genre and aesthetic tag IDs
     */
    findByGenreAndAestheticId(genreId, aestheticId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE genreId = ? AND aestheticId = ?`);
        const row = stmt.get(genreId, aestheticId);
        if (!row)
            return null;
        return this.mapRowToFacet(row);
    }
    /**
     * Update a facet's genre and aesthetic tags
     */
    update(facetId, facet) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE facets 
        SET genreId = ?, aestheticId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE facetId = ?
      `);
            const result = stmt.run(facet.genre?.tagId || null, facet.aesthetic?.tagId || null, facetId);
            if (result.changes === 0)
                return null;
        });
        transaction();
        return this.findByFacetId(facetId);
    }
    /**
     * Delete a facet (cascades to relationships)
     */
    delete(facetId) {
        const stmt = this.db.prepare(`DELETE FROM facets WHERE facetId = ?`);
        const result = stmt.run(facetId);
        return result.changes > 0;
    }
    /**
     * Add a relationship between two facets with a distance metric
     */
    addRelationship(sourceFacetId, targetFacetId, distance) {
        const stmt = this.db.prepare(`
      INSERT INTO facet_distances (sourceFacetId, targetFacetId, distance)
      VALUES (?, ?, ?)
      ON CONFLICT(sourceFacetId, targetFacetId) DO UPDATE SET distance = ?
    `);
        stmt.run(sourceFacetId, targetFacetId, distance, distance);
    }
    /**
     * Get all relationships for a facet
     */
    getRelationships(facetId) {
        const stmt = this.db.prepare(`
      SELECT 
        fd.targetFacetId as facetId,
        fd.distance,
        f.genreId,
        f.aestheticId
      FROM facet_distances fd
      JOIN facets f ON fd.targetFacetId = f.facetId
      WHERE fd.sourceFacetId = ?
      ORDER BY fd.distance ASC
    `);
        const rows = stmt.all(facetId);
        return rows.map((row) => this.mapRowToRelationshipItem(row));
    }
    /**
     * Delete a relationship between two facets
     */
    deleteRelationship(sourceFacetId, targetFacetId) {
        const stmt = this.db.prepare(`DELETE FROM facet_distances WHERE sourceFacetId = ? AND targetFacetId = ?`);
        const result = stmt.run(sourceFacetId, targetFacetId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM facets`);
        const result = stmt.get();
        return result.count;
    }
    /**
     * Map a facet row from the database to a Facet object with relationships
     */
    mapRowToFacet(row) {
        const genre = this.getTagById(row.genreId);
        const aesthetic = this.getTagById(row.aestheticId);
        const facetRelationships = this.getRelationships(row.facetId);
        return {
            facetId: row.facetId,
            genre,
            aesthetic,
            facetRelationships,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    /**
     * Map a relationship row to a FacetRelationshipItem
     */
    mapRowToRelationshipItem(row) {
        const genre = this.getTagById(row.genreId);
        const aesthetic = this.getTagById(row.aestheticId);
        return {
            facetId: row.facetId,
            genre,
            aesthetic,
            distance: row.distance,
        };
    }
    /**
     * Helper to get a tag by ID
     */
    getTagById(tagId) {
        if (!tagId)
            return null;
        const stmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
        const row = stmt.get(tagId);
        if (!row)
            return null;
        return {
            tagId: row.tagId,
            name: row.name,
            type: row.type,
            seasonStartDate: row.seasonStartDate,
            seasonEndDate: row.seasonEndDate,
            sequence: row.sequence,
        };
    }
}
export const facetRepository = new FacetRepository();
