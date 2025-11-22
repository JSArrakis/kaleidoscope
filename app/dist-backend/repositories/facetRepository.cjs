"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facetRepository = exports.FacetRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const facet_1 = require("../models/facet.cjs");
const tag_1 = require("../models/tag.cjs");
class FacetRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Create a new facet
    create(facet) {
        const transaction = this.db.transaction(() => {
            // Insert into facets table
            const facetStmt = this.db.prepare(`
        INSERT INTO facets (facetId, relationships)
        VALUES (?, ?)
      `);
            facetStmt.run(facet.facetId, facet.relationships ? JSON.stringify(facet.relationships) : null);
            // Insert genre tag relationship
            const genreStmt = this.db.prepare(`
        INSERT INTO facet_tags (facetId, tagId, tagType)
        VALUES (?, ?, 'genre')
      `);
            genreStmt.run(facet.facetId, facet.genre.tagId);
            // Insert aesthetic tag relationship
            const aestheticStmt = this.db.prepare(`
        INSERT INTO facet_tags (facetId, tagId, tagType)
        VALUES (?, ?, 'aesthetic')
      `);
            aestheticStmt.run(facet.facetId, facet.aesthetic.tagId);
        });
        transaction();
        return this.findByFacetId(facet.facetId);
    }
    // Find facet by facetId
    findByFacetId(facetId) {
        const stmt = this.db.prepare(`
      SELECT 
        f.facetId,
        f.relationships,
        gt.tagId as genreTagId, gt.name as genreName, gt.type as genreType,
        gt.seasonStartDate as genreSeasonStartDate, gt.seasonEndDate as genreSeasonEndDate,
        gt.explicitlyHoliday as genreExplicitlyHoliday, gt.sequence as genreSequence,
        at.tagId as aestheticTagId, at.name as aestheticName, at.type as aestheticType,
        at.seasonStartDate as aestheticSeasonStartDate, at.seasonEndDate as aestheticSeasonEndDate,
        at.explicitlyHoliday as aestheticExplicitlyHoliday, at.sequence as aestheticSequence
      FROM facets f
      JOIN facet_tags gft ON f.facetId = gft.facetId AND gft.tagType = 'genre'
      JOIN tags gt ON gft.tagId = gt.tagId
      JOIN facet_tags aft ON f.facetId = aft.facetId AND aft.tagType = 'aesthetic'
      JOIN tags at ON aft.tagId = at.tagId
      WHERE f.facetId = ?
    `);
        const row = stmt.get(facetId);
        if (!row)
            return null;
        return this.mapRowToFacet(row);
    }
    // Find all facets
    findAll() {
        const stmt = this.db.prepare(`
      SELECT 
        f.facetId,
        f.relationships,
        gt.tagId as genreTagId, gt.name as genreName, gt.type as genreType,
        gt.seasonStartDate as genreSeasonStartDate, gt.seasonEndDate as genreSeasonEndDate,
        gt.explicitlyHoliday as genreExplicitlyHoliday, gt.sequence as genreSequence,
        at.tagId as aestheticTagId, at.name as aestheticName, at.type as aestheticType,
        at.seasonStartDate as aestheticSeasonStartDate, at.seasonEndDate as aestheticSeasonEndDate,
        at.explicitlyHoliday as aestheticExplicitlyHoliday, at.sequence as aestheticSequence
      FROM facets f
      JOIN facet_tags gft ON f.facetId = gft.facetId AND gft.tagType = 'genre'
      JOIN tags gt ON gft.tagId = gt.tagId
      JOIN facet_tags aft ON f.facetId = aft.facetId AND aft.tagType = 'aesthetic'
      JOIN tags at ON aft.tagId = at.tagId
      ORDER BY gt.name, at.name
    `);
        const rows = stmt.all();
        return rows.map(r => this.mapRowToFacet(r));
    }
    // Update facet
    update(facetId, facet) {
        const transaction = this.db.transaction(() => {
            // Update facets table
            const facetStmt = this.db.prepare(`
        UPDATE facets SET relationships = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE facetId = ?
      `);
            facetStmt.run(facet.relationships ? JSON.stringify(facet.relationships) : null, facetId);
            // Update genre tag relationship
            const genreStmt = this.db.prepare(`
        UPDATE facet_tags SET tagId = ? 
        WHERE facetId = ? AND tagType = 'genre'
      `);
            genreStmt.run(facet.genre.tagId, facetId);
            // Update aesthetic tag relationship
            const aestheticStmt = this.db.prepare(`
        UPDATE facet_tags SET tagId = ? 
        WHERE facetId = ? AND tagType = 'aesthetic'
      `);
            aestheticStmt.run(facet.aesthetic.tagId, facetId);
        });
        transaction();
        return this.findByFacetId(facetId);
    }
    // Delete facet
    delete(facetId) {
        const stmt = this.db.prepare(`DELETE FROM facets WHERE facetId = ?`);
        const result = stmt.run(facetId);
        return result.changes > 0;
    }
    // --- Facet distances CRUD ---
    createDistance(sourceFacetId, targetFacetId, distance) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO facet_distances (sourceFacetId, targetFacetId, distance)
      VALUES (?, ?, ?)
    `);
        stmt.run(sourceFacetId, targetFacetId, distance);
    }
    findDistance(sourceFacetId, targetFacetId) {
        const stmt = this.db.prepare(`
      SELECT distance FROM facet_distances WHERE sourceFacetId = ? AND targetFacetId = ?
    `);
        const row = stmt.get(sourceFacetId, targetFacetId);
        return row ? row.distance : null;
    }
    findAllDistancesFrom(sourceFacetId) {
        const stmt = this.db.prepare(`
      SELECT targetFacetId, distance FROM facet_distances WHERE sourceFacetId = ? ORDER BY distance
    `);
        const rows = stmt.all(sourceFacetId);
        return rows.map(r => ({
            targetFacetId: r.targetFacetId,
            distance: r.distance,
        }));
    }
    updateDistance(sourceFacetId, targetFacetId, distance) {
        const stmt = this.db.prepare(`
      UPDATE facet_distances SET distance = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE sourceFacetId = ? AND targetFacetId = ?
    `);
        const result = stmt.run(distance, sourceFacetId, targetFacetId);
        return result.changes > 0;
    }
    deleteDistance(sourceFacetId, targetFacetId) {
        const stmt = this.db.prepare(`DELETE FROM facet_distances WHERE sourceFacetId = ? AND targetFacetId = ?`);
        const result = stmt.run(sourceFacetId, targetFacetId);
        return result.changes > 0;
    }
    // Select a random facet combination that has available media
    // Returns facet with both genre and aesthetic that has either movies or show episodes with matching tags
    // durationWindow: maximum duration limit allowed for selected media
    // For shows, also ensures the next episode in progression is not over the duration limit
    selectValidRandomFacetCombo(durationWindow, testDb) {
        // Use test database if provided, otherwise use the production database
        const database = testDb || this.db;
        // SQL query to find facets that have available media
        // This query finds facets where there are either:
        // 1. Movies with both the genre and aesthetic tags and durationLimit <= durationWindow
        // 2. Shows with at least one episode that has both genre and aesthetic tags and durationLimit <= durationWindow
        //    AND where the next episode in progression is not over the duration limit
        const query = `
      WITH facet_info AS (
        SELECT 
          f.facetId,
          genre_tag.tagId as genre_tag_id,
          genre_tag_data.name as genre_name,
          aesthetic_tag.tagId as aesthetic_tag_id,
          aesthetic_tag_data.name as aesthetic_name
        FROM facets f
        INNER JOIN facet_tags genre_tag ON f.facetId = genre_tag.facetId AND genre_tag.tagType = 'genre'
        INNER JOIN facet_tags aesthetic_tag ON f.facetId = aesthetic_tag.facetId AND aesthetic_tag.tagType = 'aesthetic'
        INNER JOIN tags genre_tag_data ON genre_tag.tagId = genre_tag_data.tagId
        INNER JOIN tags aesthetic_tag_data ON aesthetic_tag.tagId = aesthetic_tag_data.tagId
      ),
      valid_facets AS (
        SELECT DISTINCT fi.facetId, fi.genre_name, fi.aesthetic_name
        FROM facet_info fi
        WHERE EXISTS (
          -- Check for movies with both genre and aesthetic tags and durationLimit <= durationWindow
          SELECT 1
          FROM media_tags mt1
          INNER JOIN media_tags mt2 ON mt1.mediaItemId = mt2.mediaItemId
          INNER JOIN movies m ON mt1.mediaItemId = m.mediaItemId
          WHERE mt1.tagId = fi.genre_tag_id 
            AND mt2.tagId = fi.aesthetic_tag_id
            AND m.durationLimit <= ?
        )
        OR EXISTS (
          -- Check for shows with episodes that have both genre and aesthetic tags and durationLimit <= durationWindow
          -- Also ensure the next episode in progression is not over duration
          SELECT 1
          FROM episode_tags et1
          INNER JOIN episode_tags et2 ON et1.mediaItemId = et2.mediaItemId
          INNER JOIN episodes e ON et1.mediaItemId = e.mediaItemId
          INNER JOIN shows s ON e.showId = s.id
          LEFT JOIN episode_progression ep ON s.mediaItemId = ep.show_media_item_id AND ep.stream_type = 'Cont'
          WHERE et1.tagId = fi.genre_tag_id 
            AND et2.tagId = fi.aesthetic_tag_id
            AND s.firstEpisodeOverDuration = 0
            AND e.durationLimit <= ?
            AND (ep.next_episode_over_duration IS NULL OR ep.next_episode_over_duration = 0)
        )
      )
      SELECT facetId, genre_name, aesthetic_name, COUNT(*) as facet_count
      FROM valid_facets 
      GROUP BY facetId, genre_name, aesthetic_name
      ORDER BY RANDOM() 
      LIMIT 1;
    `;
        try {
            const stmt = database.prepare(query);
            const result = stmt.get(durationWindow, durationWindow);
            if (result) {
                console.log(`[Facet Repository] Selected valid facet via SQL: ${result.genre_name}/${result.aesthetic_name} (verified with media)`);
                // Use the existing findByFacetId method to get the full Facet object
                return this.findByFacetId(result.facetId);
            }
            else {
                console.log('[Facet Repository] No valid facets found with available media via SQL');
                return null;
            }
        }
        catch (error) {
            console.error('[Facet Repository] Error executing facet selection query:', error);
            return null;
        }
    }
    mapRowToFacet(row) {
        const relationships = row.relationships
            ? JSON.parse(row.relationships)
            : [];
        // Create genre Tag object
        const genreTag = new tag_1.Tag(row.genreTagId, row.genreName, row.genreType, row.genreSeasonStartDate ? [row.genreSeasonStartDate] : undefined, undefined, // exclusionTags
        row.genreSeasonStartDate, row.genreSeasonEndDate, row.genreExplicitlyHoliday, row.genreSequence);
        // Create aesthetic Tag object
        const aestheticTag = new tag_1.Tag(row.aestheticTagId, row.aestheticName, row.aestheticType, row.aestheticSeasonStartDate ? [row.aestheticSeasonStartDate] : undefined, undefined, // exclusionTags
        row.aestheticSeasonStartDate, row.aestheticSeasonEndDate, row.aestheticExplicitlyHoliday, row.aestheticSequence);
        return new facet_1.Facet(row.facetId, genreTag, aestheticTag, relationships);
    }
}
exports.FacetRepository = FacetRepository;
exports.facetRepository = new FacetRepository();
