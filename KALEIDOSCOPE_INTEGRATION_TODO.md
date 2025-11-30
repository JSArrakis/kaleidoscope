# Kaleidoscope Integration TODO

This document tracks the integration of the old backend service into the Electron app as a background service running within the main process.

## Main Integration Steps

### 1. Port core backgroundService.ts logic

**Status:** In Progress
**File:** `src/electron/services/backgroundService.ts`

Port the core backgroundService.ts logic into Electron. This includes time calculations, interval scheduling, cycle check loop, and day transitions.

**Current State:**

- Time calculations implemented (native Date object)
- Interval scheduling implemented (using setTimeout)
- Cycle check loop implemented (with TODO placeholders for dependencies)
- Day transitions implemented (setEndOfDayMarker, setTomorrow)
- Media file validation framework ready

**Blockers:** Waiting on dependencies from steps 2 and 3

---

### 2. Port database/repository layer

**Status:** Not Started
**Files:** `src/electron/db/` and `src/electron/repositories/`

Port SQLite database connection and repository layer for querying media items, tags, facets, shows, movies, etc.

#### Sub-Task 2.1: Align Data Models

**Status:** Not Started

Reconcile differences between old service models and current Prism models to use unified structures across the app.

**What needs to be done:**

- Compare old service models (in `old service/src/models/`) with current Prism types (in `types.d.ts`)
- Identify discrepancies in:
  - Media item properties and structure
  - Tag categorization and hierarchy
  - Episode/Show representation
  - Block/Curation structure
- Decide whether to:
  - Modify Prism types to match old service
  - Adapt old service models to Prism structure
  - Create a hybrid model
- Update handlers to work with unified models
- Ensure database schema supports both CRUD operations and streaming operations

**Dependencies:** None - analysis task

---

#### Sub-Task 2.2: Port Database and Repositories

**Status:** Not Started

Port SQLite database connection and repository query layer.

**What needs to be ported:**

- Database connection setup and initialization
- Repository interfaces and query methods:
  - `movieRepository` - Find random movie, find by ID, find by tags
  - `showRepository` - Find random show, find by ID, find by tags
  - `tagRepository` - Find by name, find all
  - `facetRepository` - Find all, find by genre/aesthetic
  - `holidayRepository` - Find active holidays
  - Other media repositories (shorts, music, commercials, promos, bumpers)

**Database Location:**

- User's roaming app data: `%APPDATA%/prism/` (or platform equivalent)
- Should integrate with existing Prism SQLite database
- Path should be resolved using Electron's app.getPath('userData')

**Dependencies:** Requires sub-task 2.1 (model alignment)

---

### 3. Port stream manager and constructor

**Status:** Not Started
**Files:** `src/electron/services/streamManager.ts` and `src/electron/services/streamConstructor.ts`

Port streamManager (queue/playlist management) and streamConstructor (media block generation).

**What needs to be ported:**

- **streamManager.ts:**

  - `onDeck` and `upcoming` queue management
  - `getOnDeckStream()` - Get current media blocks
  - `isContinuousStream()` - Check stream type
  - `removeFirstItemFromOnDeck()` - Remove and return first block
  - `removeFirstItemFromUpcoming()` - Remove and return first block
  - `addItemToOnDeck(blocks)` - Add blocks to on-deck
  - `addToUpcomingStream(blocks)` - Add blocks to upcoming buffer
  - `getContinuousStreamArgs()` - Get stream configuration
  - `setContinuousStream(args)` - Initialize continuous stream

- **streamConstructor.ts:**
  - `constructStream(streamType, timestamp, cadence)` - Build media blocks for time range
  - Respects `:00` and `:30` cadence marks
  - Handles show progression
  - Integrates with procedural engine, buffer engine

**Other services needed by constructor:**

- `bufferEngine.ts` - Create pre/post buffers around media
- `proceduralEngine.ts` - Generate playlists procedurally
- `progressionManager.ts` - Track show progression
- `holidayService.ts` - Filter content by active holidays

**Dependencies:** Requires step 2 (database/repositories)

---

### 4. Port media playing integration (VLC to Electron)

**Status:** Not Started
**File:** `src/electron/services/mediaPlayerService.ts`

Replace VLC media player integration with Electron native player. Set up media player controls, playlist management, and playback state tracking within Electron.

**What needs to be ported:**

- Replace `vlcService.ts` with Electron-compatible player
- Options:
  - Use Electron's built-in media playback (web player in render process)
  - Use `mpv.js` or similar native player integration
  - Use `electron-youtube-dl` for streaming
- Implement `addMediaBlockToPlaylist(block)` function
- Implement playback state tracking
- Implement skip/pause/resume controls

**Dependencies:** Requires step 3 (stream manager available)

---

### 5. Port API endpoints as IPC handlers

**Status:** Not Started
**Files:**

- `src/electron/main.ts` (add new IPC handlers)
- `src/electron/handlers/streamHandlers.ts` (new - IPC handler layer)
- Old service `src/routes/` and `src/controllers/` remain in Express API

**Architecture:** Dual-layer approach

- **IPC Layer (Electron):** Direct database access through Electron IPC handlers for in-app operations
- **API Layer (Express):** Keep existing REST API intact for potential external clients or remote control

**IPC Handlers to create (for in-app use):**

Stream Control:

- `startContinuousStream(args)` - Start a continuous stream
- `getStreamStatus()` - Get current stream status
- `stopStream()` - Stop the current stream

Admin/Configuration:

- Stream progression queries (current on-deck, upcoming blocks)
- Manual stream interventions (skip ahead, rewind, restart)
- Stream configuration management
- Facet/tag management for stream generation

**Express API Layer (existing, keep functional):**

- Continue running the old Express server alongside Electron service
- Controllers in `old service/src/routes/` handle REST requests
- Shares the same SQLite database with Electron service
- Allows for remote stream control and monitoring if needed

**Addendums (TBD - to be determined with user before implementation):**

- [ ] Which stream control endpoints should be exposed via IPC?
- [ ] What stream status/telemetry should be queryable from React UI?
- [ ] Any manual stream intervention endpoints needed (skip, rewind, etc)?
- [ ] Configuration endpoints for changing stream parameters at runtime?
- [ ] Should Express API and Electron service share same DB, or separate instances?
- [ ] Any remote monitoring/API endpoints needed beyond what Express already provides?

---

## Notes

- The old service is located at: `old service/src/`
- The new service is being integrated into: `src/electron/`
- Key analog: The old `backgroundService.ts` maps to `src/electron/services/backgroundService.ts`
- All database operations should use the existing Prism Electron data model (SQLite) that already exists in the app
- The streaming logic should integrate with the existing media data structure defined in `types.d.ts`
