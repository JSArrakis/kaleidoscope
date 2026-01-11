import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = path.join(__dirname, "../../../temp-test.db");

/**
 * Test database setup and teardown for holidayIntentCacheManager tests
 * Creates a temporary SQLite database with test data
 * Shared across all tests to avoid redundant setup
 */

export function setupTestDatabase(): Database.Database {
  // Clean up any existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = new Database(TEST_DB_PATH);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create all necessary tables
  db.exec(`
    -- Tags table
    CREATE TABLE IF NOT EXISTS tags (
      tagId TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, -- 'holiday', 'genre', 'specialty', 'facet', 'era', 'age', etc.
      holidayDates TEXT, -- JSON array of ISO dates e.g. ["2025-12-25"]
      seasonStartDate TEXT, -- ISO date e.g. "2025-11-01"
      seasonEndDate TEXT, -- ISO date e.g. "2025-12-31"
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Movies table
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      alias TEXT,
      imdb TEXT,
      durationLimit INTEGER,
      firstEpisodeOverDuration INTEGER DEFAULT 0,
      duration INTEGER, -- Duration in seconds
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Shows table
    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      mediaItemId TEXT UNIQUE NOT NULL,
      alias TEXT,
      imdb TEXT,
      durationLimit INTEGER,
      firstEpisodeOverDuration INTEGER DEFAULT 0,
      episodeCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Episodes table
    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showId INTEGER NOT NULL,
      season INTEGER,
      episode INTEGER,
      episodeNumber INTEGER,
      path TEXT,
      title TEXT,
      mediaItemId TEXT UNIQUE NOT NULL,
      showItemId TEXT,
      duration INTEGER, -- Duration in seconds
      durationLimit INTEGER,
      overDuration INTEGER DEFAULT 0,
      type TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(showId) REFERENCES shows(id)
    );

    -- Media tags table (for tagging movies and episodes)
    CREATE TABLE IF NOT EXISTS movie_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    -- Episode tags table
    CREATE TABLE IF NOT EXISTS episode_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    -- Show tags table
    CREATE TABLE IF NOT EXISTS show_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );

    -- Show secondary tags table
    CREATE TABLE IF NOT EXISTS show_secondary_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mediaItemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      FOREIGN KEY(tagId) REFERENCES tags(tagId),
      UNIQUE(mediaItemId, tagId)
    );
  `);

  return db;
}

export function populateTestData(db: Database.Database): void {
  /**
   * Test Data Fixture:
   * - Christmas holiday tag (Dec 25) with season (Nov 1 - Dec 31)
   * - 5 movies totaling ~600 minutes (100 min each)
   * - 2 shows with episodes totaling ~300 minutes
   * - Halloween holiday tag (Oct 31) with season (Oct 1 - Oct 31)
   * - Additional movies and episodes for edge case testing
   */

  const insertTag = db.prepare(`
    INSERT INTO tags (tagId, name, type, holidayDates, seasonStartDate, seasonEndDate)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMovie = db.prepare(`
    INSERT INTO movies (title, mediaItemId, duration)
    VALUES (?, ?, ?)
  `);

  const insertShow = db.prepare(`
    INSERT INTO shows (title, mediaItemId, episodeCount)
    VALUES (?, ?, ?)
  `);

  const insertEpisode = db.prepare(`
    INSERT INTO episodes (showId, season, episode, episodeNumber, title, mediaItemId, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMediaTag = db.prepare(`
    INSERT INTO movie_tags (mediaItemId, tagId)
    VALUES (?, ?)
  `);

  const insertEpisodeTag = db.prepare(`
    INSERT INTO episode_tags (mediaItemId, tagId)
    VALUES (?, ?)
  `);

  // Transaction for atomic insertion
  const transaction = db.transaction(() => {
    // ========== CHRISTMAS TAGS ==========
    insertTag.run(
      "holiday-christmas",
      "Christmas",
      "holiday",
      JSON.stringify(["2025-12-25"]),
      "2025-11-01",
      "2025-12-31"
    );

    // ========== CHRISTMAS MOVIES (5 movies × 100 min each = 500 min) ==========
    insertMovie.run("The Polar Express", "movie-polar-express", 100 * 60); // 100 min → seconds
    insertMovie.run("Elf", "movie-elf", 97 * 60);
    insertMovie.run("Home Alone", "movie-home-alone", 103 * 60);
    insertMovie.run("A Christmas Story", "movie-christmas-story", 94 * 60);
    insertMovie.run("It's a Wonderful Life", "movie-wonderful-life", 130 * 60);

    // Tag movies with Christmas
    insertMediaTag.run("movie-polar-express", "holiday-christmas");
    insertMediaTag.run("movie-elf", "holiday-christmas");
    insertMediaTag.run("movie-home-alone", "holiday-christmas");
    insertMediaTag.run("movie-christmas-story", "holiday-christmas");
    insertMediaTag.run("movie-wonderful-life", "holiday-christmas");

    // ========== CHRISTMAS SHOWS (2 shows with multiple episodes) ==========
    // Show 1: The Office Holiday Episodes (3 episodes × 45 min = 135 min)
    const showOfficeId = insertShow.run(
      "The Office (Holiday)",
      "show-office-holiday",
      3
    );
    insertEpisode.run(
      showOfficeId.lastInsertRowid,
      2,
      10,
      1,
      "A Fire in the Park",
      "ep-office-holiday-1",
      45 * 60
    );
    insertEpisode.run(
      showOfficeId.lastInsertRowid,
      3,
      9,
      2,
      "The Dundies",
      "ep-office-holiday-2",
      45 * 60
    );
    insertEpisode.run(
      showOfficeId.lastInsertRowid,
      9,
      11,
      3,
      "Livin the Dream",
      "ep-office-holiday-3",
      45 * 60
    );

    insertEpisodeTag.run("ep-office-holiday-1", "holiday-christmas");
    insertEpisodeTag.run("ep-office-holiday-2", "holiday-christmas");
    insertEpisodeTag.run("ep-office-holiday-3", "holiday-christmas");

    // Show 2: Friends Holiday Episodes (2 episodes × 22 min = 44 min)
    const showFriendsId = insertShow.run(
      "Friends (Holiday)",
      "show-friends-holiday",
      2
    );
    insertEpisode.run(
      showFriendsId.lastInsertRowid,
      1,
      9,
      1,
      "The One with the Holiday Armadillo",
      "ep-friends-holiday-1",
      22 * 60
    );
    insertEpisode.run(
      showFriendsId.lastInsertRowid,
      9,
      10,
      2,
      "The One with the Rumor",
      "ep-friends-holiday-2",
      22 * 60
    );

    insertEpisodeTag.run("ep-friends-holiday-1", "holiday-christmas");
    insertEpisodeTag.run("ep-friends-holiday-2", "holiday-christmas");

    // ========== HALLOWEEN TAGS ==========
    insertTag.run(
      "holiday-halloween",
      "Halloween",
      "holiday",
      JSON.stringify(["2025-10-31"]),
      "2025-10-01",
      "2025-10-31"
    );

    // ========== HALLOWEEN MOVIES (2 movies × 90 min = 180 min) ==========
    insertMovie.run("Hocus Pocus", "movie-hocus-pocus", 96 * 60);
    insertMovie.run("Thriller Night", "movie-thriller", 90 * 60);

    insertMediaTag.run("movie-hocus-pocus", "holiday-halloween");
    insertMediaTag.run("movie-thriller", "holiday-halloween");

    // ========== EASTER TAGS (minimal for contrast) ==========
    insertTag.run(
      "holiday-easter",
      "Easter",
      "holiday",
      JSON.stringify(["2025-04-20"]),
      "2025-03-15",
      "2025-04-30"
    );

    // One small movie for Easter
    insertMovie.run("Peter Rabbit", "movie-peter-rabbit", 93 * 60);
    insertMediaTag.run("movie-peter-rabbit", "holiday-easter");
  });

  transaction();
}

export function teardownTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

export function getTestDatabasePath(): string {
  return TEST_DB_PATH;
}
