import { getDB } from "../db/sqlite.js";
export class EpisodeProgressionRepository {
    get db() {
        return getDB();
    }
    create(progression) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        INSERT INTO episode_progressions (episodeProgressionId, showItemId, streamType, currentEpisodeNumber, totalEpisodes, lastPlayedDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            stmt.run(progression.episodeProgressionId, progression.showItemId, progression.streamType, progression.currentEpisodeNumber || null, progression.totalEpisodes || null, progression.lastPlayedDate || null);
        });
        transaction();
        return this.findByProgressionId(progression.episodeProgressionId);
    }
    findByProgressionId(episodeProgressionId) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progressions WHERE episodeProgressionId = ?`);
        const row = stmt.get(episodeProgressionId);
        if (!row)
            return null;
        return this.mapRowToProgression(row);
    }
    findByShowAndStreamType(showItemId, streamType) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progressions WHERE showItemId = ? AND streamType = ?`);
        const row = stmt.get(showItemId, streamType);
        if (!row)
            return null;
        return this.mapRowToProgression(row);
    }
    findByShow(showItemId) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progressions WHERE showItemId = ? ORDER BY streamType`);
        const rows = stmt.all(showItemId);
        return rows.map((row) => this.mapRowToProgression(row));
    }
    findByStreamType(streamType) {
        const stmt = this.db.prepare(`SELECT * FROM episode_progressions WHERE streamType = ? ORDER BY lastPlayedDate DESC`);
        const rows = stmt.all(streamType);
        return rows.map((row) => this.mapRowToProgression(row));
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM episode_progressions ORDER BY lastPlayedDate DESC`);
        const rows = stmt.all();
        return rows.map((row) => this.mapRowToProgression(row));
    }
    updateEpisodeNumber(episodeProgressionId, currentEpisodeNumber, totalEpisodes) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
        UPDATE episode_progressions 
        SET currentEpisodeNumber = ?, lastPlayedDate = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE episodeProgressionId = ?
      `);
            stmt.run(currentEpisodeNumber, episodeProgressionId);
            if (totalEpisodes !== undefined) {
                const totalStmt = this.db.prepare(`UPDATE episode_progressions SET totalEpisodes = ? WHERE episodeProgressionId = ?`);
                totalStmt.run(totalEpisodes, episodeProgressionId);
            }
        });
        transaction();
        return this.findByProgressionId(episodeProgressionId);
    }
    resetProgression(episodeProgressionId) {
        const stmt = this.db.prepare(`
      UPDATE episode_progressions 
      SET currentEpisodeNumber = NULL, lastPlayedDate = NULL, updatedAt = CURRENT_TIMESTAMP
      WHERE episodeProgressionId = ?
    `);
        const result = stmt.run(episodeProgressionId);
        if (result.changes === 0)
            return null;
        return this.findByProgressionId(episodeProgressionId);
    }
    delete(episodeProgressionId) {
        const stmt = this.db.prepare(`DELETE FROM episode_progressions WHERE episodeProgressionId = ?`);
        const result = stmt.run(episodeProgressionId);
        return result.changes > 0;
    }
    deleteByShowAndStreamType(showItemId, streamType) {
        const stmt = this.db.prepare(`DELETE FROM episode_progressions WHERE showItemId = ? AND streamType = ?`);
        const result = stmt.run(showItemId, streamType);
        return result.changes > 0;
    }
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM episode_progressions`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToProgression(row) {
        return {
            episodeProgressionId: row.episodeProgressionId,
            showItemId: row.showItemId,
            streamType: row.streamType,
            currentEpisodeNumber: row.currentEpisodeNumber,
            totalEpisodes: row.totalEpisodes,
            lastPlayedDate: row.lastPlayedDate,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
export const episodeProgressionRepository = new EpisodeProgressionRepository();
