# Repository and Stream Services Porting - Completed

## Session Summary

Completed a major porting effort to integrate the old Kaleidoscope service backend into the Electron main process. All core data repositories and stream management services are now ported and ready for integration.

## Repositories Created (11 total)

### Media Type Repositories

1. **TagRepository** - Tag management with holiday/exclusion support (13 methods)
2. **MovieRepository** - Movie CRUD with tag associations (10 methods)
3. **ShowRepository** - Show management with episode handling (12 methods)
4. **ShortRepository** - Simple media type template (8 methods)
5. **MusicRepository** - Music with artist field (8 methods)
6. **CommercialRepository** - Commercial media management (8 methods)
7. **PromoRepository** - Promotional media management (8 methods)
8. **BumperRepository** - Bumper media management (8 methods)

### Complex Repositories

9. **FacetRepository** - Genre/aesthetic combinations for procedural generation (6 methods)
10. **CollectionRepository** - Pre-curated collections with sequencing (11 methods)
11. **EpisodeProgressionRepository** - Show episode progression tracking per stream type (10 methods)
12. **RecentlyUsedMediaRepository** - Media usage tracking with expiration (11 methods)

## Stream Services Created

### 1. StreamManager (`src/electron/services/streamManager.ts`)

- Queue management: onDeck (currently playing) and upcoming (queued) streams
- Stream lifecycle: initialize, populate, consume media blocks
- Stream state: continuous stream flag, stream parameters, variation tracking
- Methods:
  - `initializeStream()` - Start continuous stream
  - `getOnDeckStream()` / `getUpcomingStream()` - Access queues
  - `removeFirstItemFromOnDeck()` - Consume next media
  - `getStreamStatus()` - Report current streaming state
  - `stopContinuousStream()` - Clean shutdown

### 2. StreamConstructor (`src/electron/services/streamConstructor.ts`)

- Continuous stream generation: fills time from now to midnight
- Media selection: random choice between shows/movies with episode progression
- Episode progression: tracks which episode to play next per stream type
- Methods:
  - `constructStream()` - Main entry point with stream type dispatch
  - `selectRandomMediaForStream()` - Random media selection
  - `getNextEpisodeForShow()` - Episode progression management
  - `selectRandomFacetCombo()` - Random genre/aesthetic selection
  - `findMediaWithFacet()` - Find media by facet combination

## Type Definitions Created

1. **StreamType** enum - `Cont` (continuous), `Block` (scheduled), `Adhoc` (user-configured)
2. **IStreamRequest** interface - Stream parameters (title, password, tags, etc.)
3. **MediaBlock** class - Media with timing info (duration, startTime, endTime)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Electron Main Process                                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Database Layer (SQLite)                             │ │
│  │  - 30+ tables with foreign keys                     │ │
│  │  - 50+ indexes for performance                      │ │
│  │  - User data directory: kaleidoscope.db             │ │
│  └──────────────────────────────────────────────────────┘ │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Repository Layer (Data Access)                      │ │
│  │  - 12 repositories for all media types              │ │
│  │  - Tag filtering and associations                   │ │
│  │  - Episode progression tracking                     │ │
│  │  - Media usage tracking                             │ │
│  └──────────────────────────────────────────────────────┘ │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Stream Services (Business Logic)                    │ │
│  │  - StreamManager: queue management                  │ │
│  │  - StreamConstructor: media block generation        │ │
│  │  - BackgroundService: daily cycle management        │ │
│  └──────────────────────────────────────────────────────┘ │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ IPC Handlers (Next Step)                            │ │
│  │  - Stream control (start, stop, status)             │ │
│  │  - Media management (CRUD)                          │ │
│  │  - Admin operations                                 │ │
│  └──────────────────────────────────────────────────────┘ │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ React Frontend (Preload/IPC)                        │ │
│  │  - All handler calls via window.electron API        │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### Database Layer

- ✅ SQLite with WAL mode for concurrent access
- ✅ Foreign key constraints for referential integrity
- ✅ Comprehensive indexing for query performance
- ✅ All 30+ tables: media types, tags, facets, collections, progressions, etc.

### Repository Pattern

- ✅ Consistent CRUD interface across all repositories
- ✅ Singleton export pattern for global access
- ✅ Transaction support for atomic operations
- ✅ Tag association management
- ✅ Random media selection for stream construction

### Stream Management

- ✅ Continuous stream construction until end-of-day
- ✅ Episode progression tracking per stream type
- ✅ OnDeck/Upcoming queue management
- ✅ Facet-based media selection (procedural)
- ✅ Media block generation with timing

### Background Service

- ✅ Cycle check loop (5-minute intervals on world clock marks)
- ✅ End-of-day marker detection
- ✅ Stream reconstruction 30 minutes before midnight
- ✅ Daily transitions at midnight

## Database Schema

All 30+ tables ported with proper relationships:

**Media Types** (movies, shows, episodes, shorts, music, commercials, promos, bumpers)
**Tags** (genres, eras, aesthetics, specialties, age groups, music genres, holidays)
**Associations** (media_tags, show_tags, episode_tags, etc.)
**System** (facets, collections, collection_items, episode_progressions, recently_used_media)

## Next Steps (Remaining Work)

### 1. Media Player Integration

- Replace VLC with Electron native player (WIP)
- Implement playback controls (play, pause, seek, volume)
- Connect media blocks to playback queue

### 2. IPC Handlers

- Expose stream control endpoints (initStream, stopStream, getStatus)
- Expose media management endpoints (create, update, delete)
- Connect to React frontend via preload

### 3. Integration Testing

- Test full streaming pipeline end-to-end
- Validate database queries and stream construction
- Test episode progression across multiple stream types

### 4. Advanced Features (Phase 2)

- Procedural stream generation with tag filtering
- Buffer media insertion between main content
- Adhoc stream construction for user-configured streams
- Show scheduling blocks with cadence alignment

## File Structure

```
src/electron/
├── db/
│   ├── sqlite.ts          # SQLite connection & initialization
│   └── db.ts              # Public DB API
├── repositories/
│   ├── index.ts           # Barrel export
│   ├── tagsRepository.ts
│   ├── movieRepository.ts
│   ├── showRepository.ts
│   ├── shortRepository.ts
│   ├── musicRepository.ts
│   ├── commercialRepository.ts
│   ├── promoRepository.ts
│   ├── bumperRepository.ts
│   ├── facetRepository.ts
│   ├── collectionRepository.ts
│   ├── episodeProgressionRepository.ts
│   └── recentlyUsedMediaRepository.ts
├── services/
│   ├── backgroundService.ts
│   ├── streamManager.ts
│   └── streamConstructor.ts
├── types/
│   ├── index.ts
│   ├── StreamType.ts
│   ├── StreamRequest.ts
│   └── mediaBlock.ts
└── main.ts                # Updated with DB initialization
```

## NPM Dependencies Added

- `better-sqlite3@11.x` - SQLite driver for Node.js
- `@types/better-sqlite3` - TypeScript type definitions
- `moment` - Date/time calculations (already present)

## Code Quality

- ✅ All TypeScript strict mode
- ✅ Full type coverage for all interfaces
- ✅ Comprehensive error handling
- ✅ Singleton pattern for repositories
- ✅ Transaction support for data consistency
- ✅ Consistent method naming across all repositories

## Testing Recommendations

1. **Unit Tests**

   - Repository CRUD operations
   - Stream construction logic
   - Episode progression tracking

2. **Integration Tests**

   - Full streaming pipeline (construct stream → onDeck → consume)
   - Episode progression across multiple stream types
   - Tag filtering and association

3. **End-to-End Tests**
   - IPC communication with frontend
   - Background service cycle checks
   - Daily stream reconstruction

## Notes

- VLC service stub left in place for future integration
- All TODO comments indicate where Electron player integration needed
- Database path: `app.getPath('userData')/kaleidoscope.db` (platform-specific)
- Stream construction currently supports Continuous streams only (Block/Adhoc marked as TODO)
- Procedural stream generation uses simple random selection (full facet walking TODO for Phase 2)
