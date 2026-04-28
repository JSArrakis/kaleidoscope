import { getDB } from "../db/sqlite.js";

export class CollectionMovieProgressionRepository {
  private get db() {
    return getDB();
  }

  findByScopeKey(scopeKey: string): CollectionMovieProgression[] {
    const stmt = this.db.prepare(
      `SELECT * FROM collection_movie_progression WHERE scope_key = ? ORDER BY updated_at DESC`,
    );
    const rows = stmt.all(scopeKey) as any[];
    return rows.map((row) => this.mapRowToProgression(row));
  }

  findByScopeAndCollection(
    scopeKey: string,
    collectionId: string,
  ): CollectionMovieProgression | null {
    const stmt = this.db.prepare(
      `SELECT * FROM collection_movie_progression WHERE scope_key = ? AND collection_id = ? LIMIT 1`,
    );
    const row = stmt.get(scopeKey, collectionId) as any;
    if (!row) return null;
    return this.mapRowToProgression(row);
  }

  upsert(
    scopeKey: string,
    scopeType: CollectionMovieProgression["scopeType"],
    collectionId: string,
    lastMovieItemId: string,
    lastPlayedTimestamp: number,
  ): CollectionMovieProgression | null {
    const stmt = this.db.prepare(`
      INSERT INTO collection_movie_progression (
        scope_key,
        scope_type,
        collection_id,
        last_movie_item_id,
        last_played_timestamp
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, collection_id) DO UPDATE SET
        scope_type = excluded.scope_type,
        last_movie_item_id = excluded.last_movie_item_id,
        last_played_timestamp = excluded.last_played_timestamp,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      scopeKey,
      scopeType,
      collectionId,
      lastMovieItemId,
      lastPlayedTimestamp,
    );

    return this.findByScopeAndCollection(scopeKey, collectionId);
  }

  private mapRowToProgression(row: any): CollectionMovieProgression {
    return {
      id: row.id,
      scopeKey: row.scope_key,
      scopeType: row.scope_type,
      collectionId: row.collection_id,
      lastMovieItemId: row.last_movie_item_id,
      lastPlayedTimestamp: row.last_played_timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const collectionMovieProgressionRepository =
  new CollectionMovieProgressionRepository();
