import { getDB } from "../db/sqlite.js";

export class EpisodeProgressionRepository {
  private get db() {
    return getDB();
  }

  create(progression: EpisodeProgression): EpisodeProgression {
    const stmt = this.db.prepare(`
      INSERT INTO episode_progression (show_media_item_id, stream_type, current_episode, last_played_timestamp, next_episode_duration_limit, next_episode_over_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      progression.showItemId,
      progression.streamType,
      progression.currentEpisodeNumber ?? 0,
      progression.lastPlayedTimestamp ?? 0,
      progression.nextEpisodeDurationLimit ?? 0,
      progression.nextEpisodeOverDuration ? 1 : 0,
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(id: number): EpisodeProgression | null {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progression WHERE id = ?`,
    );
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapRowToProgression(row);
  }

  findByShowAndStreamType(
    showItemId: string,
    streamType: StreamType,
  ): EpisodeProgression | null {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progression WHERE show_media_item_id = ? AND stream_type = ?`,
    );
    const row = stmt.get(showItemId, streamType) as any;
    if (!row) return null;
    return this.mapRowToProgression(row);
  }

  findByShow(showItemId: string): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progression WHERE show_media_item_id = ? ORDER BY stream_type`,
    );
    const rows = stmt.all(showItemId) as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  findByStreamType(streamType: StreamType): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progression WHERE stream_type = ?`,
    );
    const rows = stmt.all(streamType) as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  findAll(): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progression ORDER BY last_played_timestamp DESC`,
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  updateEpisodeNumber(
    id: number,
    currentEpisodeNumber: number,
  ): EpisodeProgression | null {
    const stmt = this.db.prepare(`
      UPDATE episode_progression 
      SET current_episode = ?, last_played_timestamp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(currentEpisodeNumber, Date.now(), id);
    return this.findById(id);
  }

  upsertByShowAndStreamType(
    showItemId: string,
    streamType: StreamType,
    currentEpisodeNumber: number,
  ): EpisodeProgression | null {
    const stmt = this.db.prepare(`
      INSERT INTO episode_progression (show_media_item_id, stream_type, current_episode, last_played_timestamp)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(show_media_item_id, stream_type) DO UPDATE SET
        current_episode = excluded.current_episode,
        last_played_timestamp = excluded.last_played_timestamp,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(showItemId, streamType, currentEpisodeNumber, Date.now());
    return this.findByShowAndStreamType(showItemId, streamType);
  }

  resetProgression(id: number): EpisodeProgression | null {
    const stmt = this.db.prepare(`
      UPDATE episode_progression 
      SET current_episode = 0, last_played_timestamp = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(id);
    if (result.changes === 0) return null;
    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM episode_progression WHERE id = ?`,
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteByShowAndStreamType(
    showItemId: string,
    streamType: StreamType,
  ): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM episode_progression WHERE show_media_item_id = ? AND stream_type = ?`,
    );
    const result = stmt.run(showItemId, streamType);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM episode_progression`,
    );
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToProgression(row: any): EpisodeProgression {
    return {
      id: row.id,
      showItemId: row.show_media_item_id,
      streamType: row.stream_type,
      currentEpisodeNumber: row.current_episode,
      lastPlayedTimestamp: row.last_played_timestamp,
      nextEpisodeDurationLimit: row.next_episode_duration_limit,
      nextEpisodeOverDuration: !!row.next_episode_over_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const episodeProgressionRepository = new EpisodeProgressionRepository();
