import { getDB } from "../db/sqlite.js";
export class CommercialRepository {
    get db() {
        return getDB();
    }
    create(commercial) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO commercials (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(commercial.title, commercial.mediaItemId, commercial.duration || null, commercial.path);
            this.insertTags(commercial.mediaItemId, commercial.tags);
        });
        transaction();
        return this.findByMediaItemId(commercial.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM commercials WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToCommercial(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM commercials ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToCommercial(row));
    }
    findRandomCommercial() {
        const stmt = this.db.prepare(`SELECT * FROM commercials ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToCommercial(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT c.* FROM commercials c
      JOIN commercial_tags ct ON c.mediaItemId = ct.mediaItemId
      WHERE ct.tagId = ?
      ORDER BY c.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToCommercial(row));
    }
    update(mediaItemId, commercial) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE commercials 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(commercial.title, commercial.duration || null, commercial.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM commercial_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, commercial.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM commercials WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM commercials`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO commercial_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    mapRowToCommercial(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN commercial_tags ct ON t.tagId = ct.tagId
      WHERE ct.mediaItemId = ?
      ORDER BY t.name
    `);
        const tagRows = tagsStmt.all(row.mediaItemId);
        const tags = tagRows.map((tagRow) => ({
            tagId: tagRow.tagId,
            name: tagRow.name,
            type: tagRow.type,
            seasonStartDate: tagRow.seasonStartDate,
            seasonEndDate: tagRow.seasonEndDate,
            explicitlyHoliday: tagRow.explicitlyHoliday === 1,
            sequence: tagRow.sequence,
        }));
        return {
            mediaItemId: row.mediaItemId,
            title: row.title,
            path: row.path,
            duration: row.duration,
            tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const commercialRepository = new CommercialRepository();
