import { getDB } from '../db/sqlite';
import { EpisodeProgression } from '../models/progressionContext';
import { StreamType } from '../models/enum/streamTypes';

/**
 * Repository for managing episode progression tracking in the database.
 * Handles separate progressions for Continuous, Adhoc, and Block stream types.
 */
export const progressionRepository = {
  /**
   * Get all episode progressions from database
   */
  findAllProgressions(): EpisodeProgression[] {
    const db = getDB();

    try {
      const rows = db
        .prepare(
          `
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        ORDER BY show_media_item_id, stream_type
      `,
        )
        .all() as any[];

      return rows.map(row => {
        // Convert stream type string back to enum
        let streamType: StreamType;
        switch (row.stream_type) {
          case 'Cont':
            streamType = StreamType.Cont;
            break;
          case 'Adhoc':
            streamType = StreamType.Adhoc;
            break;
          case 'Block':
            streamType = StreamType.Block;
            break;
          default:
            console.warn(
              `Unknown stream type: ${row.stream_type}, defaulting to Cont`,
            );
            streamType = StreamType.Cont;
        }

        return new EpisodeProgression(
          row.show_media_item_id,
          streamType,
          row.current_episode,
          row.last_played_timestamp,
          row.next_episode_duration_limit,
          row.next_episode_over_duration,
        );
      });
    } catch (error) {
      console.error('Error loading episode progressions from database:', error);
      return [];
    }
  },

  /**
   * Find episode progression for a specific show and stream type
   */
  findProgression(
    showMediaItemId: string,
    streamType: StreamType,
  ): EpisodeProgression | null {
    const db = getDB();

    try {
      // Convert StreamType enum to string
      let typeString: string;
      switch (streamType) {
        case StreamType.Cont:
          typeString = 'Cont';
          break;
        case StreamType.Adhoc:
          typeString = 'Adhoc';
          break;
        case StreamType.Block:
          typeString = 'Block';
          break;
        default:
          typeString = 'Cont';
      }

      const row = db
        .prepare(
          `
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        WHERE show_media_item_id = ? AND stream_type = ?
      `,
        )
        .get(showMediaItemId, typeString) as any;

      if (!row) {
        return null;
      }

      return new EpisodeProgression(
        row.show_media_item_id,
        streamType,
        row.current_episode,
        row.last_played_timestamp,
        row.next_episode_duration_limit,
        row.next_episode_over_duration,
      );
    } catch (error) {
      console.error('Error finding episode progression:', error);
      return null;
    }
  },

  /**
   * Get all progressions for a specific show across all stream types
   */
  findProgressionsForShow(showMediaItemId: string): EpisodeProgression[] {
    const db = getDB();

    try {
      const rows = db
        .prepare(
          `
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        WHERE show_media_item_id = ?
        ORDER BY stream_type
      `,
        )
        .all(showMediaItemId) as any[];

      return rows.map(row => {
        // Convert stream type string back to enum
        let streamType: StreamType;
        switch (row.stream_type) {
          case 'Cont':
            streamType = StreamType.Cont;
            break;
          case 'Adhoc':
            streamType = StreamType.Adhoc;
            break;
          case 'Block':
            streamType = StreamType.Block;
            break;
          default:
            console.warn(
              `Unknown stream type: ${row.stream_type}, defaulting to Cont`,
            );
            streamType = StreamType.Cont;
        }

        return new EpisodeProgression(
          row.show_media_item_id,
          streamType,
          row.current_episode,
          row.last_played_timestamp,
          row.next_episode_duration_limit,
          row.next_episode_over_duration,
        );
      });
    } catch (error) {
      console.error('Error finding progressions for show:', error);
      return [];
    }
  },

  /**
   * Create a new episode progression record
   */
  createProgression(progression: EpisodeProgression): EpisodeProgression {
    const db = getDB();

    try {
      // Convert StreamType enum to string
      let typeString: string;
      switch (progression.streamType) {
        case StreamType.Cont:
          typeString = 'Cont';
          break;
        case StreamType.Adhoc:
          typeString = 'Adhoc';
          break;
        case StreamType.Block:
          typeString = 'Block';
          break;
        default:
          typeString = 'Cont';
      }

      db.prepare(
        `
        INSERT INTO episode_progression (
          show_media_item_id, stream_type, current_episode, 
          last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      ).run(
        progression.showMediaItemId,
        typeString,
        progression.currentEpisode,
        progression.lastPlayed,
        progression.nextEpisodeDurLimit,
        progression.nextEpisodeOverDuration,
      );

      console.log(
        `Created episode progression for ${progression.showMediaItemId} (${typeString})`,
      );
      return progression;
    } catch (error) {
      console.error('Error creating episode progression:', error);
      throw error;
    }
  },

  /**
   * Update an existing episode progression record
   */
  updateProgression(progression: EpisodeProgression): void {
    const db = getDB();

    try {
      // Convert StreamType enum to string
      let typeString: string;
      switch (progression.streamType) {
        case StreamType.Cont:
          typeString = 'Cont';
          break;
        case StreamType.Adhoc:
          typeString = 'Adhoc';
          break;
        case StreamType.Block:
          typeString = 'Block';
          break;
        default:
          typeString = 'Cont';
      }

      const result = db
        .prepare(
          `
        UPDATE episode_progression
        SET current_episode = ?, 
            last_played_timestamp = ?, 
            next_episode_duration_limit = ?,
            next_episode_over_duration = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE show_media_item_id = ? AND stream_type = ?
      `,
        )
        .run(
          progression.currentEpisode,
          progression.lastPlayed,
          progression.nextEpisodeDurLimit,
          progression.nextEpisodeOverDuration,
          progression.showMediaItemId,
          typeString,
        );

      if (result.changes === 0) {
        console.warn(
          `No progression found to update for ${progression.showMediaItemId} (${typeString})`,
        );
      } else {
        console.log(
          `Updated progression for ${progression.showMediaItemId} to episode ${progression.currentEpisode}`,
        );
      }
    } catch (error) {
      console.error('Error updating episode progression:', error);
      throw error;
    }
  },

  /**
   * Create or update episode progression (upsert)
   */
  upsertProgression(progression: EpisodeProgression): void {
    const db = getDB();

    try {
      // Convert StreamType enum to string
      let typeString: string;
      switch (progression.streamType) {
        case StreamType.Cont:
          typeString = 'Cont';
          break;
        case StreamType.Adhoc:
          typeString = 'Adhoc';
          break;
        case StreamType.Block:
          typeString = 'Block';
          break;
        default:
          typeString = 'Cont';
      }

      db.prepare(
        `
        INSERT INTO episode_progression (
          show_media_item_id, stream_type, current_episode, 
          last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(show_media_item_id, stream_type) DO UPDATE SET
          current_episode = excluded.current_episode,
          last_played_timestamp = excluded.last_played_timestamp,
          next_episode_duration_limit = excluded.next_episode_duration_limit,
          next_episode_over_duration = excluded.next_episode_over_duration,
          updated_at = CURRENT_TIMESTAMP
      `,
      ).run(
        progression.showMediaItemId,
        typeString,
        progression.currentEpisode,
        progression.lastPlayed,
        progression.nextEpisodeDurLimit,
        progression.nextEpisodeOverDuration,
      );

      console.log(
        `Upserted progression for ${progression.showMediaItemId} (${typeString}) to episode ${progression.currentEpisode}`,
      );
    } catch (error) {
      console.error('Error upserting episode progression:', error);
      throw error;
    }
  },

  /**
   * Delete progression for a specific show and stream type
   */
  deleteProgression(showMediaItemId: string, streamType: StreamType): void {
    const db = getDB();

    try {
      // Convert StreamType enum to string
      let typeString: string;
      switch (streamType) {
        case StreamType.Cont:
          typeString = 'Cont';
          break;
        case StreamType.Adhoc:
          typeString = 'Adhoc';
          break;
        case StreamType.Block:
          typeString = 'Block';
          break;
        default:
          typeString = 'Cont';
      }

      const result = db
        .prepare(
          `
        DELETE FROM episode_progression
        WHERE show_media_item_id = ? AND stream_type = ?
      `,
        )
        .run(showMediaItemId, typeString);

      if (result.changes > 0) {
        console.log(
          `Deleted progression for ${showMediaItemId} (${typeString})`,
        );
      }
    } catch (error) {
      console.error('Error deleting episode progression:', error);
      throw error;
    }
  },

  /**
   * Delete all progressions for a specific show
   */
  deleteProgressionsForShow(showMediaItemId: string): void {
    const db = getDB();

    try {
      const result = db
        .prepare(
          `
        DELETE FROM episode_progression
        WHERE show_media_item_id = ?
      `,
        )
        .run(showMediaItemId);

      if (result.changes > 0) {
        console.log(
          `Deleted ${result.changes} progressions for ${showMediaItemId}`,
        );
      }
    } catch (error) {
      console.error('Error deleting progressions for show:', error);
      throw error;
    }
  },

  /**
   * Delete all progression data (useful for testing/reset)
   */
  clearAllProgressions(): void {
    const db = getDB();

    try {
      const result = db.prepare('DELETE FROM episode_progression').run();
      console.log(`Cleared ${result.changes} progression records`);
    } catch (error) {
      console.error('Error clearing progression data:', error);
      throw error;
    }
  },
};
