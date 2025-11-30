# Database Layer Port - Completed

## Files Created

### 1. `src/electron/db/pathResolver.ts`

- Resolves database file path using Electron's `app.getPath('userData')`
- Returns path to `kaleidoscope.db` in platform-specific app data directory
- Function: `getDatabasePath(): string`

### 2. `src/electron/db/sqlite.ts`

- Main SQLite service mirroring the old service structure
- **SQLiteService class:**

  - `connect()` - Establishes database connection with WAL and foreign key pragmas
  - `getDatabase()` - Returns the Database instance
  - `close()` - Closes the connection
  - `createTables()` - Initializes all database tables and indexes
  - `createIndexes()` - Creates performance indexes

- **Tables Created:**

  - Media tables: movies, shows, episodes, shorts, music, commercials, promos, bumpers
  - Tag tables: tags, media_tags, show_tags, episode_tags, etc.
  - Junction tables: facet_tags, commercial_tags, short_tags, promo_tags, bumper_tags, music_tags
  - Facet tables: facets, facet_distances, facet_tags
  - Collection tables: collections, collection_items
  - Utility tables: holiday_dates, holiday_exclusion_tags, mosaics, env_configuration
  - Recently used tables: recently_used_commercials/shorts/music/movies/shows
  - Progression table: episode_progression

- **Exports:**
  - `sqliteService` - Singleton instance
  - `getDB()` - Get database instance
  - `connectToSQLite()` - Connect to database
  - `closeSQLite()` - Close database

### 3. `src/electron/db/db.ts`

- Public API for database operations
- Functions:
  - `connectToDB()` - Async connection wrapper with error handling
  - `closeDB()` - Close connection wrapper

## Changes to Existing Files

### `src/electron/main.ts`

- Added import: `import { connectToDB } from "./db/db.js"`
- Modified `app.on("ready")` to be async
- Added database connection initialization before starting the background service
- Error handling for database connection failures (app continues if DB fails to connect)

## Database Location

- **Windows:** `%APPDATA%/Prism/kaleidoscope.db`
- **macOS:** `~/Library/Application Support/Prism/kaleidoscope.db`
- **Linux:** `~/.config/Prism/kaleidoscope.db`

## Next Steps

1. **Create repositories** - Tag repository, Movie repository, Show repository, etc.
2. **Implement Tag management** - TagRepository with CRUD operations
3. **Implement Media queries** - MovieRepository, ShowRepository, EpisodeRepository, etc.
4. **Implement Facet management** - FacetRepository for stream construction
5. **Test database operations** - Ensure all repositories work correctly

## Schema Highlights

- **Facets concept:** New for old service, now integrated:

  - Stores genre/aesthetic tag combinations
  - Tracks relationships between facets with distance metrics
  - Used by procedural engine for intelligent media selection

- **Recently Used tracking:** Prevents repetition in streams:

  - Separate tables for each media type
  - Tracks usage context and optional expiration

- **Episode Progression:** Manages show progression per stream type:

  - Tracks current episode for each show
  - Different progression per stream type (Continuous, Ad-hoc, Block)
  - Unique constraint ensures one progression record per show/stream combo

- **Tag system:** Unified tag storage with multiple types:
  - Aesthetic, Era, Genre, Specialty, Holiday, AgeGroup, MusicGenre
  - Holiday-specific fields for seasonal content
  - Sequence field for ordered tags (e.g., age groups)
