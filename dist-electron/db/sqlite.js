import Database from "better-sqlite3";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
function getDatabasePath() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "kaleidoscope.db");
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
            this.db.pragma("journal_mode = WAL");
            this.db.pragma("foreign_keys = ON");
            console.log(`SQLite connected at: ${this.dbPath}`);
            this.initializeDatabase();
        }
        catch (error) {
            console.error("Error connecting to SQLite:", error);
            throw error;
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error("Database not connected. Call connect() first.");
        }
        return this.db;
    }
    /**
     * For testing: inject a test database instance
     * Used by tests to use a temporary database instead of the real one
     */
    setDatabase(testDb) {
        this.db = testDb;
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log("SQLite connection closed");
        }
    }
    initializeDatabase() {
        if (!this.db)
            return;
        this.createTables();
        console.log("Database tables initialized");
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
        duration INTEGER NOT NULL,
        durationLimit INTEGER NOT NULL,
        isHolidayExclusive INTEGER DEFAULT 0,
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
        // Media Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS movie_tags (
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
        // Show Secondary Tags junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS show_secondary_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mediaItemId) REFERENCES shows (mediaItemId) ON DELETE CASCADE,
        UNIQUE(mediaItemId, tagId)
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
        duration INTEGER NOT NULL,
        durationLimit INTEGER NOT NULL,
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
        isHolidayExclusive INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Collections table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collectionId TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        itemCount INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Collection Items junction table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS collection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collectionItemId TEXT UNIQUE NOT NULL,
        collectionId TEXT NOT NULL,
        mediaItemId TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collectionId) REFERENCES collections (collectionId) ON DELETE CASCADE,
        UNIQUE(collectionId, mediaItemId),
        UNIQUE(collectionId, sequence)
      )
    `);
        // Programming blocks table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        durationMinutes INTEGER NOT NULL,
        active INTEGER DEFAULT 1,
        specialtyTagId TEXT,
        movieMode TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (specialtyTagId) REFERENCES tags(tagId)
      )
    `);
        // Programming block schedules
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        year INTEGER,
        month INTEGER,
        dayOfMonth INTEGER,
        daysOfWeek TEXT,
        timeOfDay TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId)
      )
    `);
        // Programming block ordered show members (ShowOrder blocks)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_show_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockItemId TEXT UNIQUE NOT NULL,
        programmingBlockId TEXT NOT NULL,
        showItemId TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (showItemId) REFERENCES shows(mediaItemId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId, showItemId),
        UNIQUE(programmingBlockId, sequence)
      )
    `);
        // Programming block ordered movie members (CuratedMovieMarathon blocks)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_movie_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockItemId TEXT UNIQUE NOT NULL,
        programmingBlockId TEXT NOT NULL,
        movieItemId TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (movieItemId) REFERENCES movies(mediaItemId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId, movieItemId),
        UNIQUE(programmingBlockId, sequence)
      )
    `);
        // Programming block thematic tags (TagThemed blocks)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(tagId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId, tagId)
      )
    `);
        // Programming block bumper pools (block-level and general per-anchor pools)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_bumpers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT NOT NULL,
        bumperItemId TEXT NOT NULL,
        scope TEXT NOT NULL,
        sequence INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (bumperItemId) REFERENCES bumpers(mediaItemId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId, bumperItemId, scope)
      )
    `);
        // Block-scoped progression (isolated from continuous/adhoc progression)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_episode_progression (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT NOT NULL,
        showItemId TEXT NOT NULL,
        currentEpisode INTEGER DEFAULT 0,
        lastPlayedTimestamp INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (showItemId) REFERENCES shows(mediaItemId) ON DELETE CASCADE,
        UNIQUE(programmingBlockId, showItemId)
      )
    `);
        // Block movie history for schedule-aware cooldowns and collection continuity
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS programming_block_movie_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programmingBlockId TEXT NOT NULL,
        movieItemId TEXT NOT NULL,
        playedAt INTEGER NOT NULL,
        scheduledDate TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (programmingBlockId) REFERENCES programming_blocks(programmingBlockId) ON DELETE CASCADE,
        FOREIGN KEY (movieItemId) REFERENCES movies(mediaItemId) ON DELETE CASCADE
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
        isHolidayExclusive INTEGER DEFAULT 0,
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
        isHolidayExclusive INTEGER DEFAULT 0,
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
        expiresAt DATETIME
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_shorts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        expiresAt DATETIME
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        expiresAt DATETIME
      )
    `);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS recently_used_movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaItemId TEXT NOT NULL,
        expiresAt DATETIME
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
        // Collection movie progression table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS collection_movie_progression (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope_key TEXT NOT NULL,
        scope_type TEXT NOT NULL,
        collection_id TEXT NOT NULL,
        last_movie_item_id TEXT NOT NULL,
        last_played_timestamp INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(collectionId) ON DELETE CASCADE,
        FOREIGN KEY (last_movie_item_id) REFERENCES movies(mediaItemId) ON DELETE CASCADE,
        UNIQUE(scope_key, collection_id)
      )
    `);
        // ── Bootstrap Coverage Pool ────────────────────────────────────────────
        // Selected anchor candidates for bootstrap prewarm coverage
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bootstrap_pool_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poolItemId TEXT UNIQUE NOT NULL,
        mediaItemId TEXT NOT NULL,
        mediaType TEXT NOT NULL,
        selectionSeed INTEGER NULL,
        lastUsedAt INTEGER NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mediaItemId, mediaType)
      )
    `);
        // Tags covered by each pool item
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bootstrap_pool_item_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poolItemId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(poolItemId, tagId),
        FOREIGN KEY (poolItemId) REFERENCES bootstrap_pool_items(poolItemId) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(tagId) ON DELETE CASCADE
      )
    `);
        // Per-profile playable path variants for each pool item
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bootstrap_profile_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        variantId TEXT UNIQUE NOT NULL,
        poolItemId TEXT NOT NULL,
        profile TEXT NOT NULL,
        playablePath TEXT NOT NULL,
        cacheKey TEXT NULL,
        isReady INTEGER NOT NULL DEFAULT 0,
        isStale INTEGER NOT NULL DEFAULT 0,
        lastPreparedAt INTEGER NULL,
        lastValidationAt INTEGER NULL,
        lastError TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(poolItemId, profile),
        FOREIGN KEY (poolItemId) REFERENCES bootstrap_pool_items(poolItemId) ON DELETE CASCADE
      )
    `);
        // Coverage planner/recompute run audit log
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bootstrap_coverage_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runId TEXT UNIQUE NOT NULL,
        startedAt INTEGER NOT NULL,
        completedAt INTEGER NULL,
        durationMs INTEGER NULL,
        representedTagCount INTEGER NOT NULL DEFAULT 0,
        coveredTagCount INTEGER NOT NULL DEFAULT 0,
        missingTagCount INTEGER NOT NULL DEFAULT 0,
        selectedItemCount INTEGER NOT NULL DEFAULT 0,
        queuedVariantJobs INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        errorMessage TEXT NULL
      )
    `);
        // Missing-tag snapshot for the latest completed coverage run
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS bootstrap_missing_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        tagType TEXT NOT NULL,
        reason TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(runId, tagId),
        FOREIGN KEY (runId) REFERENCES bootstrap_coverage_runs(runId) ON DELETE CASCADE
      )
    `);
        // Create indexes
        this.createIndexes();
    }
    createIndexes() {
        if (!this.db)
            return;
        const indexes = [
            "CREATE INDEX IF NOT EXISTS idx_movies_mediaItemId ON movies(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_movie_tags_mediaItemId ON movie_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_movie_tags_tagId ON movie_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_movie_tags_tagType ON movie_tags(tagType)",
            "CREATE INDEX IF NOT EXISTS idx_shows_mediaItemId ON shows(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_show_tags_mediaItemId ON show_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_show_tags_tagId ON show_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_show_tags_tagType ON show_tags(tagType)",
            "CREATE INDEX IF NOT EXISTS idx_show_secondary_tags_mediaItemId ON show_secondary_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_show_secondary_tags_tagId ON show_secondary_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_episodes_showId ON episodes(showId)",
            "CREATE INDEX IF NOT EXISTS idx_episodes_mediaItemId ON episodes(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_episode_tags_mediaItemId ON episode_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_episode_tags_tagId ON episode_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_commercials_mediaItemId ON commercials(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_commercial_tags_mediaItemId ON commercial_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_commercial_tags_tagId ON commercial_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_collections_collectionId ON collections(collectionId)",
            "CREATE INDEX IF NOT EXISTS idx_collection_items_collectionId ON collection_items(collectionId)",
            "CREATE INDEX IF NOT EXISTS idx_collection_items_mediaItemId ON collection_items(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_collection_items_sequence ON collection_items(sequence)",
            "CREATE INDEX IF NOT EXISTS idx_programming_blocks_programmingBlockId ON programming_blocks(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_blocks_type ON programming_blocks(type)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_schedules_programmingBlockId ON programming_block_schedules(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_schedules_recurrence ON programming_block_schedules(recurrence)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_show_items_programmingBlockId ON programming_block_show_items(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_show_items_showItemId ON programming_block_show_items(showItemId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_movie_items_programmingBlockId ON programming_block_movie_items(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_movie_items_movieItemId ON programming_block_movie_items(movieItemId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_tags_programmingBlockId ON programming_block_tags(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_tags_tagId ON programming_block_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_bumpers_programmingBlockId ON programming_block_bumpers(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_bumpers_scope ON programming_block_bumpers(scope)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_episode_progression_programmingBlockId ON programming_block_episode_progression(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_episode_progression_showItemId ON programming_block_episode_progression(showItemId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_movie_history_programmingBlockId ON programming_block_movie_history(programmingBlockId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_movie_history_movieItemId ON programming_block_movie_history(movieItemId)",
            "CREATE INDEX IF NOT EXISTS idx_programming_block_movie_history_playedAt ON programming_block_movie_history(playedAt)",
            "CREATE INDEX IF NOT EXISTS idx_shorts_mediaItemId ON shorts(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_short_tags_mediaItemId ON short_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_short_tags_tagId ON short_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_music_mediaItemId ON music(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_music_tags_mediaItemId ON music_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_music_tags_tagId ON music_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_promos_mediaItemId ON promos(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_promo_tags_mediaItemId ON promo_tags(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_promo_tags_tagId ON promo_tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_bumpers_mediaItemId ON bumpers(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_tags_tagId ON tags(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type)",
            "CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)",
            "CREATE INDEX IF NOT EXISTS idx_holiday_dates_tagId ON holiday_dates(tagId)",
            "CREATE INDEX IF NOT EXISTS idx_holiday_dates_holidayDate ON holiday_dates(holidayDate)",
            "CREATE INDEX IF NOT EXISTS idx_holiday_exclusion_tags_holidayTagId ON holiday_exclusion_tags(holidayTagId)",
            "CREATE INDEX IF NOT EXISTS idx_holiday_exclusion_tags_excludedTagId ON holiday_exclusion_tags(excludedTagId)",
            "CREATE INDEX IF NOT EXISTS idx_mosaics_mosaicId ON mosaics(mosaicId)",
            "CREATE INDEX IF NOT EXISTS idx_mosaics_facetId ON mosaics(facetId)",
            "CREATE INDEX IF NOT EXISTS idx_facets_facetId ON facets(facetId)",
            "CREATE INDEX IF NOT EXISTS idx_facet_distances_from ON facet_distances(sourceFacetId)",
            "CREATE INDEX IF NOT EXISTS idx_facet_distances_to ON facet_distances(targetFacetId)",
            "CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_mediaItemId ON recently_used_commercials(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_mediaItemId ON recently_used_shorts(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_recently_used_music_mediaItemId ON recently_used_music(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_recently_used_movies_mediaItemId ON recently_used_movies(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_episode_progression_show_media_item_id ON episode_progression(show_media_item_id)",
            "CREATE INDEX IF NOT EXISTS idx_episode_progression_stream_type ON episode_progression(stream_type)",
            "CREATE INDEX IF NOT EXISTS idx_episode_progression_current_episode ON episode_progression(current_episode)",
            "CREATE INDEX IF NOT EXISTS idx_collection_movie_progression_scope_key ON collection_movie_progression(scope_key)",
            "CREATE INDEX IF NOT EXISTS idx_collection_movie_progression_collection_id ON collection_movie_progression(collection_id)",
            "CREATE INDEX IF NOT EXISTS idx_collection_movie_progression_last_played_timestamp ON collection_movie_progression(last_played_timestamp)",
            // Bootstrap pool indexes
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_pool_items_mediaItemId ON bootstrap_pool_items(mediaItemId)",
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_pool_items_lastUsedAt ON bootstrap_pool_items(lastUsedAt)",
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_pool_item_tags_tagId ON bootstrap_pool_item_tags(tagId, tagType)",
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_profile_variants_profile_ready ON bootstrap_profile_variants(profile, isReady, isStale)",
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_coverage_runs_startedAt ON bootstrap_coverage_runs(startedAt DESC)",
            "CREATE INDEX IF NOT EXISTS idx_bootstrap_missing_tags_tagId ON bootstrap_missing_tags(tagId, tagType)",
        ];
        for (const indexStatement of indexes) {
            try {
                this.db.exec(indexStatement);
            }
            catch (error) {
                console.warn("Skipping index creation:", indexStatement, error);
            }
        }
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
