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
        tags TEXT, -- JSON string array
        path TEXT NOT NULL,
        duration INTEGER,
        durationLimit INTEGER,
        collections TEXT, -- JSON object array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
        tags TEXT, -- JSON string array
        secondaryTags TEXT, -- JSON string array
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
        mediaItemId TEXT,
        showItemId TEXT,
        duration INTEGER,
        durationLimit INTEGER,
        tags TEXT, -- JSON string array
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
        tags TEXT, -- JSON string array
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
        items TEXT, -- JSON object array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
        tags TEXT, -- JSON string array
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
        tags TEXT, -- JSON string array
        genre TEXT,
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
        tags TEXT, -- JSON string array
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
        tags TEXT, -- JSON string array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Holidays table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        holidayDates TEXT, -- JSON string array
        exclusionGenres TEXT, -- JSON string array
        seasonStartDate TEXT,
        seasonEndDate TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Age Groups table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS age_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tagId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mosaics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mosaics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        tagId TEXT UNIQUE NOT NULL,
        description TEXT,
        items TEXT, -- JSON string array
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

    // Default Commercials table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS default_commercials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        commercials TEXT, -- JSON string array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Default Promos table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS default_promos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        mediaItemId TEXT UNIQUE NOT NULL,
        promos TEXT, -- JSON string array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_movies_mediaItemId ON movies(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_shows_mediaItemId ON shows(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_episodes_showId ON episodes(showId);
      CREATE INDEX IF NOT EXISTS idx_episodes_mediaItemId ON episodes(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_commercials_mediaItemId ON commercials(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_collections_mediaItemId ON collections(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_shorts_mediaItemId ON shorts(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_music_mediaItemId ON music(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_promos_mediaItemId ON promos(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_bumpers_mediaItemId ON bumpers(mediaItemId);
      CREATE INDEX IF NOT EXISTS idx_holidays_tagId ON holidays(tagId);
      CREATE INDEX IF NOT EXISTS idx_mosaics_tagId ON mosaics(tagId);
      CREATE INDEX IF NOT EXISTS idx_age_groups_tagId ON age_groups(tagId);
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
