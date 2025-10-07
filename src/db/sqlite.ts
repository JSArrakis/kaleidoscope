import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

class SQLiteService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Set database path - this will be in the app's data directory
    const appDataPath = process.env.APPDATA || process.env.HOME || './';
    const appDir = path.join(appDataPath, 'Kaleidoscope');

    // Ensure the app directory exists
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    this.dbPath = path.join(appDir, 'kaleidoscope.db');
  }

  public connect(): void {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Better performance
      this.db.pragma('foreign_keys = ON'); // Enable foreign keys
      console.log(`SQLite connected at: ${this.dbPath}`);
      this.initializeDatabase();
    } catch (error) {
      console.error('Error connecting to SQLite:', error);
      throw error;
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('SQLite connection closed');
    }
  }

  private initializeDatabase(): void {
    if (!this.db) return;

    // Create tables if they don't exist
    this.createTables();
    console.log('Database tables initialized');
  }

  private createTables(): void {
    if (!this.db) return;

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

    // Facets table - stores facet definitions (genre + aesthetic and relationships)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS facets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facetId TEXT UNIQUE NOT NULL,
        genre TEXT NOT NULL,
        aesthetic TEXT NOT NULL,
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
        overDuration BOOLEAN DEFAULT FALSE,
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
        holidayDates TEXT, -- JSON string array (only for Holiday type)
        exclusionGenres TEXT, -- JSON string array (only for Holiday type)
        seasonStartDate TEXT, -- only for Holiday type
        seasonEndDate TEXT, -- only for Holiday type
        -- Age Group-specific fields
        sequence INTEGER, -- only for AgeGroup type
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mosaics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mosaics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        tags TEXT, -- JSON string array
        musicalGenres TEXT, -- JSON string array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
      CREATE INDEX IF NOT EXISTS idx_mosaics_tagId ON mosaics(tagId);
      CREATE INDEX IF NOT EXISTS idx_facets_facetId ON facets(facetId);
      CREATE INDEX IF NOT EXISTS idx_facets_genre ON facets(genre);
      CREATE INDEX IF NOT EXISTS idx_facets_aesthetic ON facets(aesthetic);
  CREATE INDEX IF NOT EXISTS idx_facet_distances_from ON facet_distances(sourceFacetId);
  CREATE INDEX IF NOT EXISTS idx_facet_distances_to ON facet_distances(targetFacetId);
    `);
  }
}

// Create singleton instance
export const sqliteService = new SQLiteService();

// Helper function to get database instance
export function getDB(): Database.Database {
  return sqliteService.getDatabase();
}

// Connect to database
export async function connectToSQLite(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      sqliteService.connect();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Close database connection
export function closeSQLite(): void {
  sqliteService.close();
}
