# Kaleidoscope Backend Architecture

> **Version 1.0** — Definitive reference for backend design, operation, and rationale.
> This document covers every subsystem, branching path, data flow, and design decision
> in the Kaleidoscope backend. When reading this document, you should be able to trace
> any operation from user action to database query and understand _why_ it works the way it does.

---

## Table of Contents

1. [Purpose & Philosophy](#1-purpose--philosophy)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Type System & Data Model](#3-type-system--data-model)
4. [Stream Construction Entry Point](#4-stream-construction-entry-point)
5. [Continuous Stream Builder — Full Lifecycle](#5-continuous-stream-builder--full-lifecycle)
6. [Anchor Media Selection — Themed vs Random](#6-anchor-media-selection--themed-vs-random)
7. [The Prism System — Facets & Spectrum](#7-the-prism-system--facets--spectrum)
8. [Buffer Construction — The Commercial Break Engine](#8-buffer-construction--the-commercial-break-engine)
9. [Holiday System — Dates, Seasons & Intent Budgeting](#9-holiday-system--dates-seasons--intent-budgeting)
10. [Episode Progression — Show Tracking](#10-episode-progression--show-tracking)
11. [Recently-Used Media — Deduplication & Eviction](#11-recently-used-media--deduplication--eviction)
12. [Stream Manager — Singleton State Hub](#12-stream-manager--singleton-state-hub)
13. [Background Service — Runtime Lifecycle Loop](#13-background-service--runtime-lifecycle-loop)
14. [Day Rollover — Infinite Continuous Streams](#14-day-rollover--infinite-continuous-streams)
15. [Player Manager — Playback Abstraction](#15-player-manager--playback-abstraction)
16. [Database & Repository Layer](#16-database--repository-layer)
17. [Appendix A: Complete File Map](#appendix-a-complete-file-map)
18. [Appendix B: Glossary](#appendix-b-glossary)

---

## 1. Purpose & Philosophy

Kaleidoscope is a **personal television network simulator**. It constructs a continuous
stream of shows, movies, commercials, shorts, music videos, and promos — exactly like a
real TV channel — and plays them back through an Electron app.

### Core Design Principles

1. **Television Authenticity** — The stream should feel like a real cable channel.
   Shows start at the top and bottom of the hour (:00 / :30). "Commercials" fill the gaps.
   There are channel idents (promos). Media flows thematically from one block to the next.

2. **Cadence over Continuity** — In cadenced mode, maintaining the :00/:30 alignment
   is more important than having every second perfectly filled. Small remainders carry
   forward rather than forcing awkward tiny media. These small remainders realign the media stream.

3. **Theme Walking** — When themed mode is active, the stream "walks" from one piece
   of media to thematically related media. A Sci-Fi Noir movie is bordered by
   'commercials', shorts, and music videos that evoke a Sci-Fi Noir "feel",
   then to a movie or show that is thematically adjacent. The Prism system
   (Facets, Spectrum, Mosaic) makes this happen.

4. **Smart Repetition Avoidance** — Recently-used tracking ensures the viewer doesn't
   see the same movie within 48 hours, the same commercial within 3 hours, or the same
   short/music within 24 hours. If a single show is picked multiple times, the system progresses the
   show naturally in order of episodes, restarting the show at the end of it's run.

5. **Persistence Where It Matters** — Movies and episode progression persist to SQLite
   so app restarts don't lose important state. Buffer media (commercials, shorts, music)
   is session-only because their replay windows are short enough that a restart effectively
   resets them anyway.

---

## 2. High-Level Architecture

**Component Stack (requests flow top-to-bottom, execution flows bottom-to-top):**

```
Layer 1 - UI
  |
  v [IPC messages via preload.cjs]
  |
Layer 2 - Controllers
  | (movie, show, commercial, short, music, promo, bumper, tag)
  |
Layer 3 - Stream Service
  | (createStream dispatcher)
  +-- Continuous Builder (main pipeline, fully implemented)
  +-- Adhoc Builder (stub, future adhoc streams)
  |
Layer 4 - Stream Construction Pipeline
  | Services that build the stream during initialization
  +-- Media Selector (themed vs random anchor selection)
  +-- Buffer Constructor (commercial breaks: Half-A/Promo/Half-B)
  +-- Prism System (facets, spectrum)
  |
Layer 5 - Runtime Layer
  | Services that manage playback lifecycle
  +-- Stream Manager (singleton, holds ALL runtime state)
  +-- Background Service (5-min lifecycle loop)
  +-- Player Manager (playback abstraction)
  |
Layer 6 - Data Layer
  | Persistence and repositories
  +-- SQLite Database (30 tables, better-sqlite3)
  +-- Repositories (movie, show, episode, commercial, short, music, promo, tag, facet)
```

### Request Flow

```
User clicks "Start Stream"
    │
    ▼
IPC → streamService.createStream(StreamType.Cont, { Cadence: true, Themed: true })
    │
    ▼
continuousStreamBuilder.buildContinuousStream(options)
    │
    ├──▶ initializeContinuousStream()
    │       ├── loadRecentlyUsedMovies(timepoint)      ← DB → memory
    │       ├── findActiveHolidaysByDate(dateString)   ← DB
    │       ├── getProgressionsByStreamType(streamType) ← DB → memory map
    │       └── selectRandomShowOrMovie()              ← first anchor as fallback
    │
    ├──▶ buildCadencedContinuousStream()
    │       ├── findNextCadenceTime(now)
    │       │     ├── CASE 1: time before next cadence → buildCadencedWithInitialBuffer()
    │       │     └── CASE 2: exactly on cadence       → buildCadencedWithoutInitialBuffer()
    │       │
    │       └──▶ buildStreamIteration()                ← fills rest of day
    │              ├── selectThemedMedia() or selectRandomShowOrMovie()  [per anchor]
    │              ├── createMediaBlock() per anchor
    │              ├── createBuffer() for preceding block  ← backfill buffer
    │              └── fillStreamBlockBuffers()           ← buffers for all iteration blocks
    │
    ├──▶ Push to playerManager
    │       ├── initialBuffer → playerManager (if applicable)
    │       ├── firstAnchor → playerManager
    │       └── backfillBuffer → playerManager
    │
    └──▶ Register with streamManager
            ├── On Deck: Slot 1 = first anchor, Slot 2 = iteration[0]
            ├── Upcoming: iteration[1..n]
            ├── setContinuousStream(true)
            └── setContinuousStreamArgs({Cadence, Themed})
```

---

## 3. Type System & Data Model

All types are declared globally in `types.d.ts`. This is the single source of truth.

### Enums

| Enum         | Values                                                                          | Purpose                            |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| `StreamType` | `Cont`, `Adhoc`                                                                 | Route to correct builder           |
| `MediaType`  | `Show`, `Episode`, `Movie`, `Short`, `Music`, `Commercial`, `Promo`, `Bumper`   | Distinguish media kinds everywhere |
| `TagType`    | `Aesthetic`, `Era`, `Genre`, `Specialty`, `Holiday`, `AgeGroup`, `MusicalGenre` | Categorize tags for segmentation   |

### Anchor Media Types

**Movie** — standalone film with `path`, `duration`, `durationLimit`, `tags`, `isHolidayExclusive`.

**Show** — container for episodes. Has `durationLimit` (e.g. 1800 = 30-min show, 3600 = 1-hr show), `episodes[]`, `tags`, and `secondaryTags`.

**Episode** — belongs to a show. Has `showItemId`, `episodeNumber`, `duration`, `overDuration` flag, `durationLimit`, `tags`. The `overDuration` flag indicates this episode exceeds the show's standard `durationLimit` (e.g. a 2-hour special in a normally 30-minute show).

### Buffer Media Types

**Commercial** — short media (~5-120s). Tagged for themed matching.

**Short** — short films or clips (2+ minutes). Tagged.

**Music** — music videos. Tagged.

**Promo** — channel idents (~5-15s). Like the NBC peacock or ABC logo bumps. One random promo per buffer.

**Bumper** — transition clips. Currently defined but not actively placed by the buffer constructor. Coming soon.

### The MediaBlock

**MediaBlock Structure:**

```typescript
MediaBlock = {
  buffer: (Promo | Music | Short | Commercial)[]  // filler content plays to fill gap left after anchorMedia
  anchorMedia?: Movie | Episode                     // main show/movie (optional)
  startTime: number                                 // Unix seconds when block begins
}
```

Playback Order:

1. anchorMedia plays (if present)
2. All buffer items play sequentially (if present)
3. Next MediaBlock begins

Note: Buffer-only blocks (no anchorMedia) are used to fill gaps before the first anchor of an initialized stream.

A MediaBlock is the fundamental unit of the stream. Every scheduled slot on the timeline
is a MediaBlock.

### Tags & SegmentedTags

Tags are the backbone of themed selection. Every media item can have multiple tags.
When processing, tags are segmented into their type categories:

To understand the goal of Tags (Taxonomies) and what they describe or how they are used,
please refer to the [Taxonomies Documentation](./taxonomies/index.md)

```typescript
type SegmentedTags = {
  genreTags: Tag[]; // e.g. "Sci-Fi", "Drama", "Comedy"
  aestheticTags: Tag[]; // e.g. "Noir", "Fantasy"
  eraTags: Tag[]; // e.g. "1980s", "2000s"
  specialtyTags: Tag[]; // e.g. "Cult Classics", "Criterion", "MCU Movies", "Nickelodeon"
  ageGroupTags: Tag[]; // e.g. "Kids", "Teens", "Adults"
};
```

The `segmentTags()` function in `common.ts` performs this segmentation. It filters the
raw tag array by `tag.type` and returns the structured object. This is called at every
point where tags need to be analyzed — media selection, buffer creation, prism matching.

### Facets

A Facet is a genre + aesthetic pairing that creates a thematic identity:

```
Facet = { genre: "Sci-Fi", aesthetic: "Noir" }
  → Identity: "Sci-Fi Noir" (like Blade Runner)
  → Relationships: [
      { genre: "Thriller", aesthetic: "Noir", distance: 0.2 },
      { genre: "Horror", aesthetic: "Gothic", distance: 0.6 },
      ...
    ]
```

The `distance` field (0.0 to 1.0) indicates how thematically far the relationship is. Lower = closer. Facet relationships allow the stream to "walk" from one thematic identity to another, selecting media that feels connected but not identical.

---

## 4. Stream Construction Entry Point

**File:** `src/electron/services/streamService.ts`

```typescript
export async function createStream(
  streamType: StreamType,
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint?: number,
): Promise<[MediaBlock[], string]>;
```

This is the single entry point for all stream creation. It routes based on `StreamType`:

| StreamType | Builder                   | Status                             |
| ---------- | ------------------------- | ---------------------------------- |
| `Cont`     | `buildContinuousStream()` | **Active** — full implementation   |
| `Adhoc`    | `buildAdhocStream()`      | **Stub** — requires `endTimepoint` |
| default    | Returns error             | Catch-all                          |

The return is always `[MediaBlock[], errorMessage]`. An empty string means success.

### StreamConstructionOptions

```typescript
interface StreamConstructionOptions {
  Cadence: boolean; // true = align to :00/:30 with buffers, false = back-to-back
  Themed: boolean; // true = use Prism system, false = random selection
  StreamType: StreamType;
}
```

These three booleans create four possible stream modes:

| Cadence | Themed | Behavior                                                    |
| ------- | ------ | ----------------------------------------------------------- |
| true    | true   | **Full TV simulation** — cadenced, themed, holiday-aware    |
| true    | false  | **Cadenced random** — aligned to :00/:30 but random content |
| false   | true   | Not yet implemented (returns error)                         |
| false   | false  | Not yet implemented (returns error)                         |

---

## 5. Continuous Stream Builder — Full Lifecycle

**File:** `src/electron/services/streamConstruction/continuousStreamBuilder.ts`

This is the largest and most complex file in the backend (~700 lines). It orchestrates
the entire stream from start to end of day.

### Phase 1: Initialization

`initializeContinuousStream(options)` runs first and produces `StreamInitializationData`:

```
initializeContinuousStream()
    │
    ├── startingTimepoint = Math.floor(Date.now() / 1000)
    │     The exact second the stream starts, in Unix seconds.
    │
    ├── loadRecentlyUsedMovies(startingTimepoint)
    │     Reads DB table `recently_used_movies` into the in-memory map.
    │     Cleans up expired rows (expiresAt <= now) from DB.
    │     Derives original usage timestamp from expiresAt for in-memory eviction.
    │
    ├── findActiveHolidaysByDate(fullDateString)
    │     Queries the tag repository for Holiday tags whose date ranges
    │     include today. Returns Tag[] of active holidays.
    │
    ├── endOfDayUnix = endOfDay(now)
    │     23:59:59 today, used as the time fence for stream construction.
    │
    ├── iterationDuration = floor((endOfDay - now) / 1800) * 1800
    │     How many complete 30-minute blocks fit between now and end of day.
    │     This ensures we don't try to select media for a partial block.
    │
    ├── getProgressionsByStreamType(StreamType)
    │     Loads episode progression from DB into a Map<showItemId, episodeNumber>.
    │     Set on streamManager for O(1) lookup during construction.
    │
    └── selectRandomShowOrMovie(startingTimepoint, iterationDuration, [])
          Selects the first piece of anchor media. Used as a fallback
          and as the seed for themed selection.
```

### Phase 2: Cadenced Construction

After initialization, the builder checks if we're exactly on a cadence mark (:00 or :30):

```
Is current time on a cadence mark?
    │
    ├── NO: Time exists before next cadence mark
    │     └── buildCadencedWithInitialBuffer()
    │           Creates a buffer-only block to fill the gap from
    │           now until the next :00/:30 mark.
    │
    └── YES: Already on :00 or :30
          └── buildCadencedWithoutInitialBuffer()
                Starts the first anchor immediately.
```

### buildCadencedWithInitialBuffer() — Step by Step

This is the most common path (the user rarely clicks "Start" at exactly :00 or :30).

```
Time: 2:17 PM          Time: 2:30 PM
      │                      │
      ▼                      ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│  INITIAL BUFFER  │  │         FIRST ANCHOR BLOCK           │
│  (13 min filler) │  │  anchorMedia = selected show/movie   │
│  buffer-only     │  │  buffer = [] (backfilled later)      │
│  NOT on On Deck  │  │  On Deck: Slot 1                     │
└──────────────────┘  └──────────────────────────────────────┘
```

Step-by-step:

1. **Calculate initial buffer duration** — `nextCadenceTime - startingTimepoint` (e.g. 13 minutes).

2. **Create initial buffer block** — Uses `createBuffer()` with halfATags=[] (nothing preceded us) and halfBTags=first media's tags (themed to what's about to play). Wrapped in a MediaBlock with `anchorMedia = undefined`.

3. **Push initial buffer to player** — `playerManager.addMediaBlockToPlayer()`. This gives the user something to watch immediately. Buffer-only blocks are invisible to On Deck.

4. **Create first anchor block** — MediaBlock with the selected first media, starting at `nextCadenceTime`.

5. **Push first anchor to player** — This is the critical "buy time" push. An episode is 22+ minutes, a movie is 90+ minutes. While this plays, we generate the rest of the day.

6. **Call buildStreamIteration()** — Generates ALL remaining anchors for the rest of the day. Also computes the backfill buffer (the buffer that goes between the first anchor and the second anchor as we pushed the first anchor immediately without adding the buffer to it's media block).

7. **Push backfill buffer to player** — Wrapped as a buffer-only MediaBlock. This slots in between the first anchor and the second anchor in the player's queue.

8. **Register with On Deck / Upcoming:**
   - On Deck Slot 1 = first anchor (already playing)
   - On Deck Slot 2 = iterationBlocks[0]
   - Upcoming = iterationBlocks[1..n]

### buildCadencedWithoutInitialBuffer()

Nearly identical to the above, but skips Steps 1-3 (no initial buffer needed). The first
anchor block starts at `startingTimepoint` immediately. Everything else follows the same flow.

### buildStreamIteration() — The Main Loop

This is the core loop that fills the rest of the day with anchor media and buffers.

```
buildStreamIteration(incomingTimepoint, endOfTimeWindow, ...)
    │
    │  timepoint = incomingTimepoint (cadence boundary: startTime of first block to fill)
    │  tags = precedingMediaBlock.anchorMedia.tags
    │
    │  WHILE timepoint < endOfTimeWindow:
    │    │
    │    ├── segmentTags(tags)                    ← categorize current tags
    │    │
    │    ├── Themed? ───YES──▶ selectThemedMedia() ← see §6
    │    │           └──NO──▶ selectRandomShowOrMovie()
    │    │
    │    ├── createMediaBlock([], selectedAnchor, timepoint)
    │    │
    │    ├── If movie → addRecentlyUsedMovie(id, timepoint)  ← in-memory tracking
    │    │
    │    ├── tags = selectedAnchor.tags            ← carry tags forward for next iteration
    │    │
    │    └── timepoint += anchor.durationLimit     ← advance to next cadence boundary
    │
    │  END WHILE
    │
    │  IF Cadence:
    │    ├── createBuffer() for preceding block    ← this is the "backfill buffer"
    │    ├── fillStreamBlockBuffers()              ← buffers for all iteration blocks
    │    └── Store remainder time on streamManager
    │
    └── RETURN [backfillBuffer, iterationBlocks]
```

**Critical detail:** In cadenced mode, `timepoint` advances by `anchor.durationLimit`, NOT by `anchor.duration`. Each block's `startTime` is placed at a cadence boundary (`:00` or `:30`). The gap between the end of the anchor (`startTime + duration`) and the start of the next block (`startTime + durationLimit`) is exactly `durationLimit - duration` — that gap is the buffer slot. `fillStreamBlockBuffers` reads this structural gap directly from the block timestamps to compute each buffer's budget. Any seconds the buffer constructor can't fill cascade forward as remainder to the next buffer. See §8 for details.

**Why `tags` carry forward:** Each iteration uses the previous anchor's tags to seed the next selection. This creates the "theme walking" effect — the stream flows from Sci-Fi Noir to something related, which flows to something related to that, and so on.

---

## 6. Anchor Media Selection — Themed vs Random

**File:** `src/electron/services/streamConstruction/mediaSelector.ts`

The stream builder calls one of two selection functions depending on the `Themed` flag.

### Random Selection: `selectRandomShowOrMovie()`

```
selectRandomShowOrMovie(timepoint, duration, ageGroupTags)
    │
    ├── duration >= 5400 (90 min)?
    │     ├── YES: coin flip (50%) → movie or show
    │     └── NO:  default to show (shorter content)
    │
    ├── If choosing MOVIE:
    │     ├── Get recently used movie IDs from streamManager
    │     ├── findRandomMovieUnderDurationExcluding(duration, ageGroups, excludeIds)
    │     │     Tries to find a movie that fits AND hasn't been used recently
    │     ├── Fallback: findRandomMovieUnderDuration(duration, ageGroups)
    │     │     If all movies are recently-used, pick any that fits
    │     └── Fallback: try shows instead if no movies at all
    │
    └── If choosing SHOW:
          ├── findAllShowsUnderDuration(duration)
          └── getEpisodeFromShowCandidates(shows, duration)
                ├── Fisher-Yates shuffle shows
                ├── For each show: doesNextEpisodeFitDuration(show, duration)
                │     Checks progression map for next episode number
                │     Returns null if episode doesn't fit
                ├── On success: updateProgression(showId, episodeNum)
                └── Return episode or null
```

### Themed Selection: `selectThemedMedia()`

This is the complex, multi-path selection algorithm. Three paths, tried in order:

```
selectThemedMedia(segmentedTags, timepoint, duration, holidays, ...)
    │
    ├── PATH 1: HOLIDAY DATE (isHolidayDate = true)
    │     │  "Today IS the holiday (e.g. Dec 25th for Christmas)"
    │     │
    │     ├── Collect ALL movies and episodes tagged with active holiday tags
    │     │     No holiday intent budget — everything plays
    │     │     No recently-used filtering — everything plays
    │     │
    │     ├── Smart Shuffle (prevents movie/movie back-to-back):
    │     │     If previous anchor was Movie → 80% chance of Episode next
    │     │     If previous anchor was Episode → 80% chance of Movie next
    │     │     If no previous → natural distribution based on pool sizes
    │     │
    │     └── Return selected movie or episode
    │
    ├── PATH 2: HOLIDAY SEASON (isHolidaySeason = true)
    │     │  "Today is within a holiday's date range (e.g. Dec 1-24 for Christmas)"
    │     │
    │     │  For each active holiday tag:
    │     │    ├── holidayIntentCacheManager.canAddMoreContent(tagId, dateString)
    │     │    │     Checks 3-day rotation budget. See §9.
    │     │    │
    │     │    ├── If budget available:
    │     │    │     ├── selectMediaWithHolidayTag(tagId, duration)
    │     │    │     │     Finds movies + episodes with this holiday tag
    │     │    │     │     Weighted random between pools
    │     │    │     │
    │     │    │     └── trackSelectedMinutes(tagId, durationMinutes, dateString)
    │     │    │           Debit the budget
    │     │    │
    │     │    └── If budget exhausted → fall through to PATH 3
    │     │
    │     └── Falls through to PATH 3 if all budgets exhausted
    │
    └── PATH 3: NON-HOLIDAY — sequential fallback chain
          │  Each step is tried in order; if it returns nothing, the next step runs.
          │
          ├── STEP 1: specialty-adjacent (only if specialty tags exist AND coin flip 50% succeeds)
          │     └── selectSpecialtyAdjacentMedia(specialtyTags, ageGroups, duration)
          │           Finds movies/shows sharing the same specialty tags
          │           Returns media? → DONE. No result or skipped → STEP 2
          │
          ├── STEP 2: facet-adjacent (only if BOTH genre AND aesthetic tags present)
          │     └── selectFacetAdjacentMedia(segmentedTags, duration)
          │           Matches against facet system (see §7), weighted distance selection
          │           Returns media? → DONE. No result or skipped → STEP 3
          │
          ├── STEP 3: direct tag match (only if genre OR aesthetic tags present, not both)
          │     └── selectMovieOrShow(genre+aesthetic tags, ageGroups, duration)
          │           Direct tag-based search without facet system
          │           Returns media? → DONE. No result → STEP 4
          │
          └── STEP 4: random fallback (always attempted)
                └── selectRandomShowOrMovie()
                      Same as random mode — guaranteed return if DB has content
```

### selectMovieOrShow() — The Coin Flip

```typescript
export function selectMovieOrShow(tags, ageGroups, duration, timepoint) {
  const tryMovieFirst = Math.random() < 0.5;
  if (tryMovieFirst) {
    return trySelectMovie(...) ?? trySelectEpisode(...);
  } else {
    return trySelectEpisode(...) ?? trySelectMovie(...);
  }
}
```

This 50/50 coin flip with fallback ensures both movies and shows get fair selection
while guaranteeing _something_ is always returned (as long as the database has content).

---

## 7. The Prism System — Facets & Spectrum

The Prism system is Kaleidoscope's themed content matching engine. It has three components:

### 7.1 Facets (`prisms/facets.ts`)

Facets are the relationship graph between thematic identities.

**Finding Facets:**

```
findMatchingFacets(segmentedTags)
    │
    ├── Need BOTH genre AND aesthetic tags (otherwise return [])
    │
    ├── For each genreTagId × aestheticTagId combination:
    │     └── facetRepository.findByGenreAndAestheticId(genre, aesthetic)
    │           Returns Facet with its facetRelationships[]
    │
    └── Returns array of matching Facets
```

**Using Facets (in mediaSelector.selectFacetAdjacentMedia):**

```
selectFacetAdjacentMedia(segmentedTags, duration, timepoint)
    │
    ├── findMatchingFacets(segmentedTags)        ← get all matching facets
    │
    ├── Flatten all relationships from all facets into one pool
    │     Deduplicate by genre|aesthetic key, keeping closest distance
    │
    ├── WHILE unattemptedRelationships remain:
    │     ├── selectFacetRelationship(relationships)
    │     │     Weighted random: weight = 1 - distance
    │     │     Closer relationships are MORE likely to be selected
    │     │
    │     ├── selectMovieOrShow(relationship.genre + aesthetic, ageGroups, duration)
    │     │     Try to find actual media matching this relationship
    │     │
    │     ├── Found? → Return the media
    │     │
    │     └── Not found? → Remove this relationship from pool, try next
    │
    └── All relationships exhausted → return null
```

**Why inverse distance weighting?** A relationship with distance 0.1 (very close) gets weight 0.9. A relationship with distance 0.8 (far) gets weight 0.2. This means thematically close content is ~4.5x more likely to be selected — but distant content still has a chance, adding variety.

### 7.2 Spectrum (`prisms/spectrum.ts`)

Spectrum handles buffer media selection — finding commercials, shorts, and music that
match the thematic context. It uses a **gated pool expansion** strategy:

```
selectBufferMedia(segmentedTags, activeHolidayTags, duration, shortOrMusicNumber, timepoint)
    │
    ├── getAgeGroups(ageGroupTags)                ← age adjacency expansion
    │     Takes lowest age group, adds ±1 adjacent groups.
    │     e.g. "Teens" → ["Kids", "Teens", "Adults"]
    │     This ensures age-appropriate content while allowing adjacent content.
    │
    ├── GATE 1: Holiday Media
    │     ├── getHolidayBufferMedia(holidayTags, ageGroups, specialtyTags, duration)
    │     ├── Filter out recently-used items (per media type window)
    │     ├── mergeUnique() into cumulative pool
    │     └── isBufferMediaPoolValid()? → RETURN (pool is sufficient)
    │
    ├── GATE 2: Specialty Media
    │     ├── getSpecialtyBufferMedia(specialtyTags, duration)
    │     ├── Filter recently-used, mergeUnique into pool
    │     └── isBufferMediaPoolValid()? → RETURN
    │
    ├── GATE 3: Genre/Aesthetic Media
    │     ├── getGenreAndAestheticBufferMedia(genreTags, aestheticTags, ageGroups, duration)
    │     ├── Filter recently-used, mergeUnique into pool
    │     └── isBufferMediaPoolValid()? → RETURN
    │
    ├── GATE 4: Age Group Only
    │     ├── getAgeGroupOnlyBufferMedia(ageGroups, duration)
    │     ├── Filter recently-used, mergeUnique into pool
    │     └── isBufferMediaPoolValid()? → RETURN
    │
    ├── GATE 5: Untagged Media
    │     ├── getUntaggedBufferMedia(duration)
    │     ├── Filter recently-used, mergeUnique into pool
    │     └── May or may not be valid at this point
    │
    ├── GATE 6: Random (only if ALL segmented tag categories are empty)
    │     └── getRandomBufferMedia(duration, shortOrMusicNumber)
    │
    └── FINAL:
          ├── isValid? → shuffle and return full pool
          └── NOT valid? → shuffleAndHalve() all arrays
                This conserves variety by only using half the pool,
                leaving the other half for future buffers during
                the same recently-used window.
```

**Why gated expansion?** Each gate adds more content to the pool. We stop as soon as the pool is "valid" — meaning there's enough variety to fill buffers for ~4 hours without excessive repetition. This ensures the most thematically relevant content is preferred while still having enough variety.

**Pool validity (`isBufferMediaPoolValid`):**

- Estimates how many buffers will need filling over a 4-hour window
- Calculates usability scores for shorts/music (capped at 1.0)
- Checks if commercials cover the remaining need (target: 2 hours of commercial runtime)
- Invalid pools are halved to preserve variety

### Facet Walkability (`facetWalkabilityService.ts`)

A diagnostic service that determines if the facet system is sufficiently connected to support "walking" streams:

- Builds an adjacency graph of all facets connected through shared genre/aesthetic relationships
- Uses DFS to find the largest connected component
- Returns `true` if the largest component contains ≥ `percentile`% of all facets (default: 80%)
- Used to validate that themed mode will actually work before enabling it

---

## 8. Buffer Construction — The Commercial Break Engine

**File:** `src/electron/services/bufferConstructor.ts`

Buffers are the filler content between anchor media — commercials, shorts, music videos,
and promos. The buffer constructor is designed to mimic real TV commercial breaks.

### The Half-A / Half-B Split

Every buffer is split into two themed halves:

**Buffer Structure (Half-A / Promo / Half-B):**

```
┌─────────────────────────────────────────────────┐
│                  BUFFER BLOCK                   │
│                                                 │
│  HALF A          │  PROMO  │      HALF B        │
│  (themed to      │  (15s   │  (themed to        │
│   preceding      │  channel│   upcoming         │
│   show/movie)    │  ident) │   show/movie)      │
│                  │         │                    │
│  •Commercials    │ •Logo   │  •Commercials      │
│  •Shorts         │  bumper │  •Shorts           │
│  •Music          │ •Trans- │  •Music            │
│                  │  ition  │                    │
└─────────────────────────────────────────────────┘

halfATags = preceding anchor's tags
halfBTags = upcoming anchor's tags
```

Special Cases:
• If halfATags empty (stream start) → entire buffer is Half B
• If halfBTags empty (stream end) → entire buffer is Half A
• If both empty → only promo (if available)
• If duration < 30s → entire budget to Half B

**Why the split?** A real TV commercial break transitions from the show that just ended
to the show that's about to start. On broadcast television you would notice this transition in the form of
a block of childrens' cartoons in the morning having ads for breakfast cereals or toys, to soap operas having more car commercials or other adult related advertising. The first half's ads relate to what you just watched;
the channel ident (promo) plays in the middle; then the second half's ads relate to what's
coming next. This creates a natural theming transition.

**Special cases:**

- `halfATags = []` (stream start) → entire buffer is Half B (themed to upcoming)
- `halfBTags = []` (stream end) → entire buffer is Half A (themed to preceding)
- Both empty → only promo (if available), otherwise empty buffer
- Duration < 30 seconds → entire budget goes to Half B

### createBuffer()

```
createBuffer(duration, halfATags, halfBTags, activeHolidayTags, timepoint)
    │
    ├── Select random promo (15s channel ident)
    │     Deduct promo duration from budget
    │
    ├── Calculate halfA and halfB durations
    │     If both halves exist: halfA = ceil(remaining / 2), halfB = rest
    │     Deduct remainder for any spillover
    │
    ├── Determine strategy based on total duration:
    │     ├── "short"  (≤ 7 min) → commercials only
    │     ├── "medium" (≤ 15 min) → 0-2 shorts/music + commercials
    │     └── "large"  (> 15 min) → 1-3 shorts/music + commercials
    │
    ├── Randomize shorts/music count per strategy
    │     splitCountBetweenHalves() → distribute across halfA and halfB
    │
    ├── constructBufferHalf() for each half (see below)
    │
    └── Return { buffer: [...halfA, promo, ...halfB], remainingDuration }
```

### constructBufferHalf()

Each half is constructed independently:

```
constructBufferHalf(tags, activeHolidayTags, duration, strategy, targetShortsMusicCount, timepoint)
    │
    ├── segmentTags(tags)                         ← categorize for spectrum
    │
    ├── Get default commercials as fallback
    │     commercialRepository.findByDefaultSpecialtyTag(duration)
    │
    ├── selectBufferMedia() from spectrum         ← gated pool expansion (§7.2)
    │
    ├── Strategy routing:
    │     ├── "short": selectCommercials() only
    │     ├── "medium": selectShortsAndMusic() then selectCommercials() for remainder
    │     └── "large": selectShortsAndMusic() then selectCommercials() for remainder
    │
    ├── Record used media as recently-used:
    │     addRecentlyUsedCommercial(), addRecentlyUsedShort(), addRecentlyUsedMusic()
    │
    └── Final shuffle of selectedMedia before returning
```

### selectCommercials() — The Exact-Fill Algorithm

The commercial selector uses a sophisticated approach to minimize leftover time:

```
WHILE remainingDuration > 0 AND viable commercials exist:
    │
    ├── TRY 1: Find SINGLE commercial that EXACTLY fills remainder
    │     Prefer era-matched → then any candidate
    │
    ├── TRY 2: Find TWO commercials that TOGETHER fill remainder
    │     Uses duration→commercial Map for O(n) complement search
    │     Prefer era-matched → then any candidate
    │
    ├── TRY 3: Random commercial from viable pool
    │     Prefer era-matched → then any candidate
    │     Must fit within remaining duration
    │
    └── TRY 4: Same three steps with DEFAULT commercials
          Default = "generic" commercials with a fallback specialty tag
```

**Era matching** means preferring a 1980s commercial if the preceding show was from the 1980s. This adds another layer of thematic consistency.

**Critical detail:** Default commercials are a set of commercials with liminal themeing of varying sizes designed to fill gaps when necessary. These commercials are provided with the Kaleidoscope application in order to provide users who do not have media of appropriate durations so they are able to still experience the Cadenced viewing option.

### The Remainder Cascade

**Remainder Cascade (no time wasted):**

```
Block A (Buffer Budget: 450s)
  Selected: 435s (commercials, shorts, and music videos)
  Remainder: 15s
         |
         v (flows forward as remainder)

Block B (Buffer Budget: 380s + cascaded remainder 15s = 395s total)
  Selected: 390s
  Carries forward: 0s
         |
         v (cascades to next block)

Block C (Buffer Budget: 3s + cascaded remainder 0s = 3s total)
  Selected: 0s (Could not find any commercial with 3 seconds or less)
  Remainder: 3s (flows to next)
```

The remainder system ensures no time is lost. When a buffer can't perfectly fill its
allocation, the leftover seconds cascade to the next buffer as additional budget.
This is tracked via `streamManager.remainderTimeInSeconds`.

### fillStreamBlockBuffers()

After all anchor blocks are placed, this function creates buffers between them:

```
fillStreamBlockBuffers(timeRemainder, iterationBlocks, activeHolidayTags)
    │
    │  For each block i from 0 to (length - 2):    ← Skip last block!
    │    │
    │    ├── Calculate structural gap: nextBlock.startTime - (currentBlock.startTime + anchorDuration)
    │    │     = durationLimit - duration (e.g. 480s for a 22-min episode in a 30-min slot)
    │    ├── Total budget = gap + cascaded remainder
    │    ├── If budget <= 0 → skip
    │    │
    │    ├── createBuffer(budget, currentBlock.tags, nextBlock.tags, holidays)
    │    ├── Attach buffer to currentBlock.buffer
    │    └── Carry remainder to next iteration
    │
    └── Return final cumulative remainder
```

**Why skip the last block?** The last block in the day has no "next block" to theme
Half B against. Its buffer gets backfilled during day rollover (§14) when we know
what the first block of the next day will be.

---

## 9. Holiday System — Dates, Seasons & Intent Budgeting

The holiday system controls how holiday-themed content appears in the stream.

### Three Holiday States

**Holiday States (ordered by priority):**

OUTSIDE SEASON (before or after holiday band):
→ No holiday content appears in stream
→ Random or themed selection only

INSIDE SEASON (e.g. Dec 1-24 for Christmas):
→ Holiday content budgeted via 3-day rotation
→ 270 minutes per day (4.5 hours allocated)
→ Distribution: Day 1 → Day 2 → Day 3 → (repeat)
→ Falls back to random/themed if budget exhausted

ON HOLIDAY DATE (e.g. Dec 25):
→ SATURATION MODE: all holiday content plays
→ No duration limits
→ No recently-used filtering
→ Smart shuffle prevents movie-to-movie or episode-to-episode streaks (80/20 alternation)
→ Completely bypasses all other selection logic

### Holiday Detection

`isHolidayDate(unixSeconds, holidays)`:

- Extracts MM-DD from timestamp
- Compares against each holiday tag's `holidayDates[]` array
- Returns true if today matches an exact holiday date

`isHolidaySeason(unixSeconds, holidays)`:

- Extracts MM-DD from timestamp
- Checks if date falls within `seasonStartDate` to `seasonEndDate`
- Handles year-wrapping (e.g. "11-15" to "01-05" spans New Year)

### Holiday Date Mode (PATH 1)

On the actual holiday, Kaleidoscope goes into **saturation mode**:

- ALL movies and episodes with active holiday tags are collected
- No duration filtering, no recently-used filtering
- Smart Shuffle alternates between movie and episode to prevent streaks
  - Previous was Movie → 80% chance of Episode
  - Previous was Episode → 80% chance of Movie
- This completely bypasses all other selection logic

### Holiday Season Mode (PATH 2)

During the holiday season, content is **budgeted** through the Holiday Intent Cache Manager.

### Holiday Intent Cache Manager

**File:** `src/electron/services/holidayIntentCacheManager.ts`

This singleton manages a cache of `HolidayIntent` objects — one per active holiday tag.

**3-Day Rotation Distribution:**

```
Total holiday content: 810 minutes (movies + shows)
Target per day: 270 minutes (4.5 hours)

Day 1 → 270 minutes
Day 2 → 270 minutes
Day 3 → 270 minutes
(then repeat)

If total < 810:
  Spread evenly: e.g. 360 min → 120/120/120
```

**How rotation day is calculated:**

```
rotationDay = (daysSinceEpoch % 3) + 1    // Returns 1, 2, or 3
```

This is deterministic and UTC-based, so the same date always maps to the same rotation day.

**Budget tracking:**

- `canAddMoreContent(tagId, dateString)` — checks `selectedMinutesToday < todayTarget`
- `trackSelectedMinutes(tagId, minutes, dateString)` — accumulates usage
- `ensureCurrentRotation()` — resets counter when date changes
- Lazy loading — intents are only calculated when first accessed
- Invalidation — when content changes, the cache entry is marked stale

---

## 10. Episode Progression — Show Tracking

Episode progression tracks which episode to play next for each show, per stream type.

### How It Works

```
Show: "Breaking Bad" (62 episodes)
Stream: Continuous

Progression entry: { showItemId: "bb-123", streamType: "Cont", currentEpisodeNumber: 15 }

Next time "Breaking Bad" is selected:
    → Play Episode 15
    → Update in-memory map to episode 15
    → When episode finishes playing (On Deck prune):
        → UPSERT to DB: currentEpisodeNumber = 15

When episode 62 finishes:
    → Wrap back to episode 1
```

### Two-Phase Tracking

**Phase 1: In-Memory (during construction)**

- `getProgressionsByStreamType()` loads all progressions into a `Map<showItemId, episodeNumber>`
- Stored on `streamManager.progressionMap`
- `doesNextEpisodeFitDuration()` checks the map for the next episode
- `getEpisodeFromShowCandidates()` calls `updateProgression()` immediately after selection
  - This prevents the same episode from being re-selected during the same construction pass

**Phase 2: DB Persistence (after playback)**

- `recordPlayedEpisodeProgression()` is called when a block is pruned from On Deck
- Pruning from On Deck = proof that the media actually played (not just selected)
- Uses UPSERT: `INSERT ... ON CONFLICT(showItemId, streamType) DO UPDATE`
- This means restarts pick up where playback left off, not where construction left off

### Episode Fit Logic

```
doesNextEpisodeFitDuration(show, availableDuration)
    │
    ├── Get nextEpisodeNum from progressionMap (default: 1)
    │
    ├── Check if episode exists
    │     └── If not → wrap to episode[0]
    │
    └── episode.duration <= availableDuration? → return episodeNum : null
```

---

## 11. Recently-Used Media — Deduplication & Eviction

### Eviction Windows

| Media Type  | Window   | Persistence              | Rationale                                                     |
| ----------- | -------- | ------------------------ | ------------------------------------------------------------- |
| Movies      | 48 hours | **SQLite DB**            | Movies are high-value; rewatching within 2 days is noticeable |
| Commercials | 3 hours  | Session-only (in-memory) | Short content; variety restored quickly                       |
| Shorts      | 24 hours | Session-only (in-memory) | Medium-length; needs longer cooldown                          |
| Music       | 24 hours | Session-only (in-memory) | Same as shorts                                                |

### In-Memory Maps (StreamManager)

Each media type has a `Map<mediaItemId, unixTimestamp>`:

- `recentlyUsedMovies` — loaded from DB at stream start
- `recentlyUsedCommercials` — starts empty each session
- `recentlyUsedShorts` — starts empty each session
- `recentlyUsedMusic` — starts empty each session

### Filter Functions (`selectionHelpers.ts`)

Each filter function follows the same pattern:

```
filterRecentlyUsed[MediaType](items, timepoint)
    │
    ├── Get the recently-used map from streamManager
    │
    ├── PRUNE: Remove entries older than eviction window
    │     for (const [key, usedTime] of map)
    │       if (usedTime < timepoint - WINDOW) → map.delete(key)
    │
    └── FILTER: Return items NOT in the map
          items.filter(item => !map.has(item.mediaItemId))
```

### Movie Persistence Flow

```
WRITE PATH (when movie finishes playing):
    cycleCheck() prunes On Deck
        → recordPlayedMovie(mediaBlock)
            → INSERT INTO recently_used_movies (mediaItemId, expiresAt)
              expiresAt = now + 48 hours (ISO string)

READ PATH (when stream starts):
    initializeContinuousStream()
        → loadRecentlyUsedMovies(startingTimepoint)
            → DELETE expired rows from DB
            → SELECT non-expired rows
            → Derive usedAtSeconds from expiresAt for in-memory eviction:
              usedAt = expiresAt - 48 hours
            → Add to streamManager.recentlyUsedMovies map

SELECTION PATH (during construction):
    selectRandomShowOrMovie()
        → getActiveRecentlyUsedMovieIds(timepoint)
            → Prune entries older than 48 hours
            → Return remaining IDs as exclusion list
        → Repository query excludes these IDs
```

---

## 12. Stream Manager — Singleton State Hub

**File:** `src/electron/services/streamManager.ts`

The `StreamManager` class is a singleton that holds ALL runtime state. It is the central
nervous system of the backend.

### State Fields

| Field                     | Type                               | Purpose                                |
| ------------------------- | ---------------------------------- | -------------------------------------- |
| `upcoming`                | `MediaBlock[]`                     | Ordered queue of future blocks         |
| `onDeck`                  | `MediaBlock[]`                     | Currently playing + next 1-2 blocks    |
| `continuousStream`        | `boolean`                          | Whether a continuous stream is active  |
| `args`                    | `IStreamRequest`                   | Original stream construction arguments |
| `streamVarianceInSeconds` | `number`                           | Reserved for future drift tracking     |
| `nextIterationTimepoint`  | `number`                           | Reserved for future use                |
| `nextIterationFirstMedia` | `Episode \| Movie`                 | Reserved for future use                |
| `progressionMap`          | `Map<string, number \| undefined>` | Show → next episode number             |
| `recentlyUsedMovies`      | `Map<string, number>`              | movieId → timestamp                    |
| `recentlyUsedCommercials` | `Map<string, number>`              | commercialId → timestamp               |
| `recentlyUsedShorts`      | `Map<string, number>`              | shortId → timestamp                    |
| `recentlyUsedMusic`       | `Map<string, number>`              | musicId → timestamp                    |
| `remainderTimeInSeconds`  | `number`                           | Cascaded buffer remainder              |

### On Deck / Upcoming Model

**Two-Queue Model:**

ON DECK (managed, locked, ~3 slots max):
Slot 1: Block currently playing (actively displaying)
Slot 2: Up next (locked in order)
Slot 3: Promoted from Upcoming
↑
│ (background service promotes when onDeck < 3)
│
UPCOMING (user-reorderable, ordered queue):
Block N+1
Block N+2
Block N+3
...
Block end-of-day (terminal, no buffer)
↓
When background service prunes onDeck[0] (media finished playing):
→ recordPlayedMovie() or recordPlayedEpisodeProgression() to DB
→ Shift onDeck items forward
→ Promote next Upcoming → On Deck

### Module-Level Proxy Functions

The singleton instance is `const streamManagerInstance = new StreamManager()`.
All state access goes through module-level proxy functions that call the singleton:

```typescript
// Example proxies
export function addItemToOnDeck(blocks: MediaBlock[]) {
  streamManagerInstance.getOnDeck().push(...blocks);
}
export function getRecentlyUsedMovies(): Map<string, number> {
  return streamManagerInstance.getRecentlyUsedMovies();
}
```

This pattern allows external code to import individual functions rather than the class.

### reset()

Called when stopping the stream. Clears ALL state — upcoming, onDeck, all maps, all
flags. Returns to a clean slate for the next stream.

---

## 13. Background Service — Runtime Lifecycle Loop

**File:** `src/electron/services/backgroundService.ts`

The background service is a `setTimeout`-based loop that runs every **5 minutes** (300 seconds),
aligned to 5-minute wall-clock intervals.

### Cycle Check Flow

```
cycleCheck()                          [every 5 minutes, aligned]
    │
    ├── validateUpcomingMediaFiles()
    │     Check if media files exist on disk for upcoming blocks.
    │     Logs warnings for missing files but does NOT remove blocks.
    │     Only checks blocks within the next 5-minute window.
    │
    ├── PRUNE EXPIRED ON DECK
    │     While onDeck has 2+ items AND current time >= onDeck[1].startTime:
    │       ├── Remove onDeck[0] (it finished playing)
    │       ├── recordPlayedMovie(expired)     ← persist to DB if movie
    │       └── recordPlayedEpisodeProgression(expired)  ← persist to DB if episode
    │
    │     WHY: onDeck[1].startTime has passed means onDeck[0] has finished.
    │     The while loop handles cases where multiple blocks expired between checks.
    │
    ├── PROMOTE UPCOMING → ON DECK
    │     If onDeck < 3 items AND Upcoming has items:
    │       └── Move first Upcoming item to On Deck
    │
    ├── DAY ROLLOVER CHECK
    │     Conditions (ALL must be true):
    │       ├── isContinuousStream()
    │       ├── Upcoming.length === 1
    │       └── Last Upcoming block has no buffer (terminal block)
    │
    │       └── Trigger: rolloverToNextDay(options, tomorrowTimestamp)
    │
    ├── UPDATE MARKERS
    │     ├── If passed tomorrow → recalculate setTomorrow()
    │     └── If passed endOfDayMarker → recalculate setEndOfDayMarker()
    │
    └── RESCHEDULE
          Calculate delay to next 5-minute mark
          setTimeout(cycleCheck, delay)
```

### Timing Constants

| Name                | Value          | Purpose                                 |
| ------------------- | -------------- | --------------------------------------- |
| `intervalInSeconds` | 300 (5 min)    | Cycle check frequency                   |
| `endOfDayMarker`    | 23:30 today    | When to start thinking about next day   |
| `tomorrow`          | 00:00 next day | Timepoint for day rollover construction |

### Why setTimeout Not setInterval?

The service uses `setTimeout` with calculated delays to align precisely with wall-clock
5-minute marks (e.g. 2:00, 2:05, 2:10). `setInterval` would drift over time because
it measures from when the callback finishes, not from a fixed reference point.

---

## 14. Day Rollover — Infinite Continuous Streams

**File:** `continuousStreamBuilder.ts` → `rolloverToNextDay()`

Day rollover is what makes continuous streams truly infinite. When today's content is
nearly exhausted, this function generates tomorrow's entire schedule.

```
rolloverToNextDay(streamConstructionOptions, tomorrowTimepoint)
    │
    ├── Get last block from Upcoming
    │     This block has no buffer (it was the terminal block of today)
    │     Use it as the "preceding" context for tomorrow's iteration
    │
    ├── Calculate tomorrow's time window
    │     tomorrowEndUnix = endOfDay(tomorrowTimepoint)
    │     tomorrowDateString for holiday detection
    │
    ├── Detect tomorrow's holiday state
    │     findActiveHolidaysByDate(tomorrowDateString)
    │     isHolidayDate() / isHolidaySeason()
    │
    ├── buildStreamIteration(tomorrowTimepoint, tomorrowEnd, ...)
    │     Same function used during initial construction
    │     Returns [backfillBuffer, iterationBlocks]
    │
    ├── BACKFILL: Assign backfillBuffer to lastUpcomingBlock.buffer
    │     This is the ONLY place where an existing block's buffer is mutated.
    │     Safe because this block hasn't moved to On Deck yet.
    │
    └── APPEND: Add iterationBlocks to Upcoming
          streamManager.addToUpcomingStream(iterationBlocks)
```

### Why No Buffer on the Last Block?

`fillStreamBlockBuffers()` skips the last block in every iteration because:

1. The last block has no "next block" to theme Half B against
2. During rollover, the first block of the NEW day provides the Half B context
3. This is backfilled at rollover time, creating a seamless day transition

```
TODAY'S LAST BLOCK          |  TOMORROW'S FIRST BLOCK
                            |
  anchorMedia = "Movie X"   |  anchorMedia = "Show Y"
  buffer = [] ←─────────────┤  buffer = [...]
     ▲                      |
     │                      |
     └── Backfilled during rollover:
         createBuffer(budget,
           tags from "Movie X",    ← Half A
           tags from "Show Y"      ← Half B
         )
```

---

## 15. Player Manager — Playback Abstraction

**File:** `src/electron/services/playerManager.ts`

The player manager is a thin abstraction layer that supports multiple playback backends:

| Player Type   | Status      | Description                     |
| ------------- | ----------- | ------------------------------- |
| `electron`    | **Default** | Built-in Electron player (TODO) |
| `vlc`         | Planned     | External VLC player             |
| `web`         | Planned     | Browser-based player            |
| `ffmpeg-plex` | Planned     | FFmpeg transcoding for Plex     |

Currently, `addMediaBlockToPlayer()` is a dispatch function that routes to the appropriate
player. The critical contract is that media blocks are pushed **during stream construction**
to minimize the time between user clicking "Start" and seeing content play.

---

## 16. Database & Repository Layer

### SQLite Configuration

- **Engine:** `better-sqlite3` (synchronous, embedded)
- **WAL mode:** enabled for concurrent read/write
- **Foreign keys:** ON
- **Location:** user data directory

### Key Tables

| Table                  | Purpose                        | Persists Across Restarts |
| ---------------------- | ------------------------------ | ------------------------ |
| `movies`               | Movie library                  | Yes                      |
| `shows`                | Show library                   | Yes                      |
| `episodes`             | Episode library                | Yes                      |
| `commercials`          | Commercial library             | Yes                      |
| `shorts`               | Short film library             | Yes                      |
| `music`                | Music video library            | Yes                      |
| `promos`               | Channel idents                 | Yes                      |
| `bumpers`              | Transition clips               | Yes                      |
| `tags`                 | Tag definitions                | Yes                      |
| `facets`               | Thematic relationships         | Yes                      |
| `mosaics`              | Musical genre groupings        | Yes                      |
| `episode_progression`  | Show tracking per stream type  | **Yes**                  |
| `recently_used_movies` | Movie dedup across restarts    | **Yes**                  |
| `media_tags`           | Media↔Tag junction             | Yes                      |
| `facet_relationships`  | Facet relationship definitions | Yes                      |

### Repository Pattern

Each media type has a dedicated repository class in `src/electron/repositories/`.
Repositories provide:

- CRUD operations
- Specialized query methods (e.g. `findByTagsAndAgeGroupsUnderDuration`)
- Direct `better-sqlite3` prepared statements (no ORM)

### The Timepoint Model

All timestamps in the stream are **Unix seconds** (not milliseconds). This is consistent
throughout the backend:

```
timepoint = Math.floor(Date.now() / 1000)    // Current time as Unix seconds
duration = 1800                                // 30 minutes
endTime = timepoint + duration                 // When this block ends
```

The only exceptions are:

- `Date.now()` returns milliseconds (divided by 1000 immediately)
- ISO strings for DB storage (converted at read/write boundaries)

---

## Appendix A: Complete File Map

### Stream Construction Pipeline

| File                                                     | Lines | Purpose                                               |
| -------------------------------------------------------- | ----- | ----------------------------------------------------- |
| `services/streamService.ts`                              | ~40   | Entry point, routes by StreamType                     |
| `services/streamConstruction/continuousStreamBuilder.ts` | ~700  | Full pipeline: init, cadence, iteration, rollover     |
| `services/streamConstruction/adhocStreamBuilder.ts`      | ~10   | Stub for future adhoc streams                         |
| `services/streamConstruction/mediaSelector.ts`           | ~310  | Themed/random/holiday/specialty/facet selection       |
| `services/streamConstruction/selectionHelpers.ts`        | ~420  | Episode fitting, progression, recently-used filtering |
| `services/bufferConstructor.ts`                          | ~600  | Buffer creation, half-A/B split, commercial fill      |

### Prism System

| File                 | Lines | Purpose                                          |
| -------------------- | ----- | ------------------------------------------------ |
| `prisms/spectrum.ts` | ~560  | Buffer media pool selection (gated expansion)    |
| `prisms/facets.ts`   | ~100  | Facet relationship matching + weighted selection |

### Runtime

| File                                    | Lines | Purpose                                                           |
| --------------------------------------- | ----- | ----------------------------------------------------------------- |
| `services/streamManager.ts`             | ~600  | Singleton state hub (all runtime state)                           |
| `services/backgroundService.ts`         | ~250  | 5-minute lifecycle loop, On Deck management, day rollover trigger |
| `services/playerManager.ts`             | ~100  | Playback abstraction (multi-backend)                              |
| `services/holidayIntentCacheManager.ts` | ~400  | Lazy holiday cache + 3-day rotation budgeting                     |
| `services/facetWalkabilityService.ts`   | ~100  | Graph connectivity check for facets                               |

### Utilities & Types

| File                              | Lines | Purpose                                           |
| --------------------------------- | ----- | ------------------------------------------------- |
| `utils/common.ts`                 | ~70   | `findNextCadenceTime()`, `segmentTags()`          |
| `types/MediaBlock.ts`             | ~25   | MediaBlock class (buffer, anchorMedia, startTime) |
| `types/StreamRequest.ts`          | ~12   | IStreamRequest interface                          |
| `types.d.ts` (root)               | ~400  | ALL global types, enums, interfaces               |
| `factories/mediaBlock.factory.ts` | ~25   | MediaBlock factory function                       |

---

## Appendix B: Glossary

| Term                   | Definition                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **Anchor Media**       | The primary show or movie in a MediaBlock. What the viewer is "watching."                     |
| **Buffer**             | Filler content (commercials, shorts, music, promos) between anchor media.                     |
| **Cadence**            | Alignment of anchor media to :00 and :30 marks on the clock.                                  |
| **Cadence Mark**       | A :00 or :30 time boundary.                                                                   |
| **Duration**           | Actual runtime of media in seconds.                                                           |
| **DurationLimit**      | Maximum allowed duration for this time slot (e.g. 1800 for a 30-min show).                    |
| **Facet**              | A genre + aesthetic pairing that defines a thematic identity (e.g. Sci-Fi Noir).              |
| **Facet Relationship** | Connection between two facets with a `distance` (0.0 = identical, 1.0 = unrelated).           |
| **Facet Walking**      | The process of selecting thematically related media through facet relationships.              |
| **Gate (Buffer)**      | A level in the spectrum pool expansion where more media is added if the pool is insufficient. |
| **Half A / Half B**    | The two halves of a buffer, themed to the preceding and upcoming anchor respectively.         |
| **Holiday Date**       | An exact date when a holiday occurs (e.g. Dec 25). Triggers saturation mode.                  |
| **Holiday Season**     | A date range around a holiday (e.g. Dec 1-31). Triggers budgeted mode.                        |
| **Iteration**          | One pass through the main `while` loop in `buildStreamIteration()`.                           |
| **On Deck**            | The 2-3 blocks that are currently playing or about to play. Managed by background service.    |
| **overDuration**       | An episode that exceeds its show's normal `durationLimit`.                                    |
| **Prism System**       | Collective name for the facets and spectrum modules that handle themed selection.             |
| **Promo**              | A 15-second channel ident (like a network logo bumper). One per buffer.                       |
| **Recently Used**      | Media that has played within its eviction window and should be avoided.                       |
| **Remainder**          | Leftover seconds from a buffer that couldn't be perfectly filled. Cascades forward.           |
| **Rollover**           | Generation of the next day's stream when today's Upcoming is nearly exhausted.                |
| **Smart Shuffle**      | Holiday date mode's 80/20 alternation to prevent movie→movie or episode→episode streaks.      |
| **Spectrum**           | The buffer media selection system (gated pool expansion with validation).                     |
| **Theme Walking**      | Carrying tags forward from one anchor to the next to maintain thematic coherence.             |
| **Timepoint**          | A moment in time expressed as Unix seconds (not milliseconds).                                |
| **Upcoming**           | Ordered queue of future blocks. User can reorder. Background service promotes to On Deck.     |
