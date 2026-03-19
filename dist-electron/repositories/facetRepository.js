import { getDB } from "../db/sqlite.js";
export class FacetRepository {
    get db() {
        return getDB();
    }
    create(facet) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO facets (facetId, genreTagId, aestheticTagId, distanceFromGenre, distanceFromAesthetic)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(facet.facetId, facet.genreTagId || null, facet.aestheticTagId || null, facet.distanceFromGenre || null, facet.distanceFromAesthetic || null);
        });
        transaction();
        return this.findByFacetId(facet.facetId);
    }
    findByFacetId(facetId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE facetId = ?`);
        const row = stmt.get(facetId);
        if (!row)
            return null;
        return this.mapRowToFacet(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM facets ORDER BY facetId`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToFacet(row));
    }
    findByGenre(genreTagId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE genreTagId = ? ORDER BY distanceFromGenre`);
        const rows = stmt.all(genreTagId);
        return rows.map((row) => this.mapRowToFacet(row));
    }
    findByAesthetic(aestheticTagId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE aestheticTagId = ? ORDER BY distanceFromAesthetic`);
        const rows = stmt.all(aestheticTagId);
        return rows.map((row) => this.mapRowToFacet(row));
    }
    findByGenreAndAesthetic(genreTagId, aestheticTagId) {
        const stmt = this.db.prepare(`SELECT * FROM facets WHERE genreTagId = ? AND aestheticTagId = ?`);
        const row = stmt.get(genreTagId, aestheticTagId);
        if (!row)
            return null;
        return this.mapRowToFacet(row);
    }
    update(facetId, facet) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE facets 
        SET genreTagId = ?, aestheticTagId = ?, distanceFromGenre = ?, distanceFromAesthetic = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE facetId = ?
      `);
            const result = stmt.run(facet.genreTagId || null, facet.aestheticTagId || null, facet.distanceFromGenre || null, facet.distanceFromAesthetic || null, facetId);
            if (result.changes === 0)
                return null;
        });
        transaction();
        return this.findByFacetId(facetId);
    }
    delete(facetId) {
        const stmt = this.db.prepare(`DELETE FROM facets WHERE facetId = ?`);
        const result = stmt.run(facetId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM facets`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToFacet(row) {
        let genre;
        let aesthetic;
        if (row.genreTagId) {
            const genreStmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
            const genreRow = genreStmt.get(row.genreTagId);
            if (genreRow) {
                genre = {
                    tagId: genreRow.tagId,
                    name: genreRow.name,
                    type: genreRow.type,
                    seasonStartDate: genreRow.seasonStartDate,
                    seasonEndDate: genreRow.seasonEndDate,
                    explicitlyHoliday: genreRow.explicitlyHoliday === 1,
                    sequence: genreRow.sequence,
                };
            }
        }
        if (row.aestheticTagId) {
            const aestheticStmt = this.db.prepare(`SELECT * FROM tags WHERE tagId = ?`);
            const aestheticRow = aestheticStmt.get(row.aestheticTagId);
            if (aestheticRow) {
                aesthetic = {
                    tagId: aestheticRow.tagId,
                    name: aestheticRow.name,
                    type: aestheticRow.type,
                    seasonStartDate: aestheticRow.seasonStartDate,
                    seasonEndDate: aestheticRow.seasonEndDate,
                    explicitlyHoliday: aestheticRow.explicitlyHoliday === 1,
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
