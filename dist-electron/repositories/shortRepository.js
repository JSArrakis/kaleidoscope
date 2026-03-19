import { getDB } from "../db/sqlite.js";
export class ShortRepository {
    get db() {
        return getDB();
    }
    create(short) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO shorts (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(short.title, short.mediaItemId, short.duration || null, short.path);
            this.insertTags(short.mediaItemId, short.tags);
        });
        transaction();
        return this.findByMediaItemId(short.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM shorts WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToShort(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToShort(row));
    }
    findRandomShort() {
        const stmt = this.db.prepare(`SELECT * FROM shorts ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToShort(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT s.* FROM shorts s
      JOIN short_tags st ON s.mediaItemId = st.mediaItemId
      WHERE st.tagId = ?
      ORDER BY s.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToShort(row));
    }
    update(mediaItemId, short) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE shorts 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(short.title, short.duration || null, short.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM short_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, short.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM shorts WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shorts`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO short_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    mapRowToShort(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN short_tags st ON t.tagId = st.tagId
      WHERE st.mediaItemId = ?
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
export const shortRepository = new ShortRepository();
