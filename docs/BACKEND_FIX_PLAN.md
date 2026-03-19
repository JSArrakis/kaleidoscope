# Backend Fix Plan — Bugs, Warnings & Dead Code

**Source:** BACKEND_ACCOUNTING.md v2 (2026-03-09)  
**Goal:** Resolve all remaining 🐛 bugs, ⚠️ concerns, and ℹ️ dead code from the v2 audit  
**Approach:** Ordered by severity and dependency — DB bugs first (foundation), then logic fixes, then cleanup

---

## Table of Contents

1. [Fix #1 — SQLite Trailing Commas in CREATE TABLE (🐛 BUG)](#fix-1--sqlite-trailing-commas-in-create-table)
2. [Fix #2 — Phantom Index Columns and Tables (🐛 BUG)](#fix-2--phantom-index-columns-and-tables)
3. [Fix #3 — Biased Shuffle → Fisher-Yates (⚠️ CONCERN)](#fix-3--biased-shuffle--fisher-yates)
4. [Fix #4 — Duplicate Functions Across Files (⚠️ CONCERN)](#fix-4--duplicate-functions-across-files)
5. [Fix #5 — `recordPlayedEpisodeProgression` Hardcodes StreamType (⚠️ CONCERN)](#fix-5--recordplayedepisodeprogression-hardcodes-streamtype)
6. [Fix #6 — Dead Code Removal (ℹ️ CLEANUP)](#fix-6--dead-code-removal)
7. [Deferred — Not Fixing Now](#deferred--not-fixing-now)
8. [Execution Order](#execution-order)

---

## Fix #1 — SQLite Trailing Commas in CREATE TABLE

**Severity:** 🐛 BUG  
**File:** `src/electron/db/sqlite.ts` (lines ~437–467)  
**Impact:** On a fresh database, all 4 `recently_used_*` tables will fail to create. Currently masked by `IF NOT EXISTS` on existing DBs.

### What's Wrong

All four `recently_used_*` CREATE TABLE statements have trailing commas after the last column definition:

```sql
CREATE TABLE IF NOT EXISTS recently_used_commercials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mediaItemId TEXT NOT NULL,
  expiresAt DATETIME,    ← TRAILING COMMA — invalid SQL
);
```

Same pattern for `recently_used_shorts`, `recently_used_music`, `recently_used_movies`.

### Fix

Remove the trailing comma from each of the 4 statements. Change `expiresAt DATETIME,` → `expiresAt DATETIME` (no comma).

### Instructions

1. Open `src/electron/db/sqlite.ts`
2. Find the 4 CREATE TABLE blocks for `recently_used_commercials`, `recently_used_shorts`, `recently_used_music`, `recently_used_movies` (~lines 437–467)
3. In each one, remove the trailing comma after `expiresAt DATETIME`
4. Before: `expiresAt DATETIME,` → After: `expiresAt DATETIME`
5. This is a 4-location find-and-replace within the same file — use multi_replace

### Verification

- Run existing test suite to confirm no regressions
- If a test creates a fresh in-memory DB, these CREATE TABLE statements will now succeed where they would have previously failed

---

## Fix #2 — Phantom Index Columns and Tables

**Severity:** 🐛 BUG  
**File:** `src/electron/db/sqlite.ts`, `createIndexes()` method (lines ~537–554)  
**Impact:** `db.exec(indexes)` stops at the first error. The phantom indexes fail, which may prevent `episode_progression` indexes (which come later alphabetically) from being created.

### What's Wrong

The index block defines indexes on columns and tables that don't exist:

**Phantom columns** (`usageContext`, `usedAt`) — these columns don't exist on any `recently_used_*` table (tables only have `id`, `mediaItemId`, `expiresAt`):

- `idx_recently_used_commercials_usageContext` → `recently_used_commercials(usageContext)`
- `idx_recently_used_commercials_usedAt` → `recently_used_commercials(usedAt)`
- Same pattern for `recently_used_shorts`, `recently_used_music`, `recently_used_movies` — 8 phantom indexes total

**Phantom table** (`recently_used_shows` doesn't exist):

- `idx_recently_used_shows_mediaItemId` → `recently_used_shows(mediaItemId)`
- `idx_recently_used_shows_usageContext` → `recently_used_shows(usageContext)`
- `idx_recently_used_shows_usedAt` → `recently_used_shows(usedAt)`

Total: **11 phantom index statements** to remove.

### Fix

1. **Delete** all 11 phantom index lines (the `usageContext` and `usedAt` indexes for all 4 tables + all 3 `recently_used_shows` indexes)
2. **Keep** the valid `mediaItemId` indexes for the 4 real tables:
   - `idx_recently_used_commercials_mediaItemId` ✅ keep
   - `idx_recently_used_shorts_mediaItemId` ✅ keep
   - `idx_recently_used_music_mediaItemId` ✅ keep
   - `idx_recently_used_movies_mediaItemId` ✅ keep
3. **Add** an `expiresAt` index for `recently_used_movies` (it's the only one queried by expiration via `cleanupExpiredRecentlyUsed`):
   - `CREATE INDEX IF NOT EXISTS idx_recently_used_movies_expiresAt ON recently_used_movies(expiresAt);`

After cleanup, the recently_used index block should be:

```sql
CREATE INDEX IF NOT EXISTS idx_recently_used_commercials_mediaItemId ON recently_used_commercials(mediaItemId);
CREATE INDEX IF NOT EXISTS idx_recently_used_shorts_mediaItemId ON recently_used_shorts(mediaItemId);
CREATE INDEX IF NOT EXISTS idx_recently_used_music_mediaItemId ON recently_used_music(mediaItemId);
CREATE INDEX IF NOT EXISTS idx_recently_used_movies_mediaItemId ON recently_used_movies(mediaItemId);
CREATE INDEX IF NOT EXISTS idx_recently_used_movies_expiresAt ON recently_used_movies(expiresAt);
```

### Instructions

1. Open `src/electron/db/sqlite.ts`
2. Find `createIndexes()` method, locate the recently_used index block (~lines 537–551)
3. Replace the entire block of recently_used indexes (lines 537–551, which has 15 statements across 5 table groups) with the 5 valid statements above
4. Confirm that the `episode_progression` indexes (~lines 552–554) remain immediately after — they should now execute without being blocked

### Verification

- Grep for `usageContext` in sqlite.ts — should return 0 results
- Grep for `usedAt` in sqlite.ts — should return 0 results
- Grep for `recently_used_shows` in sqlite.ts — should only appear if there's a comment, never in a CREATE statement
- Run test suite — any test that initializes a fresh DB should now pass index creation cleanly

---

## Fix #3 — Biased Shuffle → Fisher-Yates

**Severity:** ⚠️ CONCERN  
**Files:** 3 files, 3 locations  
**Impact:** Non-uniform distribution when shuffling. In media selection this means some movies/content items are statistically more likely to be picked than others.

### What's Wrong

Three locations use `array.sort(() => 0.5 - Math.random())` which produces a biased (non-uniform) shuffle. The correct Fisher-Yates algorithm already exists in `spectrum.ts` as a private function.

**Location 1:** `src/electron/services/streamConstruction/selectionHelpers.ts` line ~207  
Inside `trySelectMovie()`:

```typescript
return movies.sort(() => 0.5 - Math.random())[0];
```

**Location 2:** `src/electron/services/bufferConstructor.ts` line ~310  
Inside `createBuffer()`:

```typescript
selectedMedia = selectedMedia.sort(() => 0.5 - Math.random());
```

**Location 3:** `src/electron/services/bufferConstructor.ts` line ~534  
Inside `selectShortsAndMusic()`:

```typescript
const shuffled = combined.sort(() => 0.5 - Math.random());
```

### Fix

**Step A:** Extract the Fisher-Yates `shuffle<T>` function from `spectrum.ts` into `src/electron/utils/common.ts` and export it.

```typescript
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Step B:** Update `spectrum.ts` to import `shuffle` from `../utils/common.js` instead of defining it locally. Remove the local `function shuffle<T>` definition.

**Step C:** Replace all 3 biased shuffles:

- **selectionHelpers.ts line ~207:** `return movies.sort(() => 0.5 - Math.random())[0]` → `return shuffle(movies)[0]` (add import for `shuffle` from `../../utils/common.js`)

- **bufferConstructor.ts line ~310:** `selectedMedia = selectedMedia.sort(() => 0.5 - Math.random())` → `selectedMedia = shuffle(selectedMedia)` (add import for `shuffle` from `../utils/common.js`)

- **bufferConstructor.ts line ~534:** `const shuffled = combined.sort(() => 0.5 - Math.random())` → `const shuffled = shuffle(combined)` (already imported above)

### Instructions

1. Open `src/electron/utils/common.ts` — add the `shuffle<T>` export function at the end of the file
2. Open `src/electron/prisms/spectrum.ts` — add `import { shuffle } from "../utils/common.js"` to existing imports, then delete the local `function shuffle<T>` definition (~lines 18–26) AND remove the now-unused `shuffleAndHalve` if it only wraps `shuffle` internally (check first)
   - **WAIT:** `shuffleAndHalve` calls `shuffle` — it still needs it. So just remove the local `shuffle` definition, keep `shuffleAndHalve` (it will use the imported `shuffle`)
3. Open `src/electron/services/streamConstruction/selectionHelpers.ts` — add `import { shuffle } from "../../utils/common.js"` and replace the biased sort on line ~207
4. Open `src/electron/services/bufferConstructor.ts` — add `import { shuffle } from "../utils/common.js"` and replace both biased sorts on lines ~310 and ~534
5. Confirm no other occurrences exist: grep for `sort(() => 0.5 - Math.random()` across the codebase

### Verification

- Grep for `0.5 - Math.random()` — should return 0 results
- Grep for `shuffle` in `common.ts` — should show the export
- Grep for `shuffle` in `spectrum.ts` — should show import, NOT local definition
- Run test suite

---

## Fix #4 — Duplicate Functions Across Files

**Severity:** ⚠️ CONCERN  
**Files:** 4 files involved  
**Impact:** No functional bug today, but divergence risk on future edits.

### What's Wrong

**Duplicate A: `cleanupExpiredRecentlyUsed`**

- Copy in `src/electron/services/streamConstruction/selectionHelpers.ts` (lines ~147–155) — **NOT imported by anyone** (exported but unused)
- Copy in `src/electron/prisms/core.ts` (lines ~49–57) — called by `selectRandomEpisodeOrMovie` in core.ts

Both are identical: take `timepoint`, convert to ISO, `DELETE FROM recently_used_movies WHERE expiresAt <= ?`.

**Duplicate B: `getAgeGroups` / `getAgeGroupAdjacency`**

- `getAgeGroups` in `src/electron/prisms/spectrum.ts` (lines ~365–390) — private, called by `selectBufferMedia`
- `getAgeGroupAdjacency` in `src/electron/prisms/core.ts` (lines ~15–44) — exported, called by `selectRandomEpisodeOrMovie` in core.ts. **Not imported externally.**

Both are identical: sort by sequence, take first, look up ±1 adjacent by sequence.

### Fix

**For `cleanupExpiredRecentlyUsed`:**
The canonical copy should stay in `core.ts` (the only one actually called). Delete the unused export from `selectionHelpers.ts`.

1. Remove `cleanupExpiredRecentlyUsed` from `selectionHelpers.ts`
2. Leave `core.ts` version as-is (it's the one used by `selectRandomEpisodeOrMovie`)
3. Confirm no imports reference `cleanupExpiredRecentlyUsed` from `selectionHelpers` — the subagent confirmed none exist

**For `getAgeGroups` / `getAgeGroupAdjacency`:**
The canonical version should be `getAgeGroupAdjacency` in `core.ts` (already exported, better name). Make `spectrum.ts` import it instead of defining its own.

1. In `spectrum.ts`: add `import { getAgeGroupAdjacency } from "./core.js"`
2. In `spectrum.ts`: delete the private `getAgeGroups` function definition (~lines 365–390)
3. In `spectrum.ts`: replace all calls to `getAgeGroups(...)` with `getAgeGroupAdjacency(...)` — search for `getAgeGroups(` in spectrum.ts to find all callsites

### Instructions

1. Open `src/electron/services/streamConstruction/selectionHelpers.ts`
   - Delete the entire `cleanupExpiredRecentlyUsed` function (~lines 147–155)
   - Verify no import statements in other files reference it from this path

2. Open `src/electron/prisms/spectrum.ts`
   - Add `getAgeGroupAdjacency` to the imports from `./core.js` (or add a new import line if none exists)
   - Delete the private `function getAgeGroups(...)` definition (~lines 365–390)
   - Find-and-replace `getAgeGroups(` → `getAgeGroupAdjacency(` within spectrum.ts

3. Verify:
   - `core.ts` still exports both `cleanupExpiredRecentlyUsed` and `getAgeGroupAdjacency` — no changes needed there
   - `selectionHelpers.ts` no longer exports `cleanupExpiredRecentlyUsed`
   - `spectrum.ts` no longer defines `getAgeGroups`

### Verification

- Grep for `function cleanupExpiredRecentlyUsed` — should appear only in `core.ts`
- Grep for `function getAgeGroups` — should return 0 results (private definition removed)
- Grep for `getAgeGroupAdjacency` — should appear in `core.ts` (definition) and `spectrum.ts` (import + usage)
- Run test suite
- Check for TypeScript errors in both files

---

## Fix #5 — `recordPlayedEpisodeProgression` Hardcodes StreamType

**Severity:** ⚠️ CONCERN  
**File:** `src/electron/services/streamManager.ts` (lines ~331–350)  
**Impact:** When adhoc streams are implemented, episodes would incorrectly record progression under `StreamType.Cont`.

### What's Wrong

```typescript
export function recordPlayedEpisodeProgression(mediaBlock: MediaBlock): void {
  if (
    mediaBlock.anchorMedia &&
    mediaBlock.anchorMedia.type === MediaType.Episode
  ) {
    const episode = mediaBlock.anchorMedia as Episode;
    episodeProgressionRepository.upsertByShowAndStreamType(
      episode.showItemId,
      StreamType.Cont, // ← always Cont, regardless of actual stream type
      episode.episodeNumber,
    );
  }
}
```

The function has no way to know the actual stream type. `MediaBlock` doesn't carry it. The singleton tracks whether a stream is continuous (`isContinuous()` boolean) but not the actual `StreamType` enum.

### Fix

The simplest correct approach: derive the stream type from the singleton's existing state. The singleton already knows if the stream is continuous. When it's not continuous but a stream is running, it must be adhoc (the only other implemented type).

Add a `getStreamType()` function to the StreamManager that returns the current `StreamType` based on existing state:

```typescript
export function getStreamType(): StreamType {
  return streamManagerInstance.isContinuous()
    ? StreamType.Cont
    : StreamType.Adhoc;
}
```

Then update `recordPlayedEpisodeProgression` to use it:

```typescript
episodeProgressionRepository.upsertByShowAndStreamType(
  episode.showItemId,
  getStreamType(), // ← dynamic instead of hardcoded
  episode.episodeNumber,
);
```

### Instructions

1. Open `src/electron/services/streamManager.ts`
2. Add `getStreamType()` as a new exported function near the other stream-state accessors (~line 375 area, near `isContinuousStream()`)
3. In `recordPlayedEpisodeProgression` (~line 340), replace `StreamType.Cont` with `getStreamType()`
4. No other files need changes — this function is only called from `backgroundService.ts`

### Verification

- Grep for `StreamType.Cont` in `streamManager.ts` — should only appear in the `initializeStream` stub default parameter (which is dead code anyway), NOT in `recordPlayedEpisodeProgression`
- Type-check the file — `getStreamType()` returns `StreamType` which matches the upsert parameter type
- Run test suite

---

## Fix #6 — Dead Code Removal

**Severity:** ℹ️ CLEANUP  
**Files:** 3 files  
**Impact:** No runtime effect. Reduces confusion and maintenance surface.

### What to Remove

| Item                             | File                                                       | Lines          | Reason                                                             |
| -------------------------------- | ---------------------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| `recentlyUsedMediaRepository.ts` | `src/electron/repositories/recentlyUsedMediaRepository.ts` | Entire file    | Imported nowhere, targets non-existent `recently_used_media` table |
| `RecentlyUsedMedia` type         | `types.d.ts`                                               | lines ~250–260 | Only used by the dead repository                                   |
| `initializeStream()`             | `src/electron/services/streamManager.ts`                   | lines ~232–240 | Empty stub, never called                                           |
| `initializeOnDeckStream()`       | `src/electron/services/streamManager.ts`                   | lines ~244–255 | Legacy function, not used by new construction flow                 |
| `addInitialMediaBlocks()`        | `src/electron/services/streamManager.ts`                   | lines ~568–575 | Empty stub, commented-out body, never called                       |

### Instructions

1. **Delete the file** `src/electron/repositories/recentlyUsedMediaRepository.ts`
   - First confirm: grep for `recentlyUsedMediaRepository` across the codebase — should appear only in the file itself and BACKEND_ACCOUNTING.md

2. **Remove `RecentlyUsedMedia` type** from `types.d.ts`
   - Find the type definition (~lines 250–260) and delete it
   - First confirm: grep for `RecentlyUsedMedia` across the codebase — should only appear in the dead repo file (being deleted) and BACKEND_ACCOUNTING.md

3. **Remove 3 dead functions** from `streamManager.ts`:
   - Delete `initializeStream()` (~lines 232–240)
   - Delete `initializeOnDeckStream()` (~lines 244–255)
   - Delete `addInitialMediaBlocks()` (~lines 568–575)
   - First confirm each: grep for the function name — should have no callsites outside the file itself

4. **Note:** Do NOT delete the dormant `recently_used_commercials`, `recently_used_shorts`, `recently_used_music` tables from the schema. They exist by design as future-proofing for when buffer media gets DB persistence. They just don't have readers/writers yet.

### Verification

- Grep for `recentlyUsedMediaRepository` — should return 0 results in source files
- Grep for `RecentlyUsedMedia` — should return 0 results in source files
- Grep for `initializeStream` — should not appear as a callsite anywhere
- Grep for `initializeOnDeckStream` — should not appear as a callsite anywhere
- Grep for `addInitialMediaBlocks` — should not appear as a callsite anywhere
- TypeScript compilation passes with no errors
- Run test suite

---

## Deferred — Not Fixing Now

These items from the audit are noted but intentionally deferred:

### ⚠️ Player Pushes Before On Deck Registration

**Why defer:** This is an intentional latency optimization. The 5-minute cycle interval makes the race condition practically impossible. Fixing it would require restructuring the construction pipeline's push-then-register flow, which is high effort for near-zero risk. Revisit if the cycle interval is ever shortened.

### ⚠️ endOfDayMarker Hardcoded to 23:30

**Why defer:** This is likely intentional — 30 minutes of lead time for next-day generation. The stream builds until 23:59:59 (date-fns `endOfDay`), and the background service starts preparing the next day at 23:30. The two values serve different purposes. If this becomes a problem (e.g., streams ending early), revisit then.

### ℹ️ Dormant DB Tables (recently_used_commercials/shorts/music)

**Why defer:** These exist in the schema as forward-looking placeholders for when buffer media gets DB persistence. Nothing reads/writes them, but they're not hurting anything. Leave them for when the feature is implemented.

---

## Execution Order

Fixes should be applied in this order due to dependencies and risk:

| Order | Fix                          | Rationale                                                                                                                                           |
| ----- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Fix #1 — Trailing commas     | Foundation fix. Must be correct before any test that creates a fresh DB.                                                                            |
| **2** | Fix #2 — Phantom indexes     | Same file, same area. Do both DB fixes together.                                                                                                    |
| **3** | Fix #3 — Biased shuffle      | Creates `shuffle` in `common.ts`. Later fixes may benefit from it, and it touches spectrum.ts which Fix #4 also touches.                            |
| **4** | Fix #4 — Duplicate functions | Depends on Fix #3 completing spectrum.ts changes (both modify the same file). Removes dead export from selectionHelpers + deduplicates spectrum.ts. |
| **5** | Fix #5 — StreamType hardcode | Independent, but logically follows after the deduplication pass.                                                                                    |
| **6** | Fix #6 — Dead code removal   | Last — removes files and functions. Should be done after all other fixes to avoid removing something that a fix accidentally depends on.            |

### Post-Fix Checklist

After all 6 fixes are applied:

- [ ] Full TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Full test suite passes
- [ ] Grep confirms: 0 results for `0.5 - Math.random()`, `usageContext`, `usedAt`, `recently_used_shows`, `recentlyUsedMediaRepository` (in source)
- [ ] Grep confirms: `function cleanupExpiredRecentlyUsed` appears only in `core.ts`
- [ ] Grep confirms: `function getAgeGroups` returns 0 results
- [ ] Update BACKEND_ACCOUNTING.md — mark all resolved items, clear the new issues table
