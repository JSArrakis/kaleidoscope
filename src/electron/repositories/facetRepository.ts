import { getDB } from "../db/sqlite.js";

export class FacetRepository {
  private get db() {
    return getDB();
  }

  create(facet: Facet): Facet {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO facets (facetId, genreTagId, aestheticTagId, distanceFromGenre, distanceFromAesthetic)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        facet.facetId,
        facet.genreTagId || null,
        facet.aestheticTagId || null,
        facet.distanceFromGenre || null,
        facet.distanceFromAesthetic || null
      );
    });

    transaction();
    return this.findByFacetId(facet.facetId)!;
  }

  findByFacetId(facetId: string): Facet | null {
    const stmt = this.db.prepare(`SELECT * FROM facets WHERE facetId = ?`);
    const row = stmt.get(facetId) as any;
    if (!row) return null;
    return this.mapRowToFacet(row);
  }

  findAll(): Facet[] {
    const stmt = this.db.prepare(`SELECT * FROM facets ORDER BY facetId`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToFacet(row));
  }

  findByGenre(genreTagId: string): Facet[] {
    const stmt = this.db.prepare(
      `SELECT * FROM facets WHERE genreTagId = ? ORDER BY distanceFromGenre`
    );
    const rows = stmt.all(genreTagId) as any[];
    return rows.map((row) => this.mapRowToFacet(row));
  }

  findByAesthetic(aestheticTagId: string): Facet[] {
    const stmt = this.db.prepare(
      `SELECT * FROM facets WHERE aestheticTagId = ? ORDER BY distanceFromAesthetic`
    );
    const rows = stmt.all(aestheticTagId) as any[];
    return rows.map((row) => this.mapRowToFacet(row));
  }

  findByGenreAndAesthetic(
    genreTagId: string,
    aestheticTagId: string
  ): Facet | null {
    const stmt = this.db.prepare(
      `SELECT * FROM facets WHERE genreTagId = ? AND aestheticTagId = ?`
    );
    const row = stmt.get(genreTagId, aestheticTagId) as any;
    if (!row) return null;
    return this.mapRowToFacet(row);
  }

  update(facetId: string, facet: Facet): Facet | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE facets 
        SET genreTagId = ?, aestheticTagId = ?, distanceFromGenre = ?, distanceFromAesthetic = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE facetId = ?
      `);

      const result = stmt.run(
        facet.genreTagId || null,
        facet.aestheticTagId || null,
        facet.distanceFromGenre || null,
        facet.distanceFromAesthetic || null,
        facetId
      );

      if (result.changes === 0) return null;
    });

    transaction();
    return this.findByFacetId(facetId);
  }

  delete(facetId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM facets WHERE facetId = ?`);
    const result = stmt.run(facetId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM facets`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToFacet(row: any): Facet {
    let genre: Tag | undefined;
    let aesthetic: Tag | undefined;

    if (row.genreTagId) {
      const genreStmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
      const genreRow = genreStmt.get(row.genreTagId) as any;
      if (genreRow) {
        genre = {
          tagId: genreRow.tagId,
          name: genreRow.name,
          type: genreRow.type,
          seasonStartDate: genreRow.seasonStartDate,
          seasonEndDate: genreRow.seasonEndDate,
          sequence: genreRow.sequence,
        };
      }
    }

    if (row.aestheticTagId) {
      const aestheticStmt = this.db.prepare(
        `SELECT * FROM tags WHERE tagId = ?`
      );
      const aestheticRow = aestheticStmt.get(row.aestheticTagId) as any;
      if (aestheticRow) {
        aesthetic = {
          tagId: aestheticRow.tagId,
          name: aestheticRow.name,
          type: aestheticRow.type,
          seasonStartDate: aestheticRow.seasonStartDate,
          seasonEndDate: aestheticRow.seasonEndDate,
          sequence: aestheticRow.sequence,
        };
      }
    }

    return {
      facetId: row.facetId,
      genreTagId: row.genreTagId,
      aestheticTagId: row.aestheticTagId,
      genre,
      aesthetic,
      distanceFromGenre: row.distanceFromGenre,
      distanceFromAesthetic: row.distanceFromAesthetic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const facetRepository = new FacetRepository();
