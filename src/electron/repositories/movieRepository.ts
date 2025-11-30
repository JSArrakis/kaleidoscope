import { getDB } from "../db/sqlite.js";
import { tagRepository, Tag } from "./tagsRepository.js";

export interface Movie {
  mediaItemId: string;
  title: string;
  alias?: string;
  imdb?: string;
  path: string;
  duration?: number;
  durationLimit?: number;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
}

export class MovieRepository {
  private get db() {
    return getDB();
  }

  /**
   * Create a new movie
   */
  create(movie: Movie): Movie {
    const transaction = this.db.transaction(() => {
      const movieStmt = this.db.prepare(`
        INSERT INTO movies (title, mediaItemId, alias, imdb, path, duration, durationLimit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      movieStmt.run(
        movie.title,
        movie.mediaItemId,
        movie.alias || null,
        movie.imdb || null,
        movie.path,
        movie.duration || null,
        movie.durationLimit || null
      );

      // Insert tags
      this.insertMovieTags(movie.mediaItemId, movie.tags);
    });

    transaction();
    return this.findByMediaItemId(movie.mediaItemId)!;
  }

  /**
   * Find movie by mediaItemId
   */
  findByMediaItemId(mediaItemId: string): Movie | null {
    const stmt = this.db.prepare(`SELECT * FROM movies WHERE mediaItemId = ?`);
    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;
    return this.mapRowToMovie(row);
  }

  /**
   * Find all movies
   */
  findAll(): Movie[] {
    const stmt = this.db.prepare(`SELECT * FROM movies ORDER BY title`);
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToMovie(row));
  }

  /**
   * Find a random movie
   */
  findRandomMovie(): Movie | null {
    const stmt = this.db.prepare(
      `SELECT * FROM movies ORDER BY RANDOM() LIMIT 1`
    );
    const row = stmt.get() as any;
    if (!row) return null;
    return this.mapRowToMovie(row);
  }

  /**
   * Find movies by tag
   */
  findByTag(tagId: string): Movie[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = ?
      ORDER BY m.title
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row) => this.mapRowToMovie(row));
  }

  /**
   * Find movies by multiple tags (AND condition)
   */
  findByTags(tagIds: string[]): Movie[] {
    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => "?").join(",");
    const stmt = this.db.prepare(`
      SELECT m.* FROM movies m
      WHERE m.mediaItemId IN (
        SELECT mediaItemId FROM media_tags 
        WHERE tagId IN (${placeholders})
        GROUP BY mediaItemId 
        HAVING COUNT(DISTINCT tagId) = ?
      )
      ORDER BY m.title
    `);

    const rows = stmt.all(...tagIds, tagIds.length) as any[];
    return rows.map((row) => this.mapRowToMovie(row));
  }

  /**
   * Update movie
   */
  update(mediaItemId: string, movie: Movie): Movie | null {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE movies 
        SET title = ?, alias = ?, imdb = ?, path = ?, duration = ?, durationLimit = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = stmt.run(
        movie.title,
        movie.alias || null,
        movie.imdb || null,
        movie.path,
        movie.duration || null,
        movie.durationLimit || null,
        mediaItemId
      );

      if (result.changes === 0) return null;

      // Delete and re-insert tags
      this.db
        .prepare("DELETE FROM media_tags WHERE mediaItemId = ?")
        .run(mediaItemId);
      this.insertMovieTags(mediaItemId, movie.tags);
    });

    transaction();
    return this.findByMediaItemId(mediaItemId);
  }

  /**
   * Delete movie
   */
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM movies WHERE mediaItemId = ?`);
    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  /**
   * Count total movies
   */
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM movies`);
    const result = stmt.get() as any;
    return result.count;
  }

  /**
   * Insert tags for a movie
   */
  private insertMovieTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO media_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);

    for (const tag of tags) {
      stmt.run(mediaItemId, tag.tagId, tag.type);
    }
  }

  /**
   * Map database row to Movie object
   */
  private mapRowToMovie(row: any): Movie {
    const tagsStmt = this.db.prepare(`
      SELECT t.* FROM tags t
      JOIN media_tags mt ON t.tagId = mt.tagId
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
      alias: row.alias,
      imdb: row.imdb,
      path: row.path,
      duration: row.duration,
      durationLimit: row.durationLimit,
      tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Singleton instance
export const movieRepository = new MovieRepository();
