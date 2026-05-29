import { getDB } from "../db/sqlite.js";

/**
 * Cross-media queries used by playout/runtime services.
 *
 * This repository owns aggregate reads that span multiple media tables and do
 * not belong to any single media CRUD/selection repository.
 */
export class PlayoutRepository {
  private get db() {
    return getDB();
  }

  /**
   * Returns the total duration (seconds) and count of every unique piece of
   * anchor content in the DB — one row per movie, one row per episode.
   * Episodes belonging to the same show are counted individually because each
   * one is a distinct piece of watchable content.
   */
  findAnchorContentInventory(): { totalSeconds: number; totalCount: number } {
    const stmt = this.db.prepare(`
      SELECT
        SUM(duration) AS totalSeconds,
        COUNT(*)      AS totalCount
      FROM (
        SELECT duration FROM movies  WHERE duration IS NOT NULL AND duration > 0
        UNION ALL
        SELECT duration FROM episodes WHERE duration IS NOT NULL AND duration > 0
      )
    `);

    const row = stmt.get() as {
      totalSeconds: number | null;
      totalCount: number;
    };
    return {
      totalSeconds: row.totalSeconds ?? 0,
      totalCount: row.totalCount ?? 0,
    };
  }

  findRandomAnchorGaps(count: number): number[] {
    const stmt = this.db.prepare(`
      SELECT (durationLimit - duration) AS gap
      FROM (
        SELECT duration, durationLimit
        FROM episodes
        WHERE duration IS NOT NULL
          AND durationLimit IS NOT NULL
          AND durationLimit > duration

        UNION ALL

        SELECT duration, durationLimit
        FROM movies
        WHERE duration IS NOT NULL
          AND durationLimit IS NOT NULL
          AND durationLimit > duration
      )
      ORDER BY RANDOM()
      LIMIT ?
    `);

    const rows = stmt.all(count) as Array<{ gap: number }>;
    return rows.map((row) => row.gap);
  }
}

export const playoutRepository = new PlayoutRepository();
