import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const TEST_DB_PATH = path.join(process.cwd(), "temp-test.db");

/**
 * Test database setup and teardown for all integration tests
 * Creates a temporary SQLite database with test data
 * Shared across all tests to avoid redundant setup
 */

export function setupTestDatabase(): Database.Database {
  // If database already exists, just open it
  // This prevents file locking issues when setupFilesAfterEnv runs multiple times
  if (fs.existsSync(TEST_DB_PATH)) {
    console.log("[setupTestDatabase] Database already exists, reusing...");
    const db = new Database(TEST_DB_PATH);
    db.pragma("foreign_keys = ON");
    return db;
  }

  console.log("[setupTestDatabase] Creating new database...");
  const db = new Database(TEST_DB_PATH);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create all necessary tables
  db.exec(`
    -- Tags table
    CREATE TABLE IF NOT EXISTS tags (
      tagId TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      holidayDates TEXT,
      seasonStartDate TEXT,
      seasonEndDate TEXT,
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
      duration INTEGER,
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
      duration INTEGER,
      durationLimit INTEGER,
      overDuration INTEGER DEFAULT 0,
      type TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(showId) REFERENCES shows(id)
    );

    -- Media tags table
    CREATE TABLE IF NOT EXISTS media_tags (
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
  // Check if data already exists to make this idempotent
  const existingChristmas = db
    .prepare(
      "SELECT COUNT(*) as count FROM tags WHERE tagId = 'holiday-christmas'"
    )
    .get() as any;

  if (existingChristmas.count > 0) {
    console.log("[populateTestData] Test data already populated, skipping...");
    return;
  }

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
    INSERT INTO media_tags (mediaItemId, tagId)
    VALUES (?, ?)
  `);

  const insertEpisodeTag = db.prepare(`
    INSERT INTO episode_tags (mediaItemId, tagId)
    VALUES (?, ?)
  `);

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

    // ========== CHRISTMAS MOVIES ==========
    insertMovie.run("The Polar Express", "movie-polar-express", 100 * 60);
    insertMovie.run("Elf", "movie-elf", 97 * 60);
    insertMovie.run("Home Alone", "movie-home-alone", 103 * 60);
    insertMovie.run("A Christmas Story", "movie-christmas-story", 94 * 60);
    insertMovie.run("It's a Wonderful Life", "movie-wonderful-life", 130 * 60);

    insertMediaTag.run("movie-polar-express", "holiday-christmas");
    insertMediaTag.run("movie-elf", "holiday-christmas");
    insertMediaTag.run("movie-home-alone", "holiday-christmas");
    insertMediaTag.run("movie-christmas-story", "holiday-christmas");
    insertMediaTag.run("movie-wonderful-life", "holiday-christmas");

    // ========== CHRISTMAS SHOWS ==========
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

    // ========== HALLOWEEN MOVIES ==========
    insertMovie.run("Hocus Pocus", "movie-hocus-pocus", 96 * 60);
    insertMovie.run("Thriller Night", "movie-thriller", 90 * 60);

    insertMediaTag.run("movie-hocus-pocus", "holiday-halloween");
    insertMediaTag.run("movie-thriller", "holiday-halloween");

    // ========== EASTER TAGS ==========
    insertTag.run(
      "holiday-easter",
      "Easter",
      "holiday",
      JSON.stringify(["2025-04-20"]),
      "2025-03-15",
      "2025-04-30"
    );

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
