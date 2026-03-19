# Kaleidoscope — Electron Backend Accounting

**Generated:** 2026-03-09 (v2)  
**Previous revision:** 2026-03-08  
**Scope:** Stream loop, builders + supporting functions, database layer  
**Excluded:** UI (React), player implementations (VLC/Electron/Web/FFmpeg-Plex), FFMPEG service

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Stream Construction Pipeline](#2-stream-construction-pipeline)
3. [Buffer Construction System](#3-buffer-construction-system)
4. [Media Selection System](#4-media-selection-system)
5. [Prism System (Spectrum / Facets)](#5-prism-system-spectrum--facets)
6. [Runtime Loop (Background Service)](#6-runtime-loop-background-service)
7. [Stream Manager (State Store)](#7-stream-manager-state-store)
8. [Player Manager (Abstraction)](#8-player-manager-abstraction)
9. [Database Layer](#9-database-layer)
10. [Repositories](#10-repositories)
11. [Supporting Utilities](#11-supporting-utilities)
12. [Type System](#12-type-system)
13. [Recently-Used Persistence Design](#13-recently-used-persistence-design)
14. [Logic Analysis & Findings](#14-logic-analysis--findings)
15. [Changes Since v1](#15-changes-since-v1)

---

## 1. Architecture Overview

```
User hits "Go"
       │
       ▼
  streamService.createStream()            ← entry point, routes by StreamType
       │
       ├─► buildContinuousStream()        ← cadenced / uncadenced + themed / random
       │        │
       │        ├─► initializeContinuousStream()    ← load recently-used, holidays, progressions, first media
       │        ├─► buildCadencedContinuousStream()
       │        │        ├─► buildCadencedWithInitialBuffer()   ← Case A (mid-cadence)
       │        │        └─► buildCadencedWithoutInitialBuffer()← Case B (on mark)
       │        │                 │
       │        │                 └─► buildStreamIteration()    ← while loop: select anchors → fill buffers
       │        │                           ├─► selectThemedMedia() / selectRandomShowOrMovie()
       │        │                           ├─► createBuffer() (backfill for preceding block)
       │        │                           └─► fillStreamBlockBuffers() (cascade remainder through all blocks)
       │        │
       │        └─► (uncadenced: not yet implemented)
       │
       └─► buildAdhocStream()             ← stub only

  After construction:
       │
       ├─► streamManager.setContinuousStream(true)   ← marks stream active
       ├─► streamManager.setContinuousStreamArgs()   ← stores construction args
       ├─► playerManager.addMediaBlockToPlayer()     ← immediate push for first blocks
       ├─► streamManager.addItemToOnDeck()           ← Slots 1–2
       └─► streamManager.addToUpcomingStream()       ← rest of day

  Background loop (every 5 min):
       │
       └─► cycleCheck()
              ├─► validateUpcomingMediaFiles()     ← file existence check (fs.existsSync)
              ├─► prune expired On Deck blocks
              │     ├─► recordPlayedMovie()          ← persist movie to recently_used_movies
              │     └─► recordPlayedEpisodeProgression() ← upsert episode_progression
              ├─► promote Upcoming → On Deck
              └─► rolloverToNextDay()              ← when Upcoming ≤ 1 block
```

---

## 2. Stream Construction Pipeline

### File: `src/electron/services/streamConstruction/continuousStreamBuilder.ts`

| Function                            | Visibility      | Status         | Purpose                                                                                                                      |
| ----------------------------------- | --------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `buildContinuousStream`             | **export**      | ✅ Implemented | Top-level entry — initializes, routes to cadenced/uncadenced, sets `setContinuousStream(true)` + `setContinuousStreamArgs()` |
| `initializeContinuousStream`        | private         | ✅ Implemented | Loads holidays, progressions, recently-used (via `streamManager.loadRecentlyUsedMovies(timepoint)`), selects first media     |
| `buildCadencedContinuousStream`     | private         | ✅ Implemented | Routes to WithInitialBuffer or WithoutInitialBuffer based on cadence alignment                                               |
| `buildCadencedWithInitialBuffer`    | private (async) | ✅ Implemented | 8-step flow: initial buffer → first anchor → player pushes → iteration → On Deck/Upcoming                                    |
| `buildCadencedWithoutInitialBuffer` | private (async) | ✅ Implemented | 6-step flow: first anchor → player push → iteration → On Deck/Upcoming                                                       |
| `buildStreamIteration`              | private         | ✅ Implemented | While loop: select anchors until EOD, compute backfill buffer, fill all block buffers                                        |
| `fillStreamBlockBuffers`            | private         | ✅ Implemented | Cascade-remainder buffer fill for tightly-packed cadenced blocks                                                             |
| `rolloverToNextDay`                 | **export**      | ✅ Implemented | Day boundary: uses last Upcoming block as context, generates next day's stream, backfills its buffer                         |

### File: `src/electron/services/streamConstruction/adhocStreamBuilder.ts`

| Function           | Visibility | Status  | Purpose                                          |
| ------------------ | ---------- | ------- | ------------------------------------------------ |
| `buildAdhocStream` | **export** | ❌ Stub | Returns empty with "not yet implemented" message |

### File: `src/electron/services/streamService.ts`

| Function       | Visibility | Status         | Purpose                                                      |
| -------------- | ---------- | -------------- | ------------------------------------------------------------ |
| `createStream` | **export** | ✅ Implemented | Switch on StreamType → routes to continuous or adhoc builder |

---

## 3. Buffer Construction System

### File: `src/electron/services/bufferConstructor.ts`

Constructs the filler content (commercials, shorts, music, promos) that plays between anchor media.

| Function                    | Visibility | Status         | Purpose                                                                                                          |
| --------------------------- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `createBuffer`              | **export** | ✅ Implemented | Main entry: splits into Half A (previous anchor) + Half B (next anchor), adds promo, calls `constructBufferHalf` |
| `constructBufferHalf`       | **export** | ✅ Implemented | Uses spectrum prism to get media pool, selects by strategy (short/medium/large), records recently-used           |
| `selectCommercials`         | **export** | ✅ Implemented | Greedy fill: exact match → pair match → random pick → fallback to defaults. Era-tag preference.                  |
| `selectShortsAndMusic`      | **export** | ✅ Implemented | Combined shuffle of shorts + music, picks up to `targetCount` under max duration                                 |
| `determineBufferStrategy`   | private    | ✅ Implemented | ≤7min → short (commercials only), ≤15min → medium (0-2 shorts/music), >15min → large (1-3 shorts/music)          |
| `randomizeShortsMusicCount` | private    | ✅ Implemented | Returns random count based on strategy tier                                                                      |
| `splitCountBetweenHalves`   | private    | ✅ Implemented | Divides shorts/music count between Half A and Half B                                                             |

**Key design:**

- Buffer is split into two themed halves: Half A (themed to the show that just played) and Half B (themed to the show about to play)
- A channel-ident promo (15s) is inserted between the halves
- If one side has no tags, the other side gets the entire duration
- Commercials fill greedy (exact → pair → random → defaults)
- Recently-used tracking prevents re-selection within recency windows

---

## 4. Media Selection System

### File: `src/electron/services/streamConstruction/mediaSelector.ts`

| Function                       | Visibility | Status         | Purpose                                                                                                                                                                     |
| ------------------------------ | ---------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectRandomShowOrMovie`      | **export** | ✅ Implemented | Coin flip (>90min biased to movies), respects recently-used movies, falls back to shows                                                                                     |
| `selectMediaWithHolidayTag`    | **export** | ✅ Implemented | Gathers movies + episodes with specific holiday tag, weighted random between pools                                                                                          |
| `selectSpecialtyAdjacentMedia` | **export** | ✅ Implemented | Delegates to `selectMovieOrShow` with specialty tags                                                                                                                        |
| `selectFacetAdjacentMedia`     | **export** | ✅ Implemented | Finds matching facets, walks relationships by weighted distance, tries each until media found                                                                               |
| `selectThemedMedia`            | **export** | ✅ Implemented | 3-path algorithm: (1) holiday date → saturate, (2) holiday season → budget-gated, (3) non-holiday → specialty or facet-adjacent. Smart shuffle prevents back-to-back movies |

### File: `src/electron/services/streamConstruction/selectionHelpers.ts`

| Function                        | Visibility | Status         | Purpose                                                                                              |
| ------------------------------- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `isHolidayDate`                 | **export** | ✅ Implemented | MM-DD match against holiday dates                                                                    |
| `isHolidaySeason`               | **export** | ✅ Implemented | MM-DD range check against season spans (handles year-wrap: `start > end` → OR logic)                 |
| `getDateString`                 | **export** | ✅ Implemented | Unix seconds → local YYYY-MM-DD                                                                      |
| `getProgressionsByStreamType`   | **export** | ✅ Implemented | DB query → Map<showItemId, episodeNumber>                                                            |
| `doesNextEpisodeFitDuration`    | **export** | ✅ Implemented | Checks episode fits in available duration, handles wrap-around                                       |
| `cleanupExpiredRecentlyUsed`    | **export** | ✅ Implemented | Converts timepoint to ISO, deletes expired records from `recently_used_movies` where expiresAt ≤ ISO |
| `getEpisodeFromShowCandidates`  | **export** | ✅ Implemented | Shuffle shows → find first whose next episode fits → increment progression                           |
| `selectMovieOrShow`             | **export** | ✅ Implemented | Coin flip: try movie first or episode first, with fallback to the other                              |
| `trySelectMovie`                | private    | ✅ Implemented | Filter recently-used, random pick from matching movies                                               |
| `trySelectEpisode`              | private    | ✅ Implemented | Query shows by tags+ageGroups+duration, delegate to `getEpisodeFromShowCandidates`                   |
| `filterRecentlyUsedCommercials` | **export** | ✅ Implemented | Prune in-memory map >3h before timepoint, filter out recently-used                                   |
| `filterRecentlyUsedShorts`      | **export** | ✅ Implemented | Prune in-memory map >24h before timepoint, filter out recently-used                                  |
| `filterRecentlyUsedMusic`       | **export** | ✅ Implemented | Prune in-memory map >24h before timepoint, filter out recently-used                                  |
| `filterRecentlyUsedMovies`      | **export** | ✅ Implemented | Prune in-memory map >48h before timepoint, filter out recently-used                                  |

**Eviction windows (consistent across all paths):**

| Media Type  | In-Memory Eviction | DB Expiry (movies only) |
| ----------- | ------------------ | ----------------------- |
| Movies      | 48h                | 48h (`expiresAt`)       |
| Commercials | 3h                 | N/A (session-only)      |
| Shorts      | 24h                | N/A (session-only)      |
| Music       | 24h                | N/A (session-only)      |

---

## 5. Prism System (Spectrum / Facets)

### File: `src/electron/prisms/spectrum.ts`

The "Spectrum" prism is the buffer media pool builder. It accumulates media through a tiered gate system, stopping early if pool is sufficient.

| Function                          | Visibility | Status         | Purpose                                                                                                                                                                               |
| --------------------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectBufferMedia`               | **export** | ✅ Implemented | 5-gate cascade: Holiday → Specialty → Genre/Aesthetic → AgeGroup → Untagged. Early return if pool passes `isBufferMediaPoolValid`. If invalid, shuffle-and-halve to preserve variety. |
| `isBufferMediaPoolValid`          | **export** | ✅ Implemented | Estimates 4-hour buffer needs: valid if commercials + shorts/music cover a 2-hour commercial pool                                                                                     |
| `getHolidayBufferMedia`           | **export** | ✅ Implemented | Queries repos for holiday-tagged commercials, shorts, music                                                                                                                           |
| `getSpecialtyBufferMedia`         | **export** | ✅ Implemented | Queries repos for specialty-tagged media                                                                                                                                              |
| `getGenreAndAestheticBufferMedia` | **export** | ✅ Implemented | Queries repos, but music is empty (TODO: use mosaic for music genre)                                                                                                                  |
| `getAgeGroupOnlyBufferMedia`      | **export** | ✅ Implemented | Queries repos for age-group-only media                                                                                                                                                |
| `getUntaggedBufferMedia`          | **export** | ✅ Implemented | Queries repos for untagged media                                                                                                                                                      |
| `getRandomBufferMedia`            | **export** | ✅ Implemented | 2-hour random commercial pool + random shorts/music                                                                                                                                   |
| `getAgeGroups`                    | private    | ✅ Implemented | Age group adjacency (base ± 1 sequence)                                                                                                                                               |

### File: `src/electron/prisms/facets.ts`

| Function                  | Visibility | Status         | Purpose                                                         |
| ------------------------- | ---------- | -------------- | --------------------------------------------------------------- |
| `selectFacetRelationship` | **export** | ✅ Implemented | Weighted random by inverse distance (closer facets more likely) |
| `findMatchingFacets`      | **export** | ✅ Implemented | All genre×aesthetic pairings → facet DB lookup                  |

### File: `src/electron/prisms/core.ts`

| Function                     | Visibility | Status         | Purpose                                                                 |
| ---------------------------- | ---------- | -------------- | ----------------------------------------------------------------------- |
| `getAgeGroupAdjacency`       | **export** | ✅ Implemented | Base age group + adjacent (±1 sequence)                                 |
| `cleanupExpiredRecentlyUsed` | **export** | ✅ Implemented | Converts timepoint to ISO, deletes from `recently_used_movies`          |
| `willEpisodeFitInDuration`   | **export** | ✅ Implemented | Duration check with overDuration handling                               |
| `getNextEpisodeForShow`      | **export** | ✅ Implemented | Progression-aware episode selection, creates progression if none exists |
| `selectRandomEpisodeOrMovie` | **export** | ✅ Implemented | 50/50 show/movie selection with fallback, uses `getNextEpisodeForShow`  |

**Note:** `selectRandomEpisodeOrMovie` is fully implemented but is NOT used by the stream construction pipeline (which uses `mediaSelector.ts`'s `selectRandomShowOrMovie`). It's only called by `core.ts`'s own private `getNextEpisodeFromShows`.

### File: `src/electron/services/facetWalkabilityService.ts`

| Function        | Visibility | Status         | Purpose                                                                                                                |
| --------------- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `canFacetsWalk` | **export** | ✅ Implemented | Graph-based: builds adjacency map of facets, DFS to find largest connected component, checks if ≥ percentile threshold |

### File: `src/electron/services/holidayIntentCacheManager.ts`

| Function                        | Visibility | Status         | Purpose                                                                      |
| ------------------------------- | ---------- | -------------- | ---------------------------------------------------------------------------- |
| `getIntent`                     | public     | ✅ Implemented | Lazy-load or return cached HolidayIntent                                     |
| `calculateIntent`               | private    | ✅ Implemented | Query movie+show minutes for a holiday tag, distribute across 3-day rotation |
| `calculateThreeDayDistribution` | private    | ✅ Implemented | Target 4.5h/day, spread evenly if less available                             |
| `getTodayTargetMinutes`         | public     | ✅ Implemented | Get today's minute budget from 3-day rotation                                |
| `getRotationDay`                | private    | ✅ Implemented | Deterministic day (1/2/3) from epoch-based modulo                            |
| `ensureCurrentRotation`         | private    | ✅ Implemented | Resets daily counter when date changes                                       |
| `canAddMoreContent`             | public     | ✅ Implemented | selectedMinutesToday < todayTarget                                           |
| `trackSelectedMinutes`          | public     | ✅ Implemented | Accumulates minutes for today                                                |
| `getRemainingMinutesToday`      | public     | ✅ Implemented | todayTarget - selectedMinutesToday                                           |
| `invalidateHoliday`             | public     | ✅ Implemented | Marks cache entry as stale                                                   |
| `clear`                         | public     | ✅ Implemented | Resets entire cache                                                          |

---

## 6. Runtime Loop (Background Service)

### File: `src/electron/services/backgroundService.ts`

| Function                       | Visibility      | Status         | Purpose                                                                               |
| ------------------------------ | --------------- | -------------- | ------------------------------------------------------------------------------------- |
| `startBackgroundService`       | **export**      | ✅ Implemented | Sets EOD/tomorrow markers, schedules first cycleCheck                                 |
| `stopBackgroundService`        | **export**      | ✅ Implemented | Clears timeout                                                                        |
| `cycleCheck`                   | private (async) | ✅ Implemented | Every 5 min: validate files, prune On Deck, promote Upcoming→On Deck, day rollover    |
| `calculateDelayToNextInterval` | private         | ✅ Implemented | Aligns to 5-minute marks via modulo                                                   |
| `setEndOfDayMarker`            | private         | ✅ Implemented | 23:30 local time                                                                      |
| `setTomorrow`                  | private         | ✅ Implemented | midnight tomorrow local time                                                          |
| `getCurrentUnixTimestamp`      | private         | ✅ Implemented | `Math.floor(Date.now() / 1000)`                                                       |
| `validateUpcomingMediaFiles`   | private         | ✅ Implemented | Checks `fs.existsSync` on anchor + buffer media paths for blocks in next 5-min window |

**Cycle check logic:**

1. Validate upcoming media files (`fs.existsSync` on blocks within next interval, logs missing)
2. Prune On Deck: while `onDeck[1].startTime` has passed, remove `onDeck[0]`, call `recordPlayedMovie()` + `recordPlayedEpisodeProgression()` on the expired block
3. Promote: if `onDeck.length < 3` && `upcoming.length > 0`, shift from Upcoming → On Deck
4. Day rollover: if `upcoming.length === 1` && (no buffer yet OR < 30 min left), call `rolloverToNextDay`
5. Update tomorrow / endOfDayMarker if passed
6. Schedule next cycle

---

## 7. Stream Manager (State Store)

### File: `src/electron/services/streamManager.ts`

**Unified singleton architecture:** All state is held in the `StreamManager` class singleton. Module-level exported functions are thin proxies to the singleton for API compatibility. No duplicate state.

**Module-level DAL functions (DB ↔ memory sync):**

| Function                         | Status         | Purpose                                                                                    |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `loadRecentlyUsedMovies(tp)`     | ✅ Implemented | Reads `recently_used_movies` table (using timepoint-based ISO expiry), populates in-memory |
| `recordPlayedMovie(block)`       | ✅ Implemented | Writes to `recently_used_movies` with 48h `expiresAt` (On Deck pop trigger)                |
| `recordPlayedEpisodeProgression` | ✅ Implemented | Upserts to `episode_progression` via repository (On Deck pop trigger)                      |

**Module-level exported functions (state access via singleton proxy):**

| Function                                              | Status         | Purpose                                                         |
| ----------------------------------------------------- | -------------- | --------------------------------------------------------------- |
| `addItemToOnDeck`                                     | ✅ Implemented | Push to onDeck array                                            |
| `removeFirstItemFromOnDeck`                           | ✅ Implemented | Shift from onDeck                                               |
| `removeFirstItemFromUpcoming`                         | ✅ Implemented | Shift from upcoming                                             |
| `addToUpcomingStream`                                 | ✅ Implemented | Push to upcoming array                                          |
| `getUpcomingStream` / `getOnDeckStream`               | ✅ Implemented | Getters                                                         |
| `isContinuousStream` / `setContinuousStream`          | ✅ Implemented | Boolean flag                                                    |
| `getContinuousStreamArgs` / `setContinuousStreamArgs` | ✅ Implemented | IStreamRequest storage                                          |
| `getStreamStatus`                                     | ✅ Implemented | Summary object for UI                                           |
| `stopContinuousStream`                                | ✅ Implemented | Calls `streamManagerInstance.reset()` (clears all maps + state) |
| `initializeStream`                                    | ❌ Empty       | Stub — never populates anything                                 |
| `initializeOnDeckStream`                              | ⚠️ Legacy      | Shifts 2 items from upcoming→onDeck (not used by new flow)      |
| `addInitialMediaBlocks`                               | ❌ Stub        | TODO: send onDeck to player                                     |

**Singleton class internals:**

| Category                    | Methods                                                              | Status      |
| --------------------------- | -------------------------------------------------------------------- | ----------- |
| Recently used (movies)      | get/set/add/remove + `getActiveRecentlyUsedMovieIds` (prunes >48h)   | ✅          |
| Recently used (commercials) | get/set/add/remove                                                   | ✅          |
| Recently used (shorts)      | get/set/add/remove                                                   | ✅          |
| Recently used (music)       | get/set/add/remove                                                   | ✅          |
| Progression map             | get/set/update                                                       | ✅          |
| Remainder time              | get/set                                                              | ✅          |
| On Deck / Upcoming          | get/set (used by all proxy functions)                                | ✅          |
| Stream flags                | isContinuous/setContinuous, getArgs/setArgs, getVariance/setVariance | ✅          |
| Next iteration              | getNextIterationTimepoint, getNextIterationFirstMedia                | ✅ (unused) |
| Reset                       | `reset()` — clears all fields including all 5 recently-used maps     | ✅          |

---

## 8. Player Manager (Abstraction)

### File: `src/electron/services/playerManager.ts`

| Function                                 | Status             | Purpose                                                           |
| ---------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `addMediaBlockToPlayer`                  | ⚠️ Stub per player | Switch on type: vlc/electron/web/ffmpeg-plex → all TODO log stubs |
| `initializePlayer`                       | ⚠️ Stub            | Sets type + log                                                   |
| `stopPlayer`                             | ⚠️ Stub            | Log only                                                          |
| `play`                                   | ⚠️ Stub            | Log only                                                          |
| `setPlayerType` / `getPlayerType`        | ✅                 | State accessor                                                    |
| `setPlayerInitialized` / `isPlayerReady` | ✅                 | Readiness flag                                                    |

All four player backends (vlc, electron, web, ffmpeg-plex) are registered in the switch statements but do nothing beyond logging. The control flow is sound — callers `await` the function — but no actual media playback occurs yet.

---

## 9. Database Layer

### File: `src/electron/db/sqlite.ts`

- **Engine:** better-sqlite3 (synchronous, WAL mode, foreign keys ON)
- **Location:** `app.getPath('userData')/kaleidoscope.db`
- **Testing:** `setDatabase()` allows injecting an in-memory DB for tests

### Tables (30 total)

| Category          | Tables                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Media**         | `movies`, `shows`, `episodes`, `commercials`, `shorts`, `music`, `promos`, `bumpers`                                                         |
| **Tags**          | `tags`, `holiday_dates`, `holiday_exclusion_tags`                                                                                            |
| **Tag junctions** | `movie_tags`, `show_tags`, `show_secondary_tags`, `episode_tags`, `commercial_tags`, `short_tags`, `promo_tags`, `bumper_tags`, `music_tags` |
| **Facets**        | `facets`, `facet_distances`                                                                                                                  |
| **Mosaics**       | `mosaics`                                                                                                                                    |
| **Collections**   | `collections`, `collection_items`                                                                                                            |
| **Recently used** | `recently_used_commercials`, `recently_used_shorts`, `recently_used_music`, `recently_used_movies`                                           |
| **Progression**   | `episode_progression`                                                                                                                        |
| **Config**        | `env_configuration`                                                                                                                          |

### Indexes

55 indexes defined. See [Index Schema Issues](#-bug--index-schema-references-non-existent-columnstables) for mismatches.

---

## 10. Repositories

13 active repository files, all following the singleton + class pattern with synchronous `better-sqlite3` operations.

### Media Repositories (CRUD + query)

| Repository             | Entity         | Notable Query Methods                                                                                                                |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `movieRepository`      | Movie          | `findRandomMovieUnderDurationExcluding`, `findByTagsAndAgeGroupsUnderDuration`, `getTotalMinutesByHolidayTag`                        |
| `showRepository`       | Show + Episode | `findAllShowsUnderDuration`, `findByEpisodeTags`, `findByIdsWithProgressionCheck`, `getTotalMinutesByHolidayTag`, secondary tag sync |
| `commercialRepository` | Commercial     | 4-tier holiday cascade, `findByGenreAestheticAgeGroup`, `findByDefaultSpecialtyTag`, CTE pool selection                              |
| `shortRepository`      | Short          | Same tier pattern + `findRandomShortsAndMusicByCount` (UNION ALL with music table)                                                   |
| `musicRepository`      | Music          | Same tier pattern                                                                                                                    |
| `promoRepository`      | Promo          | Simple CRUD + `findRandomPromo`                                                                                                      |
| `bumperRepository`     | Bumper         | Simple CRUD + `findRandomBumper`, `findByTag`                                                                                        |

### System Repositories

| Repository                     | Entity                             | Purpose                                                                                             |
| ------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `tagsRepository`               | Tag + HolidayDates + ExclusionTags | Central tag management, `findActiveHolidaysByDate` with season-range and year-wrap                  |
| `facetRepository`              | Facet + FacetRelationshipItem      | Genre×Aesthetic pairs with distance graph                                                           |
| `mosaicRepository`             | Mosaic                             | Facet-linked configs for musical genres (JSON stored)                                               |
| `collectionRepository`         | Collection + CollectionItem        | User-curated media groupings                                                                        |
| `episodeProgressionRepository` | EpisodeProgression                 | Per-show per-streamType episode tracking, `upsertByShowAndStreamType()` for On Deck pop persistence |

### Dead Code

| Repository                    | Status  | Note                                                                                                   |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `recentlyUsedMediaRepository` | 🪦 DEAD | File still exists, imported NOWHERE. Targets non-existent `recently_used_media` table. Safe to delete. |

---

## 11. Supporting Utilities

### File: `src/electron/utils/common.ts`

| Function              | Purpose                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `findNextCadenceTime` | Finds next :00 or :30 mark from a unix timestamp. Returns current time if already on mark.            |
| `segmentTags`         | Splits Tag[] into SegmentedTags: `{ genreTags, aestheticTags, eraTags, specialtyTags, ageGroupTags }` |

### File: `factories/mediaBlock.factory.ts`

| Function           | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `createMediaBlock` | Simple factory: `new MediaBlock(buffer, mainBlock, startTime, duration)` |

---

## 12. Type System

### Global types (types.d.ts)

| Type                        | Key Fields                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `StreamType`                | Enum: `Cont`, `Block`, `Adhoc`                                                                                                         |
| `MediaType`                 | Enum: `Show`, `Episode`, `Movie`, `Short`, `Music`, `Commercial`, `Promo`, `Bumper`                                                    |
| `TagType`                   | Enum: `Genre`, `Aesthetic`, `Era`, `Specialty`, `AgeGroup`, `Holiday`, `MusicGenre`                                                    |
| `StreamConstructionOptions` | `{ Cadence: boolean, Themed: boolean, StreamType }`                                                                                    |
| `StreamInitializationData`  | `{ activeHolidayTags, progressionMap, startingTimepoint, iterationDuration, endOfTimeWindow, selectedFirstMedia, nextScheduledBlock }` |
| `SegmentedTags`             | `{ genreTags, aestheticTags, eraTags, specialtyTags, ageGroupTags }`                                                                   |
| `Movie`                     | `{ mediaItemId, title, path, duration, durationLimit, tags, isHolidayExclusive, ... }`                                                 |
| `Episode`                   | `{ mediaItemId, showItemId, episodeNumber, duration, overDuration, tags, ... }`                                                        |
| `Show`                      | `{ mediaItemId, title, episodes[], durationLimit, firstEpisodeOverDuration, tags, ... }`                                               |
| `Commercial/Short/Music`    | `{ mediaItemId, title, duration, path, tags, isHolidayExclusive, type }`                                                               |
| `Promo/Bumper`              | `{ mediaItemId, title, duration, path, tags }`                                                                                         |
| `Tag`                       | `{ tagId, name, type, seasonStartDate?, seasonEndDate?, holidayDates?, sequence? }`                                                    |
| `Facet`                     | `{ facetId, genre, aesthetic, facetRelationships: FacetRelationshipItem[] }`                                                           |
| `HolidayIntent`             | `{ holidayTagId, totalAvailableMinutes, threeDayDistribution, currentRotationDay, selectedMinutesToday, stale }`                       |
| `EpisodeProgression`        | `{ id?, showItemId, streamType, currentEpisodeNumber?, lastPlayedTimestamp?, nextEpisodeDurationLimit?, nextEpisodeOverDuration? }`    |

### Dead Types

| Type                | Status  | Note                                                             |
| ------------------- | ------- | ---------------------------------------------------------------- |
| `RecentlyUsedMedia` | 🪦 DEAD | Only used by dead `recentlyUsedMediaRepository`. Safe to remove. |

### Runtime types

| Type             | Location                              | Key Fields                                                                                                               |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `MediaBlock`     | `src/electron/types/MediaBlock.ts`    | `buffer: (Promo\|Music\|Short\|Commercial\|Bumper)[], anchorMedia?: Movie\|Episode, startTime: number, duration: number` |
| `IStreamRequest` | `src/electron/types/StreamRequest.ts` | `{ Title?, Env?, Password?, Tags?, Movies?, EndTime?, StartTime?, Cadence?, Themed? }`                                   |
| `StreamStatus`   | `streamManager.ts`                    | `{ isContinuous, hasUpcomingStream, onDeckLength, upcomingLength, streamArgs }`                                          |

---

## 13. Recently-Used Persistence Design

### Design Philosophy

DB writes happen ONLY when media finishes playing (On Deck pop = proof of playback). In-memory maps handle within-session deduplication. The DB handles cross-restart state for movies only.

### Movies (DB-persistent)

| Stage           | Location                         | Trigger                                                    |
| --------------- | -------------------------------- | ---------------------------------------------------------- |
| **DB → Memory** | `loadRecentlyUsedMovies(tp)`     | Called once during `initializeContinuousStream` at startup |
| **Memory only** | `addRecentlyUsedMovie(id, tp)`   | Called in `buildStreamIteration` during anchor selection   |
| **Memory → DB** | `recordPlayedMovie(block)`       | Called when block is pruned from On Deck (proof of play)   |
| **DB cleanup**  | `cleanupExpiredRecentlyUsed(tp)` | Called before media selection in `core.ts`                 |

### Buffer Media (session-only, no DB)

Commercials, shorts, and music are tracked in-memory only. Their maps start empty each session and are populated during buffer construction via `addRecentlyUsedCommercial/Short/Music`.

### Episode Progression (DB-persistent)

| Stage           | Location                                | Trigger                                                              |
| --------------- | --------------------------------------- | -------------------------------------------------------------------- |
| **DB → Memory** | `getProgressionsByStreamType(type)`     | Called during `initializeContinuousStream`, populates progressionMap |
| **Memory only** | `updateProgression(showId, epNum)`      | Called in `getEpisodeFromShowCandidates` during selection            |
| **Memory → DB** | `recordPlayedEpisodeProgression(block)` | Called when block is pruned from On Deck (proof of play)             |

### Dormant DB Tables

`recently_used_commercials`, `recently_used_shorts`, `recently_used_music` — tables exist in schema but nothing reads from or writes to them. They are remnants from before the session-only design decision.

---

## 14. Logic Analysis & Findings

### ✅ SOUND — Stream Construction Pipeline

The `buildContinuousStream` → `buildCadencedContinuousStream` → `buildStreamIteration` → `fillStreamBlockBuffers` chain is logically coherent:

- **Two startup cases** (Case A / Case B) are correctly identified by `findNextCadenceTime`
- **Player pushes** happen immediately for the first 1-2 blocks (buys construction time)
- **On Deck / Upcoming** are correctly populated after iteration (Slot 1 = currently playing, Slot 2 = next up)
- **Buffer-only blocks** (no anchorMedia) are correctly excluded from On Deck and pushed directly to player
- **Backfill buffers** are wrapped as MediaBlocks and sent to the player as standalone buffer-only blocks
- **Cascade remainder** in `fillStreamBlockBuffers` correctly propagates leftover time through tightly-packed blocks
- **Stream activation** `setContinuousStream(true)` and `setContinuousStreamArgs()` are called at the end of `buildContinuousStream`, gating the background service's prune loop and day rollover

### ✅ SOUND — Buffer Construction

The half-A / half-B / promo architecture is well-designed:

- Themed halves maintain continuity between shows
- Strategy tiers (short/medium/large) prevent shorts/music in short buffers
- Recently-used tracking prevents repetition within recency windows
- Commercial fill is greedy with exact-match → pair-match → random → default fallback chain

### ✅ SOUND — Media Selection

Three-path algorithm in `selectThemedMedia` is correct:

- Holiday date → saturate (all holiday content, weighted random between movies/episodes)
- Holiday season → budget-gated via `holidayIntentCacheManager` (3-day rotation)
- Non-holiday → specialty-adjacent or facet-adjacent with fallback chain to random

Smart shuffle (80/20 bias against repeating movie-after-movie) prevents monotony.

### ✅ SOUND — Background Cycle Loop

- Prune loop correctly handles multi-slot expiration after sleep/pause
- On Deck pop persists both movie recently-used and episode progression to DB
- Promotion from Upcoming → On Deck maintains 3-slot target
- Day rollover trigger (`upcoming.length === 1 && buffer empty or < 30 min`) is the right signal
- `rolloverToNextDay` correctly backfills the terminal block's buffer (only mutation of existing Upcoming block)

### ✅ SOUND — Stream Manager State

All state is unified in the singleton. Module-level functions are clean proxies. `reset()` clears all 5 recently-used maps plus all stream state. No more dual-state drift.

### ✅ SOUND — Holiday Season Year-Wrap

`isHolidaySeason` now correctly handles year-wrapping ranges (e.g., `11-15` to `01-05`) using OR logic: `dateString >= start || dateString <= end`.

### ✅ SOUND — Timepoint-Based Expiration

All DB expiration checks (`loadRecentlyUsedMovies`, `cleanupExpiredRecentlyUsed` in both `selectionHelpers.ts` and `core.ts`) convert the passed timepoint (unix seconds) to ISO and use it for deletion/selection. No more `Date.now()` drift.

### ✅ SOUND — File Validation

`validateUpcomingMediaFiles` now uses `fs.existsSync` on real blocks from On Deck and Upcoming within the next cycle interval. Logs missing files with titles and paths.

### 🐛 BUG — Index Schema References Non-Existent Columns/Tables

The `createIndexes()` method in `sqlite.ts` defines indexes on columns and tables that don't exist in the schema:

**Non-existent columns:**

- `idx_recently_used_commercials_usageContext` → `usageContext` column doesn't exist (table has `id`, `mediaItemId`, `expiresAt`)
- `idx_recently_used_commercials_usedAt` → `usedAt` column doesn't exist
- Same for `recently_used_shorts`, `recently_used_music`, `recently_used_movies` — all have `usageContext` and `usedAt` indexes but only have `expiresAt`

**Non-existent table:**

- `idx_recently_used_shows_*` (3 indexes) → `recently_used_shows` table does not exist

**Impact:** `this.db.exec(indexes)` runs all indexes as a single string. In better-sqlite3, `exec()` stops at the first error. Since these statements are ordered alphabetically and the recently-used indexes come after all the valid ones, the valid indexes DO get created before the error. But the `episode_progression` indexes (which come last) may NOT be created.

### 🐛 BUG — Trailing Commas in Recently-Used CREATE TABLE Statements

All four `recently_used_*` table CREATE statements have trailing commas:

```sql
CREATE TABLE IF NOT EXISTS recently_used_commercials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mediaItemId TEXT NOT NULL,
  expiresAt DATETIME,    ← TRAILING COMMA
)
```

SQLite does not allow trailing commas in column definitions. On a fresh database this will cause `CREATE TABLE` to fail. If the app works today, it's because the database was created before these statements were modified, and `IF NOT EXISTS` skips already-existing tables.

### ⚠️ CONCERN — Duplicate Functions Across Files

Two functions are duplicated with identical implementations:

1. **`cleanupExpiredRecentlyUsed(timepoint)`** — exists in both `selectionHelpers.ts` and `core.ts`. Both convert timepoint to ISO and delete from `recently_used_movies`.

2. **`getAgeGroups` / `getAgeGroupAdjacency`** — `spectrum.ts` has private `getAgeGroups`, `core.ts` has exported `getAgeGroupAdjacency`. Identical logic (base ± 1 sequence adjacency).

No functional bug, but a maintenance risk — changes to one copy could miss the other.

### ⚠️ CONCERN — `recordPlayedEpisodeProgression` Hardcodes `StreamType.Cont`

```ts
episodeProgressionRepository.upsertByShowAndStreamType(
  episode.showItemId,
  StreamType.Cont, // ← hardcoded
  episode.episodeNumber,
);
```

When adhoc streams are implemented, episodes played in an adhoc stream would incorrectly record their progression under the Continuous stream type.

### ⚠️ CONCERN — Biased Shuffle in 3 Places

Three locations use `array.sort(() => 0.5 - Math.random())` instead of Fisher-Yates:

1. `selectionHelpers.ts` — `trySelectMovie` shuffle
2. `bufferConstructor.ts` — `constructBufferHalf` final shuffle
3. `bufferConstructor.ts` — `selectShortsAndMusic` combined shuffle

`Math.random() - 0.5` as a comparator produces non-uniform distributions. `spectrum.ts` already has a correct Fisher-Yates `shuffle()` function that could be shared.

### ⚠️ CONCERN — Player Pushes Happen Before On Deck Registration

In both `buildCadencedWithInitialBuffer` and `buildCadencedWithoutInitialBuffer`, the player receives blocks (steps 3/5) before `addItemToOnDeck` (step 8). This is intentional for latency, but means the player's playlist and On Deck are not in sync during construction. If the cycle check fires during construction (unlikely with 5-min interval but possible), it could prune an On Deck that doesn't yet exist.

### ⚠️ CONCERN — endOfDayMarker Hardcoded to 23:30

`setEndOfDayMarker` creates a marker at 23:30 local time. But `initializeContinuousStream` uses `endOfDay()` from date-fns (23:59:59.999). The stream builds blocks until 23:59:59, but the background service's "prepare next day" marker fires at 23:30. This is 30 minutes early — likely intentional as a pre-generation buffer, but it's decoupled from the actual stream end time.

### ℹ️ NOTE — `buildStreamIteration` Tightly Packs Blocks

Blocks advance by `timepoint += block.duration` (the anchor's actual duration), NOT by `durationLimit` (the 30/60 min cadence slot). This means blocks overlap their cadence slots when the anchor is shorter than the slot — the buffer cascade fills the gap. This is by design and works correctly with `fillStreamBlockBuffers`.

### ℹ️ NOTE — Dead Code Candidates

| File / Type                      | Status  | Note                                         |
| -------------------------------- | ------- | -------------------------------------------- |
| `recentlyUsedMediaRepository.ts` | 🪦 DEAD | Imported nowhere, targets non-existent table |
| `RecentlyUsedMedia` type         | 🪦 DEAD | Only used by the dead repository             |
| `initializeStream()` stub        | 🪦 DEAD | Empty function, never called                 |
| `initializeOnDeckStream()`       | 🪦 DEAD | Legacy function, not used by new flow        |
| `addInitialMediaBlocks()`        | 🪦 DEAD | Stub, never called                           |

---

## 15. Changes Since v1

### Issues Resolved Since v1 (2026-03-08)

| v1 Finding                                                              | Resolution                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚠️ Dual-state in StreamManager (module vars vs singleton)               | ✅ **RESOLVED** — All state unified in singleton. Module functions are proxies only.                                                                                          |
| ⚠️ `setContinuousStream(true)` / `setContinuousStreamArgs` never called | ✅ **RESOLVED** — Now called at the end of `buildContinuousStream()`.                                                                                                         |
| ⚠️ `isHolidaySeason` year-wrap                                          | ✅ **RESOLVED** — Now handles year-wrapping ranges with OR logic.                                                                                                             |
| ⚠️ `validateUpcomingMediaFiles` never checks file existence             | ✅ **RESOLVED** — Now uses `fs.existsSync` on actual blocks.                                                                                                                  |
| ⚠️ `cachedTimedMediaItems` never populated                              | ✅ **RESOLVED** — Removed entirely. Validation now iterates real blocks.                                                                                                      |
| 🐛 FacetRepository.create() UUID mismatch                               | ✅ **CORRECTED** — v1 finding was incorrect. Code uses same `facetId` variable throughout. No bug.                                                                            |
| ⚠️ `selectRandomEpisodeOrMovie` mostly TODO                             | ✅ **RESOLVED** — Now fully implemented with show/movie fallback logic.                                                                                                       |
| ℹ️ Recently-used dual tracking (in-memory + dead repo)                  | ✅ **REDESIGNED** — Movies persist to `recently_used_movies` on On Deck pop. Buffer media is session-only. Dead `recentlyUsedMediaRepository` disconnected (imports removed). |
| `episodeProgressionRepository` schema mismatch                          | ✅ **RESOLVED** — Fully rewritten to match real `episode_progression` schema (snake_case, autoincrement PK, UPSERT).                                                          |
| `filterRecentlyUsedMovies` 24h vs 48h inconsistency                     | ✅ **RESOLVED** — Now 48h everywhere.                                                                                                                                         |
| `reset()` doesn't clear `recentlyUsedMovies`                            | ✅ **RESOLVED** — `reset()` now clears all 5 maps.                                                                                                                            |
| `cleanupExpiredRecentlyUsed` ignores timepoint parameter                | ✅ **RESOLVED** — Now converts timepoint to ISO for DB query.                                                                                                                 |
| `loadRecentlyUsedMovies` uses Date.now() instead of timepoint           | ✅ **RESOLVED** — Now accepts and uses timepoint parameter.                                                                                                                   |

### New Issues Found in v2

| Finding                                               | Severity | Section Reference                                                         |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Index schema references non-existent columns/tables   | 🐛 BUG   | [§14](#-bug--index-schema-references-non-existent-columnstables)          |
| Trailing commas in recently-used CREATE TABLE         | 🐛 BUG   | [§14](#-bug--trailing-commas-in-recently-used-create-table-statements)    |
| Duplicate functions across files                      | ⚠️       | [§14](#️-concern--duplicate-functions-across-files)                        |
| `recordPlayedEpisodeProgression` hardcodes StreamType | ⚠️       | [§14](#️-concern--recordplayedepisodeprogression-hardcodes-streamtypecont) |
| Biased shuffle in 3 places                            | ⚠️       | [§14](#️-concern--biased-shuffle-in-3-places)                              |
| Dead code candidates (5 items)                        | ℹ️       | [§14](#️-note--dead-code-candidates)                                       |

---

## Summary Status

| Category                                   | Status                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Stream construction pipeline               | ✅ Complete (cadenced continuous)                                               |
| Buffer construction                        | ✅ Complete                                                                     |
| Media selection (themed + random)          | ✅ Complete                                                                     |
| Prism system (spectrum + facets)           | ✅ Complete                                                                     |
| Holiday intent cache                       | ✅ Complete                                                                     |
| Background service loop                    | ✅ Complete                                                                     |
| Day rollover                               | ✅ Complete                                                                     |
| Stream manager state                       | ✅ Unified singleton (clean)                                                    |
| Recently-used persistence (movies)         | ✅ Complete (DB on On Deck pop, in-memory during session)                       |
| Episode progression persistence            | ✅ Complete (DB on On Deck pop via repo UPSERT)                                 |
| Stream activation wiring                   | ✅ `setContinuousStream` + `setContinuousStreamArgs` called                     |
| File validation in cycle check             | ✅ `fs.existsSync` on real blocks                                               |
| Timepoint-based expiration                 | ✅ All DB queries use passed timepoint, not Date.now()                          |
| Player manager                             | ⚠️ Stub only (all 4 backends are TODO)                                          |
| Adhoc stream builder                       | ❌ Stub only                                                                    |
| Uncadenced continuous stream               | ❌ Not implemented                                                              |
| DB schema (recently-used tables + indexes) | 🐛 Trailing commas + phantom index columns/tables                               |
| Dead code                                  | ⚠️ `recentlyUsedMediaRepository.ts`, `RecentlyUsedMedia` type, 3 stub functions |
| Repositories                               | ✅ Complete (13 active repos, 1 dead)                                           |
