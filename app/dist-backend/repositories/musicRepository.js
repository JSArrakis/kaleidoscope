"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicRepository = exports.MusicRepository = void 0;
const sqlite_1 = require("../db/sqlite");
const music_1 = require("../models/music");
const tagsRepository_1 = require("./tagsRepository");
class MusicRepository {
    get db() {
        return (0, sqlite_1.getDB)();
    }
    // Helper method to insert music tags into junction table
    insertMusicTags(mediaItemId, tags) {
        if (tags.length === 0)
            return;
        const stmt = this.db.prepare(`
      INSERT INTO music_tags (mediaItemId, tagId)
      VALUES (?, ?)
    `);
        for (const tag of tags) {
            try {
                let tagId;
                if (typeof tag === 'string') {
                    const found = tagsRepository_1.tagRepository.findByNameIgnoreCase(tag);
                    tagId = found ? found.tagId : undefined;
                }
                else if (tag.tagId) {
                    tagId = tag.tagId;
                }
                if (!tagId) {
                    console.warn(`Skipping unknown tag for music ${mediaItemId}:`, tag);
                    continue;
                }
                stmt.run(mediaItemId, tagId);
            }
            catch (error) {
                // Ignore duplicate key errors, but log other errors
                if (!(error instanceof Error) ||
                    !error.message.includes('UNIQUE constraint failed')) {
                    console.error('Error inserting music tag:', error);
                }
            }
        }
    }
    // Helper method to load music tags from junction table
    loadMusicTags(mediaItemId) {
        const stmt = this.db.prepare(`
      SELECT t.*
      FROM tags t
      INNER JOIN music_tags mt ON t.tagId = mt.tagId
      WHERE mt.mediaItemId = ?
    `);
        return stmt.all(mediaItemId);
    }
    // Helper method to delete music tags from junction table
    deleteMusicTags(mediaItemId) {
        const stmt = this.db.prepare(`
      DELETE FROM music_tags WHERE mediaItemId = ?
    `);
        stmt.run(mediaItemId);
    }
    create(music) {
        const transaction = this.db.transaction(() => {
            // Insert the music record
            const stmt = this.db.prepare(`
        INSERT INTO music (title, artist, mediaItemId, duration, path, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            stmt.run(music.title, music.artist, music.mediaItemId, music.duration, music.path, music.type);
            // Insert music tags
            this.insertMusicTags(music.mediaItemId, music.tags);
            return this.findByMediaItemId(music.mediaItemId);
        });
        return transaction();
    }
    findByMediaItemId(mediaItemId) {
        const stmt = this.db.prepare(`SELECT * FROM music WHERE mediaItemId = ?`);
        const row = stmt.get(mediaItemId);
        if (!row)
            return null;
        return this.mapRowToMusic(row);
    }
    findAll() {
        const stmt = this.db.prepare(`SELECT * FROM music ORDER BY title`);
        const rows = stmt.all();
        return rows.map(row => this.mapRowToMusic(row));
    }
    update(mediaItemId, music) {
        const transaction = this.db.transaction(() => {
            // Update the music record
            const stmt = this.db.prepare(`
        UPDATE music
        SET title = ?, artist = ?, duration = ?, path = ?, type = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE mediaItemId = ?
      `);
            const result = stmt.run(music.title, music.artist, music.duration, music.path, music.type, mediaItemId);
            if (result.changes === 0)
                return null;
            // Delete existing tags and insert new ones
            this.deleteMusicTags(mediaItemId);
            this.insertMusicTags(mediaItemId, music.tags);
            return this.findByMediaItemId(mediaItemId);
        });
        return transaction();
    }
    delete(mediaItemId) {
        const transaction = this.db.transaction(() => {
            // Delete tags first (will cascade, but explicit is better)
            this.deleteMusicTags(mediaItemId);
            // Delete the music record
            const stmt = this.db.prepare(`DELETE FROM music WHERE mediaItemId = ?`);
            const result = stmt.run(mediaItemId);
            return result.changes > 0;
        });
        return transaction();
    }
    // Find music by tags using SQL joins (accept Tag[] or string[])
    findByTags(tags) {
        if (tags.length === 0)
            return [];
        const tagNames = tags.map(t => typeof t === 'string' ? t : t.name);
        const placeholders = tagNames.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.*
      FROM music m
      INNER JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      INNER JOIN tags t ON mt.tagId = t.tagId
      WHERE t.name IN (${placeholders})
      ORDER BY m.title
    `);
        const rows = stmt.all(...tagNames);
        return rows.map(row => this.mapRowToMusic(row));
    }
    // Find music by musical genres specifically
    findByMusicalGenres(genres) {
        if (genres.length === 0)
            return [];
        const genreNames = genres.map(g => typeof g === 'string' ? g : g.name);
        const placeholders = genreNames.map(() => '?').join(',');
        const stmt = this.db.prepare(`
      SELECT DISTINCT m.*
      FROM music m
      INNER JOIN music_tags mt ON m.mediaItemId = mt.mediaItemId
      INNER JOIN tags t ON mt.tagId = t.tagId
      WHERE t.type = 'MusicalGenre' AND t.name IN (${placeholders})
      ORDER BY m.title
    `);
        const rows = stmt.all(...genreNames);
        return rows.map(row => this.mapRowToMusic(row));
    }
    // Find music by artist
    findByArtist(artist) {
        const stmt = this.db.prepare(`
      SELECT * FROM music WHERE artist LIKE ? ORDER BY title
    `);
        const rows = stmt.all(`%${artist}%`);
        return rows.map(row => this.mapRowToMusic(row));
    }
    // Count all music
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM music`);
        const result = stmt.get();
        return result.count;
    }
    mapRowToMusic(row) {
        return new music_1.Music(row.title, row.artist, row.mediaItemId, row.duration, row.path, row.type, this.loadMusicTags(row.mediaItemId));
    }
}
exports.MusicRepository = MusicRepository;
exports.musicRepository = new MusicRepository();
