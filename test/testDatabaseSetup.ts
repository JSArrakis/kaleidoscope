import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "temp-test.db");

/**
 * Simple test database setup
 * Creates a temporary SQLite database with minimal schema
 */

export function setupTestDatabase(): Database.Database {
  // Reuse existing database if it exists (created by jestSetup)
  if (fs.existsSync(TEST_DB_PATH)) {
    const db = new Database(TEST_DB_PATH);
    db.pragma("foreign_keys = ON");
    return db;
  }

  // Otherwise create it
  const db = new Database(TEST_DB_PATH);
  db.pragma("foreign_keys = ON");

  // Create minimal schema
  db.exec(`
    CREATE TABLE tags (
      tagId TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      episodeCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showId INTEGER NOT NULL,
      season INTEGER,
      episode INTEGER,
      episodeNumber INTEGER,
      title TEXT,
      mediaItemId TEXT UNIQUE NOT NULL,
      duration INTEGER,
      FOREIGN KEY(showId) REFERENCES shows(id)
    );

    CREATE TABLE show_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    CREATE TABLE show_secondary_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    CREATE TABLE episode_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    CREATE TABLE episode_progressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL UNIQUE,
      streamType TEXT NOT NULL,
      currentEpisodeNumber INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      duration INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE media_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );
  `);

  return db;
}

/**
 * Populate test data with sample holidays and movies
 */
export function populateTestData(db: Database.Database): void {
  try {
    // Insert sample holiday tags
    db.prepare(
      "INSERT OR IGNORE INTO tags (tagId, name, type) VALUES (?, ?, ?)"
    ).run("holiday-christmas", "Christmas", "holiday");

    db.prepare(
      "INSERT OR IGNORE INTO tags (tagId, name, type) VALUES (?, ?, ?)"
    ).run("holiday-halloween", "Halloween", "holiday");

    db.prepare(
      "INSERT OR IGNORE INTO tags (tagId, name, type) VALUES (?, ?, ?)"
    ).run("holiday-easter", "Easter", "holiday");

    // Insert sample movies for Christmas (more than 500 minutes total = 30,000+ seconds)
    const movies = [
      { id: "movie-christmas-1", title: "Christmas Movie 1", duration: 18000 }, // 300 minutes
      { id: "movie-christmas-2", title: "Christmas Movie 2", duration: 14400 }, // 240 minutes
      { id: "movie-christmas-3", title: "Christmas Movie 3", duration: 10800 }, // 180 minutes
      { id: "movie-halloween-1", title: "Halloween Movie 1", duration: 14400 }, // 240 minutes
      { id: "movie-halloween-2", title: "Halloween Movie 2", duration: 14400 }, // 240 minutes
      { id: "movie-easter-1", title: "Easter Movie 1", duration: 10800 }, // 180 minutes
    ];

    for (const movie of movies) {
      db.prepare(
        "INSERT OR IGNORE INTO movies (title, mediaItemId, duration) VALUES (?, ?, ?)"
      ).run(movie.title, movie.id, movie.duration);
    }

    // Associate movies with holiday tags
    const tagAssociations = [
      { mediaItemId: "movie-christmas-1", tagId: "holiday-christmas" },
      { mediaItemId: "movie-christmas-2", tagId: "holiday-christmas" },
      { mediaItemId: "movie-christmas-3", tagId: "holiday-christmas" },
      { mediaItemId: "movie-halloween-1", tagId: "holiday-halloween" },
      { mediaItemId: "movie-halloween-2", tagId: "holiday-halloween" },
      { mediaItemId: "movie-easter-1", tagId: "holiday-easter" },
    ];

    for (const assoc of tagAssociations) {
      db.prepare(
        "INSERT OR IGNORE INTO media_tags (mediaItemId, tagId) VALUES (?, ?)"
      ).run(assoc.mediaItemId, assoc.tagId);
    }

    console.log("[populateTestData] Sample holiday data populated");
  } catch (error) {
    console.log(
      "[populateTestData] Error populating data (may already exist):",
      error
    );
  }
}

export function teardownTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

export function getTestDatabasePath(): string {
  return TEST_DB_PATH;
}
