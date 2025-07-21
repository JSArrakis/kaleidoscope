import { getDB } from '../db/sqlite';
import { Music } from '../models/music';

export class MusicRepository {
  private get db() {
    return getDB();
  }
  create(music: Music): Music {
    const stmt = this.db.prepare(`
      INSERT INTO music (title, artist, mediaItemId, duration, path, type, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      music.title,
      music.artist,
      music.mediaItemId,
      music.duration,
      music.path,
      music.type,
      JSON.stringify(music.tags),
    );

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
    return rows.map(row => this.mapRowToMusic(row));
  }

  update(mediaItemId: string, music: Music): Music | null {
    const stmt = this.db.prepare(`
        UPDATE music
        SET title = ?, artist = ?, duration = ?, path = ?, type = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

    const result = stmt.run(
      music.title,
      music.artist,
      music.duration,
      music.path,
      music.type,
      JSON.stringify(music.tags),
      mediaItemId,
    );

    return result.changes > 0 ? this.findByMediaItemId(mediaItemId) : null;
  }

  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM music WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  private mapRowToMusic(row: any): Music {
    return new Music(
      row.title,
      row.artist,
      row.mediaItemId,
      row.duration,
      row.path,
      row.type,
      JSON.parse(row.tags || '[]'),
    );
  }
}

export const musicRepository = new MusicRepository();
