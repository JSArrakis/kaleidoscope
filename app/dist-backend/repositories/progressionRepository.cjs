"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressionRepository = void 0;
const sqlite_1 = require("../db/sqlite.cjs");
const progressionContext_1 = require("../models/progressionContext.cjs");
const streamTypes_1 = require("../models/enum/streamTypes.cjs");
/**
 * Repository for managing episode progression tracking in the database.
 * Handles separate progressions for Continuous, Adhoc, and Block stream types.
 */
exports.progressionRepository = {
    /**
     * Get all episode progressions from database
     */
    findAllProgressions() {
        const db = (0, sqlite_1.getDB)();
        try {
            const rows = db
                .prepare(`
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        ORDER BY show_media_item_id, stream_type
      `)
                .all();
            return rows.map(row => {
                // Convert stream type string back to enum
                let streamType;
                switch (row.stream_type) {
                    case 'Cont':
                        streamType = streamTypes_1.StreamType.Cont;
                        break;
                    case 'Adhoc':
                        streamType = streamTypes_1.StreamType.Adhoc;
                        break;
                    case 'Block':
                        streamType = streamTypes_1.StreamType.Block;
                        break;
                    default:
                        console.warn(`Unknown stream type: ${row.stream_type}, defaulting to Cont`);
                        streamType = streamTypes_1.StreamType.Cont;
                }
                return new progressionContext_1.EpisodeProgression(row.show_media_item_id, streamType, row.current_episode, row.last_played_timestamp, row.next_episode_duration_limit, row.next_episode_over_duration);
            });
        }
        catch (error) {
            console.error('Error loading episode progressions from database:', error);
            return [];
        }
    },
    /**
     * Find episode progression for a specific show and stream type
     */
    findProgression(showMediaItemId, streamType) {
        const db = (0, sqlite_1.getDB)();
        try {
            // Convert StreamType enum to string
            let typeString;
            switch (streamType) {
                case streamTypes_1.StreamType.Cont:
                    typeString = 'Cont';
                    break;
                case streamTypes_1.StreamType.Adhoc:
                    typeString = 'Adhoc';
                    break;
                case streamTypes_1.StreamType.Block:
                    typeString = 'Block';
                    break;
                default:
                    typeString = 'Cont';
            }
            const row = db
                .prepare(`
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        WHERE show_media_item_id = ? AND stream_type = ?
      `)
                .get(showMediaItemId, typeString);
            if (!row) {
                return null;
            }
            return new progressionContext_1.EpisodeProgression(row.show_media_item_id, streamType, row.current_episode, row.last_played_timestamp, row.next_episode_duration_limit, row.next_episode_over_duration);
        }
        catch (error) {
            console.error('Error finding episode progression:', error);
            return null;
        }
    },
    /**
     * Get all progressions for a specific show across all stream types
     */
    findProgressionsForShow(showMediaItemId) {
        const db = (0, sqlite_1.getDB)();
        try {
            const rows = db
                .prepare(`
        SELECT show_media_item_id, stream_type, current_episode, 
               last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        FROM episode_progression
        WHERE show_media_item_id = ?
        ORDER BY stream_type
      `)
                .all(showMediaItemId);
            return rows.map(row => {
                // Convert stream type string back to enum
                let streamType;
                switch (row.stream_type) {
                    case 'Cont':
                        streamType = streamTypes_1.StreamType.Cont;
                        break;
                    case 'Adhoc':
                        streamType = streamTypes_1.StreamType.Adhoc;
                        break;
                    case 'Block':
                        streamType = streamTypes_1.StreamType.Block;
                        break;
                    default:
                        console.warn(`Unknown stream type: ${row.stream_type}, defaulting to Cont`);
                        streamType = streamTypes_1.StreamType.Cont;
                }
                return new progressionContext_1.EpisodeProgression(row.show_media_item_id, streamType, row.current_episode, row.last_played_timestamp, row.next_episode_duration_limit, row.next_episode_over_duration);
            });
        }
        catch (error) {
            console.error('Error finding progressions for show:', error);
            return [];
        }
    },
    /**
     * Create a new episode progression record
     */
    createProgression(progression) {
        const db = (0, sqlite_1.getDB)();
        try {
            // Convert StreamType enum to string
            let typeString;
            switch (progression.streamType) {
                case streamTypes_1.StreamType.Cont:
                    typeString = 'Cont';
                    break;
                case streamTypes_1.StreamType.Adhoc:
                    typeString = 'Adhoc';
                    break;
                case streamTypes_1.StreamType.Block:
                    typeString = 'Block';
                    break;
                default:
                    typeString = 'Cont';
            }
            db.prepare(`
        INSERT INTO episode_progression (
          show_media_item_id, stream_type, current_episode, 
          last_played_timestamp, next_episode_duration_limit, next_episode_over_duration
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(progression.showMediaItemId, typeString, progression.currentEpisode, progression.lastPlayed, progression.nextEpisodeDurLimit, progression.nextEpisodeOverDuration);
            console.log(`Created episode progression for ${progression.showMediaItemId} (${typeString})`);
            return progression;
        }
        catch (error) {
            console.error('Error creating episode progression:', error);
            throw error;
        }
    },
    /**
     * Update an existing episode progression record
     */
    updateProgression(progression) {
        const db = (0, sqlite_1.getDB)();
        try {
            // Convert StreamType enum to string
            let typeString;
            switch (progression.streamType) {
                case streamTypes_1.StreamType.Cont:
                    typeString = 'Cont';
                    break;
                case streamTypes_1.StreamType.Adhoc:
                    typeString = 'Adhoc';
                    break;
                case streamTypes_1.StreamType.Block:
                    typeString = 'Block';
                    break;
                default:
                    typeString = 'Cont';
            }
            const result = db
                .prepare(`
        UPDATE episode_progression
        SET current_episode = ?, 
            last_played_timestamp = ?, 
            next_episode_duration_limit = ?,
            next_episode_over_duration = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE show_media_item_id = ? AND stream_type = ?
      `)
                .run(progression.currentEpisode, progression.lastPlayed, progression.nextEpisodeDurLimit, progression.nextEpisodeOverDuration, progression.showMediaItemId, typeString);
            if (result.changes === 0) {
                console.warn(`No progression found to update for ${progression.showMediaItemId} (${typeString})`);
            }
            else {
                console.log(`Updated progression for ${progression.showMediaItemId} to episode ${progression.currentEpisode}`);
            }
        }
        catch (error) {
            console.error('Error updating episode progression:', error);
            throw error;
        }
    },
    /**
     * Create or update episode progression (upsert)
     */
    upsertProgression(progression) {
        const db = (0, sqlite_1.getDB)();
        try {
            // Convert StreamType enum to string
            let typeString;
            switch (progression.streamType) {
                case streamTypes_1.StreamType.Cont:
                    typeString = 'Cont';
                    break;
                case streamTypes_1.StreamType.Adhoc:
                    typeString = 'Adhoc';
                    break;
                case streamTypes_1.StreamType.Block:
                    typeString = 'Block';
                    break;
                default:
                    typeString = 'Cont';
            }
            db.prepare(`
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
      `).run(progression.showMediaItemId, typeString, progression.currentEpisode, progression.lastPlayed, progression.nextEpisodeDurLimit, progression.nextEpisodeOverDuration);
            console.log(`Upserted progression for ${progression.showMediaItemId} (${typeString}) to episode ${progression.currentEpisode}`);
        }
        catch (error) {
            console.error('Error upserting episode progression:', error);
            throw error;
        }
    },
    /**
     * Delete progression for a specific show and stream type
     */
    deleteProgression(showMediaItemId, streamType) {
        const db = (0, sqlite_1.getDB)();
        try {
            // Convert StreamType enum to string
            let typeString;
            switch (streamType) {
                case streamTypes_1.StreamType.Cont:
                    typeString = 'Cont';
                    break;
                case streamTypes_1.StreamType.Adhoc:
                    typeString = 'Adhoc';
                    break;
                case streamTypes_1.StreamType.Block:
                    typeString = 'Block';
                    break;
                default:
                    typeString = 'Cont';
            }
            const result = db
                .prepare(`
        DELETE FROM episode_progression
        WHERE show_media_item_id = ? AND stream_type = ?
      `)
                .run(showMediaItemId, typeString);
            if (result.changes > 0) {
                console.log(`Deleted progression for ${showMediaItemId} (${typeString})`);
            }
        }
        catch (error) {
            console.error('Error deleting episode progression:', error);
            throw error;
        }
    },
    /**
     * Delete all progressions for a specific show
     */
    deleteProgressionsForShow(showMediaItemId) {
        const db = (0, sqlite_1.getDB)();
        try {
            const result = db
                .prepare(`
        DELETE FROM episode_progression
        WHERE show_media_item_id = ?
      `)
                .run(showMediaItemId);
            if (result.changes > 0) {
                console.log(`Deleted ${result.changes} progressions for ${showMediaItemId}`);
            }
        }
        catch (error) {
            console.error('Error deleting progressions for show:', error);
            throw error;
        }
    },
    /**
     * Delete all progression data (useful for testing/reset)
     */
    clearAllProgressions() {
        const db = (0, sqlite_1.getDB)();
        try {
            const result = db.prepare('DELETE FROM episode_progression').run();
            console.log(`Cleared ${result.changes} progression records`);
        }
        catch (error) {
            console.error('Error clearing progression data:', error);
            throw error;
        }
    },
};
