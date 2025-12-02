import { getDB } from "../db/sqlite.js";

export class MusicRepository {
  private get db() {
    return getDB();
  }

  create(music: Music): Music {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO music (title, mediaItemId, artist, duration, path)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        music.title,
        music.mediaItemId,
        music.artist || null,
        music.duration || null,
        music.path
      );
      this.insertTags(music.mediaItemId, music.tags);
    });

    transaction();
    return this.findByMediaItemId(music.mediaItemId)!;
  }

  findByMediaItemId(mediaItemId: string): Music | null {
    const stmt = this.db.prepare(`SELECT * FROM music WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToMusic(row);
  }

  findAll(): Music[] {
    const stmt = this.db.prepare(`SELECT * FROM music ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToMusic(row));
  }

  findRandomMusic(): Music | null {
    const stmt = this.db.prepare(
      `SELECT * FROM music ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToMusic(row);
  }

  findByTag(tagId: string): Music[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM music m
      JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ?
      ORDER BY m.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToMusic(row));
  }

  update(mediaItemId: string, music: Music): Music | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE music 
        SET title = ?, artist = ?, duration = ?, path = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        music.title,
        music.artist || null,
        music.duration || null,
        music.path,
        mediaItemId
      );
      if (result.changes === 0) return null;

      this.db
        .prepare("DELETE FROM music_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertTags(mediaItemId, music.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM music WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM music`);
    const result = stmt.get() as any;
    return result.count;
  }

  private insertTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;
    const stmt = this.db.prepare(
      `INSERT INTO music_tags (mediaItemId, tagId) VALUES (?, ?)`
    );
    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId);
    }
  }

  private mapRowToMusic(row: any): Music {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN music_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
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
      artist: row.artist,
      path: row.path,
      duration: row.duration,
      type: MediaType.Music,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const musicRepository = new MusicRepository();
