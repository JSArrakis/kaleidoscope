import { getDB } from '../db/sqlite';
import { Movie, CollectionReference } from '../models/movie';
import { Tag } from '../models/tag';
import { MediaType } from '../models/enum/mediaTypes';
import { tagRepository } from './tagsRepository';

export class MovieRepository {
  private get db() {
    return getDB();
  }

  // Create a new movie
  create(movie: Movie): Movie {
    const transaction = this.db.transaction(() => {
      // Insert movie without tags or collections
      const movieStmt = this.db.prepare(`
        INSERT INTO movies (title, mediaItemId, alias, imdb, path, duration, durationLimit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = movieStmt.run(
        movie.title,
        movie.mediaItemId,
        movie.alias,
        movie.imdb,
        movie.path,
        movie.duration,
        movie.durationLimit,
      );

      // Insert tags
      this.insertMediaTags(movie.mediaItemId, movie.tags);
    });

    transaction();
    return this.findByMediaItemId(movie.mediaItemId)!;
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
    const transaction = this.db.transaction(() => {
      // Update movie
      const movieStmt = this.db.prepare(`
        UPDATE movies 
        SET title = ?, alias = ?, imdb = ?, path = ?, duration = ?, durationLimit = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);

      const result = movieStmt.run(
        movie.title,
        movie.alias,
        movie.imdb,
        movie.path,
        movie.duration,
        movie.durationLimit,
        mediaItemId,
      );

      if (result.changes === 0) return null;

      // Delete existing tags
      this.db
        .prepare('DELETE FROM media_tags WHERE mediaItemId = ?')
        .run(mediaItemId);

      // Insert new tags
      this.insertMediaTags(mediaItemId, movie.tags);
    });

    transaction();
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

  // Find movies by tags (accept Tag[] or string[] - resolves to tagIds)
  findByTags(tags: (Tag | string)[]): Movie[] {
    if (tags.length === 0) return [];

    const tagIds: string[] = [];
    for (const t of tags) {
      if (typeof t === 'string') {
        const found = tagRepository.findByNameIgnoreCase(t);
        if (found) tagIds.push(found.tagId);
      } else if ((t as any).tagId) {
        tagIds.push((t as any).tagId);
      }
    }

    if (tagIds.length === 0) return [];

    const placeholders = tagIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      INNER JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId IN (${placeholders})
      ORDER BY m.title
    `);

    const rows = stmt.all(...tagIds) as any[];
    return rows.map(row => this.mapRowToMovie(row));
  }

  // Find movies by tag type
  findByTagType(tagType: string): Movie[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM movies m
      INNER JOIN media_tags mt ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagType = ?
      ORDER BY m.title
    `);

    const rows = stmt.all(tagType) as any[];
    return rows.map(row => this.mapRowToMovie(row));
  }

  // Count all movies
  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM movies`);
    const result = stmt.get() as any;
    return result.count;
  }

  // Helper method to insert media tags
  private insertMediaTags(mediaItemId: string, tags: Tag[]): void {
    if (tags.length === 0) return;

    const stmt = this.db.prepare(`
      INSERT INTO media_tags (mediaItemId, tagId, tagType)
      VALUES (?, ?, ?)
    `);

    for (const tag of tags) {
      try {
        let tagId: string | undefined;
        let tagType: string | undefined;
        if (typeof tag === 'string') {
          const found = tagRepository.findByNameIgnoreCase(tag);
          if (found) {
            tagId = found.tagId;
            tagType = found.type;
          }
        } else if ((tag as any).tagId) {
          tagId = (tag as any).tagId;
          tagType = (tag as any).type;
        }

        if (!tagId || !tagType) {
          console.warn(
            `Failed to resolve tag for media item ${mediaItemId}:`,
            tag,
          );
          continue;
        }

        stmt.run(mediaItemId, tagId, tagType);
      } catch (error) {
        console.warn(
          `Failed to insert tag for media item ${mediaItemId}:`,
          error,
        );
      }
    }
  }

  // Helper method to load tags for a media item
  private loadMediaTags(mediaItemId: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN media_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
    `);

    const tagRows = stmt.all(mediaItemId) as any[];
    const tags: Tag[] = [];

    for (const tagRow of tagRows) {
      const tag = new Tag(
        tagRow.tagId,
        tagRow.name,
        tagRow.type,
        tagRow.holidayDates ? JSON.parse(tagRow.holidayDates) : undefined,
        tagRow.exclusionGenres ? JSON.parse(tagRow.exclusionGenres) : undefined,
        tagRow.seasonStartDate,
        tagRow.seasonEndDate,
        tagRow.sequence,
      );
      tags.push(tag);
    }

    return tags;
  }

  // Helper method to load collections for a movie
  private loadMovieCollections(mediaItemId: string): CollectionReference[] {
    const stmt = this.db.prepare(`
      SELECT c.mediaItemId, c.title, ci.sequence
      FROM collections c
      INNER JOIN collection_items ci ON c.mediaItemId = ci.collectionId
      WHERE ci.mediaItemId = ?
      ORDER BY ci.sequence
    `);

    const rows = stmt.all(mediaItemId) as any[];
    return rows.map(
      row => new CollectionReference(row.mediaItemId, row.title, row.sequence),
    );
  }

  private mapRowToMovie(row: any): Movie {
    const tags = this.loadMediaTags(row.mediaItemId);
    const collections = this.loadMovieCollections(row.mediaItemId);

    return new Movie(
      row.title,
      row.mediaItemId,
      row.alias,
      row.imdb,
      tags,
      row.path,
      row.duration,
      row.durationLimit,
      MediaType.Movie,
      collections,
    );
  }
}

// Export singleton instance
export const movieRepository = new MovieRepository();
