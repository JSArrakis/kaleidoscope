import { getDB } from '../db/sqlite';
import { Show, Episode } from '../models/show';

export class ShowRepository {
  private get db() {
    return getDB();
  }

  // Create a new show with episodes
  create(show: Show): Show {
    const transaction = this.db.transaction(() => {
      // Insert show
      const showStmt = this.db.prepare(`
        INSERT INTO shows (title, mediaItemId, alias, imdb, durationLimit, overDuration, firstEpisodeOverDuration, tags, secondaryTags, episodeCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const showResult = showStmt.run(
        show.title,
        show.mediaItemId,
        show.alias,
        show.imdb,
        show.durationLimit,
        show.overDuration ? 1 : 0,
        show.firstEpisodeOverDuration ? 1 : 0,
        JSON.stringify(show.tags),
        JSON.stringify(show.secondaryTags),
        show.episodeCount,
      );

      const showId = showResult.lastInsertRowid as number;
      const showItemId = show.mediaItemId;

      // Insert episodes
      if (show.episodes && show.episodes.length > 0) {
        const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const episode of show.episodes) {
          episodeStmt.run(
            showId,
            episode.season,
            episode.episode,
            episode.episodeNumber,
            episode.path,
            episode.title,
            episode.mediaItemId,
            showItemId,
            episode.duration,
            episode.durationLimit,
            JSON.stringify(episode.tags),
          );
        }
      }

      return showId;
    });

    const showId = transaction();
    return this.findByMediaItemId(show.mediaItemId)!;
  }

  // Find show by mediaItemId
  findByMediaItemId(mediaItemId: string): Show | null {
    const showStmt = this.db.prepare(`
      SELECT * FROM shows WHERE mediaItemId = ?
    `);

    const showRow = showStmt.get(mediaItemId) as any;
    if (!showRow) return null;

    const episodesStmt = this.db.prepare(`
      SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
    `);

    const episodeRows = episodesStmt.all(showRow.id) as any[];

    return this.mapRowToShow(showRow, episodeRows);
  }

  // Find all shows
  findAll(): Show[] {
    const showsStmt = this.db.prepare(`
      SELECT * FROM shows ORDER BY title
    `);

    const showRows = showsStmt.all() as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);

      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  // Update show
  update(mediaItemId: string, show: Show): Show | null {
    const transaction = this.db.transaction(() => {
      // Update show
      const showStmt = this.db.prepare(`
        UPDATE shows 
        SET title = ?, alias = ?, imdb = ?, durationLimit = ?, overDuration = ?, firstEpisodeOverDuration = ?, tags = ?, secondaryTags = ?, episodeCount = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const showResult = showStmt.run(
        show.title,
        show.alias,
        show.imdb,
        show.durationLimit,
        show.overDuration ? 1 : 0,
        show.firstEpisodeOverDuration ? 1 : 0,
        JSON.stringify(show.tags),
        JSON.stringify(show.secondaryTags),
        show.episodeCount,
        mediaItemId,
      );

      if (showResult.changes === 0) return false;

      // Get show ID
      const showIdStmt = this.db.prepare(
        `SELECT id FROM shows WHERE mediaItemId = ?`,
      );
      const showIdRow = showIdStmt.get(mediaItemId) as any;
      const showId = showIdRow.id;

      // Delete existing episodes
      const deleteEpisodesStmt = this.db.prepare(
        `DELETE FROM episodes WHERE showId = ?`,
      );
      deleteEpisodesStmt.run(showId);

      const showItemId = show.mediaItemId;

      // Insert new episodes
      if (show.episodes && show.episodes.length > 0) {
        const episodeStmt = this.db.prepare(`
          INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, showItemId, duration, durationLimit, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const episode of show.episodes) {
          episodeStmt.run(
            showId,
            episode.season,
            episode.episode,
            episode.episodeNumber,
            episode.path,
            episode.title,
            episode.mediaItemId,
            showItemId,
            episode.duration,
            episode.durationLimit,
            JSON.stringify(episode.tags),
          );
        }
      }

      return true;
    });

    const success = transaction();
    return success ? this.findByMediaItemId(mediaItemId) : null;
  }

  // Delete show
  delete(mediaItemId: string): boolean {
    const transaction = this.db.transaction(() => {
      // Get show ID first
      const showIdStmt = this.db.prepare(
        `SELECT id FROM shows WHERE mediaItemId = ?`,
      );
      const showIdRow = showIdStmt.get(mediaItemId) as any;

      if (!showIdRow) return false;

      // Delete episodes (foreign key constraint will handle this automatically, but being explicit)
      const deleteEpisodesStmt = this.db.prepare(
        `DELETE FROM episodes WHERE showId = ?`,
      );
      deleteEpisodesStmt.run(showIdRow.id);

      // Delete show
      const deleteShowStmt = this.db.prepare(
        `DELETE FROM shows WHERE mediaItemId = ?`,
      );
      const result = deleteShowStmt.run(mediaItemId);

      return result.changes > 0;
    });

    return transaction();
  }

  // Find shows by tags
  findByTags(tags: string[]): Show[] {
    const stmt = this.db.prepare(`
      SELECT * FROM shows 
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY title
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const showRows = stmt.all(...params) as any[];

    const shows: Show[] = [];
    for (const showRow of showRows) {
      const episodesStmt = this.db.prepare(`
        SELECT * FROM episodes WHERE showId = ? ORDER BY episodeNumber, episode
      `);

      const episodeRows = episodesStmt.all(showRow.id) as any[];
      shows.push(this.mapRowToShow(showRow, episodeRows));
    }

    return shows;
  }

  // Count all shows
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM shows`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToShow(showRow: any, episodeRows: any[]): Show {
    const episodes = episodeRows.map(
      episodeRow =>
        new Episode(
          episodeRow.season,
          episodeRow.episode,
          episodeRow.episodeNumber,
          episodeRow.path,
          episodeRow.title,
          episodeRow.mediaItemId,
          episodeRow.showItemId,
          episodeRow.duration,
          episodeRow.durationLimit,
          JSON.parse(episodeRow.tags || '[]'),
        ),
    );

    return new Show(
      showRow.title,
      showRow.mediaItemId,
      showRow.alias,
      showRow.imdb,
      showRow.durationLimit,
      Boolean(showRow.overDuration),
      Boolean(showRow.firstEpisodeOverDuration),
      JSON.parse(showRow.tags || '[]'),
      JSON.parse(showRow.secondaryTags || '[]'),
      showRow.episodeCount,
      episodes,
    );
  }
}

// Export singleton instance
export const showRepository = new ShowRepository();
