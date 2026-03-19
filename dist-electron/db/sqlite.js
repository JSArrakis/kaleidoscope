import Database from 'better-sqlite3';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
function getDatabasePath() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'kaleidoscope.db');
    return dbPath;
}
class SQLiteService {
    db = null;
    dbPath;
    constructor() {
        this.dbPath = getDatabasePath();
        // Ensure the directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    }
    connect() {
        try {
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            console.log(`SQLite connected at: ${this.dbPath}`);
            this.initializeDatabase();
        }
        catch (error) {
            console.error('Error connecting to SQLite:', error);
            throw error;
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('SQLite connection closed');
        }
    }
    initializeDatabase() {
        if (!this.db)
            return;
        this.createTables();
        console.log('Database tables initialized');
    }
    createTables() {
        if (!this.db)
            return;
        // Movies table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        alias TEXT,
        imdb TEXT,
        path TEXT NOT NULL,
        duration INTEGER,
        durationLimit INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Facets table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS facets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facetId TEXT UNIQUE NOT NULL,
        genreId TEXT NOT NULL,
        aestheticId TEXT NOT NULL,
        relationships TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (genreId) REFERENCES tags (tagId),
        FOREIGN KEY (aestheticId) REFERENCES tags (tagId)
      )
    `);
        // Facet distances table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS facet_distances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceFacetId TEXT NOT NULL,
        targetFacetId TEXT NOT NULL,
        distance REAL NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sourceFacetId) REFERENCES facets (facetId) ON DELETE CASCADE,
        FOREIGN KEY (targetFacetId) REFERENCES facets (facetId) ON DELETE CASCADE,
        UNIQUE(sourceFacetId, targetFacetId)
      )
    `);
        // Facet Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS facet_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facetId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facetId) REFERENCES facets (facetId) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags (tagId) ON DELETE CASCADE,
        UNIQUE(facetId, tagType)
      )
    `);
        // Media Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS media_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES movies (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId, tagType)
      )
    `);
        // Show Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS show_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES shows (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId, tagType)
      )
    `);
        // Episode Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS episode_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES episodes (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Commercial Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS commercial_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES commercials (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Short Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS short_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES shorts (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Promo Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS promo_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES promos (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Bumper Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bumper_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES bumpers (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Music Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS music_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES music (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
      )
    `);
        // Shows table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        alias TEXT,
        imdb TEXT,
        durationLimit INTEGER,
        firstEpisodeOverDuration BOOLEAN DEFAULT FALSE,
        episodeCount INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Episodes table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        showId INTEGER NOT NULL,
        season TEXT NOT NULL,
        episode TEXT NOT NULL,
        episodeNumber INTEGER,
        path TEXT NOT NULL,
        title TEXT,
        mediaItemId TEXT UNIQUE NOT NULL,
        showItemId TEXT,
        duration INTEGER,
        durationLimit INTEGER,
        overDuration BOOLEAN DEFAULT FALSE,
        type INTEGER DEFAULT 7,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (showId) REFERENCES shows (id) ON DELETE CASCADE
      )
    `);
        // Commercials table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS commercials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        duration INTEGER,
        path TEXT NOT NULL,
        type INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Collections table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Collection Items junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS collection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collectionId TEXT NOT NULL,
        mediaItemId TEXT NOT NULL,
        mediaItemTitle TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collectionId) REFERENCES collections (mediaItemId) ON DELETE CASCADE,
        UNIQUE(collectionId, mediaItemId),
        UNIQUE(collectionId, sequence)
      )
    `);
        // Shorts table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS shorts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        duration INTEGER,
        path TEXT NOT NULL,
        type INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Music table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        mediaItemId TEXT UNIQUE NOT NULL,
        duration INTEGER,
        path TEXT NOT NULL,
        type INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Promos table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS promos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        duration INTEGER,
        path TEXT NOT NULL,
        type INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Bumpers table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bumpers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        duration INTEGER,
        path TEXT NOT NULL,
        type INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Tags table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        seasonStartDate DATETIME,
        seasonEndDate DATETIME,
        explicitlyHoliday BOOLEAN DEFAULT FALSE,
        sequence INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Holiday dates table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS holiday_dates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT NOT NULL,
        holidayDate DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        UNIQUE(tagId, holidayDate)
      )
    `);
        // Holiday exclusion tags table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS holiday_exclusion_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        holidayTagId TEXT NOT NULL,
        excludedTagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (holidayTagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        FOREIGN KEY (excludedTagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        UNIQUE(holidayTagId, excludedTagId)
      )
    `);
        // Mosaics table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS mosaics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mosaicId TEXT UNIQUE NOT NULL,
        facetId TEXT NOT NULL,
        musicalGenres TEXT NOT NULL,
        name TEXT,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facetId) REFERENCES facets(facetId)
      )
    `);
        // Environment Configuration table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS env_configuration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        favorites TEXT,
        blackList TEXT,
        defaultPromo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Recently Used tables
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_commercials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL,
        streamSessionId TEXT,
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        FOREIGN KEY (mediaItemId) REFERENCES commercials(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_shorts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL,
        streamSessionId TEXT,
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        FOREIGN KEY (mediaItemId) REFERENCES shorts(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL,
        streamSessionId TEXT,
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        FOREIGN KEY (mediaItemId) REFERENCES music(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL,
        streamSessionId TEXT,
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        FOREIGN KEY (mediaItemId) REFERENCES movies(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL,
        streamSessionId TEXT,
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        FOREIGN KEY (mediaItemId) REFERENCES shows(mediaItemId) ON DELETE CASCADE
      )
    `);
        // Episode Progression table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS episode_progression (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_media_item_id TEXT NOT NULL,
        stream_type TEXT NOT NULL,
        current_episode INTEGER DEFAULT 0,
        last_played_timestamp INTEGER DEFAULT 0,
        next_episode_duration_limit INTEGER DEFAULT 0,
        next_episode_over_duration BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (show_media_item_id) REFERENCES shows(mediaItemId) ON DELETE CASCADE,
        UNIQUE(show_media_item_id, stream_type)
      )
    `);
        // Create indexes
        this.createIndexes();
    }
    createIndexes() {
        if (!this.db)
            return;
        const indexes = `
      CREATE INDEX IF NOT EXISTS idx_movies_mediaItemId ON movies(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_media_tags_mediaItemId ON media_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_media_tags_tagId ON media_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_media_tags_tagType ON media_tags(tagType);
      CREATE INDEX IF NOT EXISTS idx_shows_mediaItemId ON shows(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_show_tags_mediaItemId ON show_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_show_tags_tagId ON show_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_show_tags_tagType ON show_tags(tagType);
      CREATE INDEX IF NOT EXISTS idx_episodes_showId ON episodes(showId);
      CREATE INDEX IF NOT EXISTS idx_episodes_mediaItemId ON episodes(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_episode_tags_mediaItemId ON episode_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_episode_tags_tagId ON episode_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_commercials_mediaItemId ON commercials(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_commercial_tags_mediaItemId ON commercial_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_commercial_tags_tagId ON commercial_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_collections_mediaItemId ON collections(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_collection_items_collectionId ON collection_items(collectionId);
      CREATE INDEX IF NOT EXISTS idx_collection_items_mediaItemId ON collection_items(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_collection_items_sequence ON collection_items(sequence);
      CREATE INDEX IF NOT EXISTS idx_shorts_mediaItemId ON shorts(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_short_tags_mediaItemId ON short_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_short_tags_tagId ON short_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_music_mediaItemId ON music(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_music_tags_mediaItemId ON music_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_music_tags_tagId ON music_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_promos_mediaItemId ON promos(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_promo_tags_mediaItemId ON promo_tags(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_promo_tags_tagId ON promo_tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_bumpers_mediaItemId ON bumpers(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_tags_tagId ON tags(tagId);
      CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_holiday_dates_tagId ON holiday_dates(tagId);
      CREATE INDEX IF NOT EXISTS idx_holiday_dates_holidayDate ON holiday_dates(holidayDate);
      CREATE INDEX IF NOT EXISTS idx_holiday_exclusion_tags_holidayTagId ON holiday_exclusion_tags(holidayTagId);
      CREATE INDEX IF NOT EXISTS idx_holiday_exclusion_tags_excludedTagId ON holiday_exclusion_tags(excludedTagId);
      CREATE INDEX IF NOT EXISTS idx_mosaics_mosaicId ON mosaics(mosaicId);
      CREATE INDEX IF NOT EXISTS idx_mosaics_facetId ON mosaics(facetId);
      CREATE INDEX IF NOT EXISTS idx_facets_facetId ON facets(facetId);
      CREATE INDEX IF NOT EXISTS idx_facet_distances_from ON facet_distances(sourceFacetId);
      CREATE INDEX IF NOT EXISTS idx_facet_distances_to ON facet_distances(targetFacetId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_mediaItemId ON recently_used_commercials(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_usageContext ON recently_used_commercials(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_usedAt ON recently_used_commercials(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_mediaItemId ON recently_used_shorts(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_usageContext ON recently_used_shorts(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_usedAt ON recently_used_shorts(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_mediaItemId ON recently_used_music(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_usageContext ON recently_used_music(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_usedAt ON recently_used_music(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_mediaItemId ON recently_used_movies(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_usageContext ON recently_used_movies(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_usedAt ON recently_used_movies(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_mediaItemId ON recently_used_shows(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_usageContext ON recently_used_shows(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_usedAt ON recently_used_shows(usedAt);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_show_media_item_id ON episode_progression(show_media_item_id);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_stream_type ON episode_progression(stream_type);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_current_episode ON episode_progression(current_episode);
    `;
        this.db.exec(indexes);
    }
}
export const sqliteService = new SQLiteService();
export function getDB() {
    return sqliteService.getDatabase();
}
export async function connectToSQLite() {
    return new Promise((resolve, reject) => {
        try {
            sqliteService.connect();
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
export function closeSQLite() {
    sqliteService.close();
}
