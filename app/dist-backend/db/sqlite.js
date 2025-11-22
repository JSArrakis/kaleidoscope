"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteService = void 0;
exports.getDB = getDB;
exports.connectToSQLite = connectToSQLite;
exports.closeSQLite = closeSQLite;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class SQLiteService {
    constructor() {
        this.db = null;
        // Set database path - this will be in the app's data directory
        const appDataPath = process.env.APPDATA || process.env.HOME || './';
        const appDir = path.join(appDataPath, 'Kaleidoscope');
        // Ensure the app directory exists
        if (!fs.existsSync(appDir)) {
            fs.mkdirSync(appDir, { recursive: true });
        }
        this.dbPath = path.join(appDir, 'kaleidoscope.db');
    }
    connect() {
        try {
            this.db = new better_sqlite3_1.default(this.dbPath);
            this.db.pragma('journal_mode = WAL'); // Better performance
            this.db.pragma('foreign_keys = ON'); // Enable foreign keys
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
        // Create tables if they don't exist
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
        // Facets table - stores facet definitions and relationships
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS facets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facetId TEXT UNIQUE NOT NULL,
        relationships TEXT, -- JSON string array of related facetIds and weights
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Facet distances table - stores pairwise distances between facets
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
        // Facet Tags junction table - links facets to their genre and aesthetic tags
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS facet_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facetId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL, -- 'genre' or 'aesthetic'
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facetId) REFERENCES facets (facetId) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags (tagId) ON DELETE CASCADE,
        UNIQUE(facetId, tagType) -- Each facet can have only one genre and one aesthetic
      )
    `);
        // Media Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS media_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL, -- 'tag', 'age_group', 'holiday'
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES movies (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId, tagType)
      )
    `);
        // Show Tags junction table (for primary show tags)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS show_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL, -- 'primary' or 'secondary'
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
        type INTEGER DEFAULT 7, -- MediaType.Episode = 7
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
        // Tags table (consolidated to include holidays and age groups)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL, -- 'Aesthetic', 'Era', 'Genre', 'Specialty', 'Holiday', 'AgeGroup'
        -- Holiday-specific fields
        seasonStartDate DATETIME, -- only for Holiday type
        seasonEndDate DATETIME, -- only for Holiday type
        explicitlyHoliday BOOLEAN DEFAULT FALSE, -- if true, content should only play during holiday periods
        -- Age Group-specific fields
        sequence INTEGER, -- only for AgeGroup type
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Holiday dates table - stores individual dates for holiday tags
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS holiday_dates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT NOT NULL,
        holidayDate DATETIME NOT NULL, -- Full datetime (e.g., '2024-12-25 00:00:00')
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        UNIQUE(tagId, holidayDate)
      )
    `);
        // Holiday exclusion tags table - stores tags that should be excluded during holiday periods
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS holiday_exclusion_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        holidayTagId TEXT NOT NULL, -- The holiday tag that defines the exclusion
        excludedTagId TEXT NOT NULL, -- The tag to be excluded during this holiday
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (holidayTagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        FOREIGN KEY (excludedTagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        UNIQUE(holidayTagId, excludedTagId)
      )
    `);
        // Mosaics table - associates facets with musical genres
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS mosaics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mosaicId TEXT UNIQUE NOT NULL,
        facetId TEXT NOT NULL,
        musicalGenres TEXT NOT NULL, -- JSON string array of musical genre names
        name TEXT, -- Optional descriptive name
        description TEXT, -- Optional description
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
        favorites TEXT, -- JSON string array
        blackList TEXT, -- JSON string array
        defaultPromo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Recently Used Media tables - separate tables for each media type for faster lookups
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_commercials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL, -- 'buffer', 'main_content', 'promo'
        streamSessionId TEXT, -- optional stream session identifier
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME, -- when this usage record should be considered expired
        FOREIGN KEY (mediaItemId) REFERENCES commercials(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_shorts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL, -- 'buffer', 'main_content', 'promo'
        streamSessionId TEXT, -- optional stream session identifier
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME, -- when this usage record should be considered expired
        FOREIGN KEY (mediaItemId) REFERENCES shorts(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL, -- 'buffer', 'main_content', 'promo'
        streamSessionId TEXT, -- optional stream session identifier
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME, -- when this usage record should be considered expired
        FOREIGN KEY (mediaItemId) REFERENCES music(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL, -- 'buffer', 'main_content', 'promo'
        streamSessionId TEXT, -- optional stream session identifier
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME, -- when this usage record should be considered expired
        FOREIGN KEY (mediaItemId) REFERENCES movies(mediaItemId) ON DELETE CASCADE
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        usageContext TEXT NOT NULL, -- 'buffer', 'main_content', 'promo'
        streamSessionId TEXT, -- optional stream session identifier
        usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME, -- when this usage record should be considered expired
        FOREIGN KEY (mediaItemId) REFERENCES shows(mediaItemId) ON DELETE CASCADE
      )
    `);
        // Episode Progression table - tracks episode progression for each show per stream type
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS episode_progression (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_media_item_id TEXT NOT NULL, -- MediaItemId of the show
        stream_type TEXT NOT NULL, -- 'Cont', 'Adhoc', 'Block'
        current_episode INTEGER DEFAULT 0, -- 0 = not started, 1+ = next episode to play
        last_played_timestamp INTEGER DEFAULT 0,
        next_episode_duration_limit INTEGER DEFAULT 0,
        next_episode_over_duration BOOLEAN DEFAULT FALSE, -- TRUE if next episode exceeds show's durationLimit
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (show_media_item_id) REFERENCES shows(mediaItemId) ON DELETE CASCADE,
        UNIQUE(show_media_item_id, stream_type)
      )
    `);
        // Create indexes for better performance
        this.db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_facets_genre ON facets(genre);
      CREATE INDEX IF NOT EXISTS idx_facets_aesthetic ON facets(aesthetic);
      CREATE INDEX IF NOT EXISTS idx_facet_distances_from ON facet_distances(sourceFacetId);
      CREATE INDEX IF NOT EXISTS idx_facet_distances_to ON facet_distances(targetFacetId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_mediaItemId ON recently_used_commercials(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_usageContext ON recently_used_commercials(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_usedAt ON recently_used_commercials(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_expiresAt ON recently_used_commercials(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_session ON recently_used_commercials(streamSessionId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_mediaItemId ON recently_used_shorts(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_usageContext ON recently_used_shorts(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_usedAt ON recently_used_shorts(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_expiresAt ON recently_used_shorts(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_session ON recently_used_shorts(streamSessionId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_mediaItemId ON recently_used_music(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_usageContext ON recently_used_music(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_usedAt ON recently_used_music(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_expiresAt ON recently_used_music(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_music_session ON recently_used_music(streamSessionId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_mediaItemId ON recently_used_movies(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_usageContext ON recently_used_movies(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_usedAt ON recently_used_movies(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_expiresAt ON recently_used_movies(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_movies_session ON recently_used_movies(streamSessionId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_mediaItemId ON recently_used_shows(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_usageContext ON recently_used_shows(usageContext);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_usedAt ON recently_used_shows(usedAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_expiresAt ON recently_used_shows(expiresAt);
      CREATE INDEX IF NOT EXISTS idx_recently_used_shows_session ON recently_used_shows(streamSessionId);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_show_media_item_id ON episode_progression(show_media_item_id);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_stream_type ON episode_progression(stream_type);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_current_episode ON episode_progression(current_episode);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_last_played ON episode_progression(last_played_timestamp);
      CREATE INDEX IF NOT EXISTS idx_episode_progression_unique ON episode_progression(show_media_item_id, stream_type);
    `);
    }
}
// Create singleton instance
exports.sqliteService = new SQLiteService();
// Helper function to get database instance
function getDB() {
    return exports.sqliteService.getDatabase();
}
// Connect to database
async function connectToSQLite() {
    return new Promise((resolve, reject) => {
        try {
            exports.sqliteService.connect();
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
// Close database connection
function closeSQLite() {
    exports.sqliteService.close();
}
