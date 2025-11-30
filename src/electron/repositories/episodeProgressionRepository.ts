import { getDB } from "../db/sqlite.js";

export class EpisodeProgressionRepository {
  private get db() {
    return getDB();
  }

  create(progression: EpisodeProgression): EpisodeProgression {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO episode_progressions (episodeProgressionId, showItemId, streamType, currentEpisodeNumber, totalEpisodes, lastPlayedDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        progression.episodeProgressionId,
        progression.showItemId,
        progression.streamType,
        progression.currentEpisodeNumber || null,
        progression.totalEpisodes || null,
        progression.lastPlayedDate || null
      );
    });

    transaction();
    return this.findByProgressionId(progression.episodeProgressionId)!;
  }

  findByProgressionId(episodeProgressionId: string): EpisodeProgression | null {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progressions WHERE episodeProgressionId = ?`
    );
    const row = stmt.get(episodeProgressionId) as any;
    if (!row) return null;
    return this.mapRowToProgression(row);
  }

  findByShowAndStreamType(
    showItemId: string,
    streamType: string
  ): EpisodeProgression | null {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progressions WHERE showItemId = ? AND streamType = ?`
    );
    const row = stmt.get(showItemId, streamType) as any;
    if (!row) return null;
    return this.mapRowToProgression(row);
  }

  findByShow(showItemId: string): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progressions WHERE showItemId = ? ORDER BY streamType`
    );
    const rows = stmt.all(showItemId) as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  findByStreamType(streamType: string): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progressions WHERE streamType = ? ORDER BY lastPlayedDate DESC`
    );
    const rows = stmt.all(streamType) as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  findAll(): EpisodeProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM episode_progressions ORDER BY lastPlayedDate DESC`
    );
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  updateEpisodeNumber(
    episodeProgressionId: string,
    currentEpisodeNumber: number,
    totalEpisodes?: number
  ): EpisodeProgression | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE episode_progressions 
        SET currentEpisodeNumber = ?, lastPlayedDate = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE episodeProgressionId = ?
      `);

      stmt.run(currentEpisodeNumber, episodeProgressionId);

      if (totalEpisodes !== undefined) {
        const totalStmt = this.db.prepare(
          `UPDATE episode_progressions SET totalEpisodes = ? WHERE episodeProgressionId = ?`
        );
        totalStmt.run(totalEpisodes, episodeProgressionId);
      }
    });

    transaction();
    return this.findByProgressionId(episodeProgressionId);
  }

  resetProgression(episodeProgressionId: string): EpisodeProgression | null {
    const stmt = this.db.prepare(`
      UPDATE episode_progressions 
      SET currentEpisodeNumber = NULL, lastPlayedDate = NULL, updatedAt = CURRENT_TIMESTAMP
      WHERE episodeProgressionId = ?
    `);

    const result = stmt.run(episodeProgressionId);
    if (result.changes === 0) return null;

    return this.findByProgressionId(episodeProgressionId);
  }

  delete(episodeProgressionId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM episode_progressions WHERE episodeProgressionId = ?`
    );
    const result = stmt.run(episodeProgressionId);
    return result.changes > 0;
  }

  deleteByShowAndStreamType(showItemId: string, streamType: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM episode_progressions WHERE showItemId = ? AND streamType = ?`
    );
    const result = stmt.run(showItemId, streamType);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM episode_progressions`
    );
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToProgression(row: any): EpisodeProgression {
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
