import { getDB } from "../db/sqlite.js";
export class BumperRepository {
    get db() {
        return getDB();
    }
    create(bumper) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO bumpers (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(bumper.title, bumper.mediaItemId, bumper.duration || null, bumper.path);
            this.insertTags(bumper.mediaItemId, bumper.tags);
        });
        transaction();
        return this.findByMediaItemId(bumper.mediaItemId);
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM bumpers WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToBumper(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM bumpers ORDER BY title`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToBumper(row));
    }
    findRandomBumper() {
        const stmt = this.db.prepare(`SELECT * FROM bumpers ORDER BY RANDOM() LIMIT 1`);
        const row = stmt.get();
        if (!row)
            return null;
        return this.mapRowToBumper(row);
    }
    findByTag(tagId) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT b.* FROM bumpers b
      JOIN bumper_tags bt ON b.mediaItemId = bt.mediaItemId
      WHERE bt.tagId = ?
      ORDER BY b.title
    `);
        const rows = stmt.all(tagId);
        return rows.map((row) => this.mapRowToBumper(row));
    }
    update(mediaItemId, bumper) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE bumpers 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(bumper.title, bumper.duration || null, bumper.path, mediaItemId);
            if (result.changes === 0)
                return null;
            this.db
                .prepare("DELETE FROM bumper_tags WHERE mediaItemId = ?")
                .run(mediaItemId);
            this.insertTags(mediaItemId, bumper.tags);
        });
        transaction();
        return this.findByMediaItemId(mediaItemId);
    }
    delete(mediaItemId) {
        const stmt = this.db.prepare(`DELETE FROM bumpers WHERE mediaItemId = ?`);
        const result = stmt.run(mediaItemId);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM bumpers`);
        const result = stmt.get();
        return result.count;
    }
    insertTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`INSERT INTO bumper_tags (mediaItemId, tagId) VALUES (?, ?)`);
        for (const tag of tags) {
            stmt.run(mediaItemId, tag.tagId);
        }
    }
    mapRowToBumper(row) {
        const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN bumper_tags bt ON t.tagId = bt.tagId
      WHERE bt.mediaItemId = ?
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
export const bumperRepository = new BumperRepository();
