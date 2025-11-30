import { getDB } from "../db/sqlite.js";
import { Tag } from "./tagsRepository.js";

export interface Bumper {
  mediaItemId: string;
  title: string;
  path: string;
  duration?: number;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
}

export class BumperRepository {
  private get db() {
    return getDB();
  }

  create(bumper: Bumper): Bumper {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO bumpers (title, mediaItemId, duration, path)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        bumper.title,
        bumper.mediaItemId,
        bumper.duration || null,
        bumper.path
      );
      this.insertTags(bumper.mediaItemId, bumper.tags);
    });

    transaction();
    return this.findByMediaItemId(bumper.mediaItemId)!;
  }

  findByMediaItemId(mediaItemId: string): Bumper | null {
    const stmt = this.db.prepare(`SELECT * FROM bumpers WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToBumper(row);
  }

  findAll(): Bumper[] {
    const stmt = this.db.prepare(`SELECT * FROM bumpers ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToBumper(row));
  }

  findRandomBumper(): Bumper | null {
    const stmt = this.db.prepare(
      `SELECT * FROM bumpers ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToBumper(row);
  }

  findByTag(tagId: string): Bumper[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT b.* FROM bumpers b
      JOIN bumper_tags bt ON b.mediaItemId = bt.mediaItemId
      WHERE bt.tagId = ?
      ORDER BY b.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToBumper(row));
  }

  update(mediaItemId: string, bumper: Bumper): Bumper | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE bumpers 
        SET title = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        bumper.title,
        bumper.duration || null,
        bumper.path,
        mediaItemId
      );
      if (result.changes === 0) return null;

      this.db
        .prepare("DELETE FROM bumper_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertTags(mediaItemId, bumper.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM bumpers WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM bumpers`);
    const result = stmt.get() as any;
    return result.count;
  }

  private insertTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO bumper_tags (mediaItemId, tagId) VALUES (?, ?)`
    );
    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId);
    }
  }

  private mapRowToBumper(row: any): Bumper {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN bumper_tags bt ON t.tagId = bt.tagId
      WHERE bt.mediaItemId = ?
      ORDER BY t.name
    `);

    const tagRows = tagsStmt.all(row.mediaItemId) as any[];
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
