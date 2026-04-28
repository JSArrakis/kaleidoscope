import { getDB } from "../db/sqlite.js";
export class EpisodeProgressionRepository {
    get db() {
        return getDB();
    }
    create(progression) {
        const stmt = this.db.prepare(`
      INSERT INTO episode_progression (show_media_item_id, stream_type, current_episode, last_played_timestamp, next_episode_duration_limit, next_episode_over_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(progression.showItemId, progression.streamType, progression.currentEpisodeNumber ?? 0, progression.lastPlayedTimestamp ?? 0, progression.nextEpisodeDurationLimit ?? 0, progression.nextEpisodeOverDuration ? 1 : 0);
        return this.findById(result.lastInsertRowid);
    }
    findById(id) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progression WHERE id = ?`);
        const row = stmt.get(id);
        if (!row)
            return null;
        return this.mapRowToProgression(row);
    }
    findByShowAndStreamType(showItemId, streamType) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progression WHERE show_media_item_id = ? AND stream_type = ?`);
        const row = stmt.get(showItemId, streamType);
        if (!row)
            return null;
        return this.mapRowToProgression(row);
    }
    findByShow(showItemId) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progression WHERE show_media_item_id = ? ORDER BY stream_type`);
        const rows = stmt.all(showItemId);
        return rows.map((row) => this.mapRowToProgression(row));
    }
    findByStreamType(streamType) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progression WHERE stream_type = ?`);
        const rows = stmt.all(streamType);
        return rows.map((row) => this.mapRowToProgression(row));
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM episode_progression ORDER BY last_played_timestamp DESC`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToProgression(row));
    }
    updateEpisodeNumber(id, currentEpisodeNumber) {
        const stmt = this.db.prepare(`
      UPDATE episode_progression 
      SET current_episode = ?, last_played_timestamp = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        stmt.run(currentEpisodeNumber, Date.now(), id);
        return this.findById(id);
    }
    upsertByShowAndStreamType(showItemId, streamType, currentEpisodeNumber) {
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
    resetProgression(id) {
        const stmt = this.db.prepare(`
      UPDATE episode_progression 
      SET current_episode = 0, last_played_timestamp = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        const result = stmt.run(id);
        if (result.changes === 0)
            return null;
        return this.findById(id);
    }
    delete(id) {
        const stmt = this.db.prepare(`DELETE FROM episode_progression WHERE id = ?`);
        const result = stmt.run(id);
        return result.changes > 0;
    }
    deleteByShowAndStreamType(showItemId, streamType) {
        const stmt = this.db.prepare(`DELETE FROM episode_progression WHERE show_media_item_id = ? AND stream_type = ?`);
        const result = stmt.run(showItemId, streamType);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM episode_progression`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToProgression(row) {
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
