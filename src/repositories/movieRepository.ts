import { getDB } from '../db/sqlite';
import { Movie, CollectionReference } from '../models/movie';

export class MovieRepository {
  private get db() {
    return getDB();
  }

  // Create a new movie
  create(movie: Movie): Movie {
    const stmt = this.db.prepare(`
      INSERT INTO movies (title, mediaItemId, alias, imdb, tags, path, duration, durationLimit, collections)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      movie.title,
      movie.mediaItemId,
      movie.alias,
      movie.imdb,
      JSON.stringify(movie.tags),
      movie.path,
      movie.duration,
      movie.durationLimit,
      JSON.stringify(movie.collections),
    );

    return this.findByMediaItemId(movie.mediaItemId)!;
  }

  // Create multiple movies in a transaction
  createMany(movies: Movie[]): Movie[] {
    const stmt = this.db.prepare(`
      INSERT INTO movies (title, mediaItemId, alias, imdb, tags, path, duration, durationLimit, collections)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((moviesToInsert: Movie[]) => {
      const results: Movie[] = [];
      for (const movie of moviesToInsert) {
        try {
          stmt.run(
            movie.title,
            movie.mediaItemId,
            movie.alias,
            movie.imdb,
            JSON.stringify(movie.tags),
            movie.path,
            movie.duration,
            movie.durationLimit,
            JSON.stringify(movie.collections),
          );
          const created = this.findByMediaItemId(movie.mediaItemId);
          if (created) results.push(created);
        } catch (error) {
          // Skip duplicates or other errors
          console.warn(`Failed to insert movie ${movie.mediaItemId}:`, error);
        }
      }
      return results;
    });

    return transaction(movies);
  }

  // Find movie by mediaItemId
  findByMediaItemId(mediaItemId: string): Movie | null {
    const stmt = this.db.prepare(`
      SELECT * FROM movies WHERE mediaItemId = ?
    `);

    const row = stmt.get(mediaItemId) as any;
    if (!row) return null;

    return this.mapRowToMovie(row);
  }

  // Find all movies
  findAll(): Movie[] {
    const stmt = this.db.prepare(`
      SELECT * FROM movies ORDER BY title
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToMovie(row));
  }

  // Update movie
  update(mediaItemId: string, movie: Movie): Movie | null {
    const stmt = this.db.prepare(`
      UPDATE movies 
      SET title = ?, alias = ?, imdb = ?, tags = ?, path = ?, duration = ?, durationLimit = ?, collections = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE mediaItemId = ?
    `);

    const result = stmt.run(
      movie.title,
      movie.alias,
      movie.imdb,
      JSON.stringify(movie.tags),
      movie.path,
      movie.duration,
      movie.durationLimit,
      JSON.stringify(movie.collections),
      mediaItemId,
    );

    if (result.changes === 0) return null;
    return this.findByMediaItemId(mediaItemId);
  }

  // Delete movie
  delete(mediaItemId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM movies WHERE mediaItemId = ?
    `);

    const result = stmt.run(mediaItemId);
    return result.changes > 0;
  }

  // Find movies by tags
  findByTags(tags: string[]): Movie[] {
    const placeholders = tags.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM movies 
      WHERE ${tags.map((_, index) => `tags LIKE ?`).join(' OR ')}
      ORDER BY title
    `);

    const params = tags.map(tag => `%"${tag}"%`);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToMovie(row));
  }

  // Count all movies
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM movies`);
    const result = stmt.get() as any;
    return result.count;
  }

  private mapRowToMovie(row: any): Movie {
    const collections = row.collections ? JSON.parse(row.collections) : [];
    return new Movie(
      row.title,
      row.mediaItemId,
      row.alias,
      row.imdb,
      JSON.parse(row.tags || '[]'),
      row.path,
      row.duration,
      row.durationLimit,
      collections.map(
        (c: any) => new CollectionReference(c.mediaItemId, c.title, c.sequence),
      ),
    );
  }
}

// Export singleton instance
export const movieRepository = new MovieRepository();
