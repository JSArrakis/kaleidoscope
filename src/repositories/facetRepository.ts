import { getDB } from '../db/sqlite';
import { Facet } from '../models/facet';

export class FacetRepository {
  private get db() {
    return getDB();
  }

  // Create a new facet
  create(facet: Facet): Facet {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO facets (facetId, genre, aesthetic, relationships)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        facet.facetId,
        facet.genre,
        facet.aesthetic,
        facet.relationships ? JSON.stringify(facet.relationships) : null,
      );
    });

    transaction();
    return this.findByFacetId(facet.facetId)!;
  }

  // Find facet by facetId
  findByFacetId(facetId: string): Facet | null {
    const stmt = this.db.prepare(`SELECT * FROM facets WHERE facetId = ?`);
    const row = stmt.get(facetId) as any;
    if (!row) return null;

    return this.mapRowToFacet(row);
  }

  // Find all facets
  findAll(): Facet[] {
    const stmt = this.db.prepare(
      `SELECT * FROM facets ORDER BY genre, aesthetic`,
    );
    const rows = stmt.all() as any[];
    return rows.map(r => this.mapRowToFacet(r));
  }

  // Update facet
  update(facetId: string, facet: Facet): Facet | null {
    const stmt = this.db.prepare(`
      UPDATE facets SET genre = ?, aesthetic = ?, relationships = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE facetId = ?
    `);

    const result = stmt.run(
      facet.genre,
      facet.aesthetic,
      facet.relationships ? JSON.stringify(facet.relationships) : null,
      facetId,
    );

    if (result.changes === 0) return null;
    return this.findByFacetId(facetId);
  }

  // Delete facet
  delete(facetId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM facets WHERE facetId = ?`);
    const result = stmt.run(facetId);
    return result.changes > 0;
  }

  // --- Facet distances CRUD ---
  createDistance(
    sourceFacetId: string,
    targetFacetId: string,
    distance: number,
  ) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO facet_distances (sourceFacetId, targetFacetId, distance)
      VALUES (?, ?, ?)
    `);
    stmt.run(sourceFacetId, targetFacetId, distance);
  }

  findDistance(sourceFacetId: string, targetFacetId: string): number | null {
    const stmt = this.db.prepare(`
      SELECT distance FROM facet_distances WHERE sourceFacetId = ? AND targetFacetId = ?
    `);
    const row = stmt.get(sourceFacetId, targetFacetId) as any;
    return row ? row.distance : null;
  }

  findAllDistancesFrom(
    sourceFacetId: string,
  ): Array<{ targetFacetId: string; distance: number }> {
    const stmt = this.db.prepare(`
      SELECT targetFacetId, distance FROM facet_distances WHERE sourceFacetId = ? ORDER BY distance
    `);
    const rows = stmt.all(sourceFacetId) as any[];
    return rows.map(r => ({
      targetFacetId: r.targetFacetId,
      distance: r.distance,
    }));
  }

  updateDistance(
    sourceFacetId: string,
    targetFacetId: string,
    distance: number,
  ): boolean {
    const stmt = this.db.prepare(`
      UPDATE facet_distances SET distance = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE sourceFacetId = ? AND targetFacetId = ?
    `);
    const result = stmt.run(distance, sourceFacetId, targetFacetId);
    return result.changes > 0;
  }

  deleteDistance(sourceFacetId: string, targetFacetId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM facet_distances WHERE sourceFacetId = ? AND targetFacetId = ?`,
    );
    const result = stmt.run(sourceFacetId, targetFacetId);
    return result.changes > 0;
  }

  private mapRowToFacet(row: any): Facet {
    const relationships = row.relationships
      ? JSON.parse(row.relationships)
      : [];
    return new Facet(row.facetId, row.genre, row.aesthetic, relationships);
  }
}

export const facetRepository = new FacetRepository();
