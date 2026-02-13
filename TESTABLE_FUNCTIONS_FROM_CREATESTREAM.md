# Testable Functions from createStream Call Chain

## Overview

This document traces the complete call graph from `createStream` through all branching function calls and identifies which functions **can be tested without creating mocked data or functionality**.

---

## Call Graph Analysis

### 🔴 LEVEL 0: Entry Point

- **`createStream`** (streamService.ts)
  - Takes: `streamType`, `streamConstructionOptions`, `startTimepoint`, `endTimepoint?`
  - Returns: `Promise<[MediaBlock[], string]>`
  - Requires: Mock data for StreamType, StreamConstructionOptions

---

### 🔴 LEVEL 1: Top-Level Builders

- **`buildContinuousStream`** (continuousStreamBuilder.ts)
  - Requires: Mock data (options, timepoints)
  - Calls: Multiple internal functions
- **`buildAdhocStream`** (adhocStreamBuilder.ts)
  - **Status: NOT IMPLEMENTED** - Returns stub error message

---

### 🟡 LEVEL 2: Initialization & Decision Logic

#### From buildContinuousStream:

1. **`initializeContinuousStream`** ✅ **TESTABLE (LIMITED)**
   - Needs: `incomingTimepoint` (number), `streamConstructionOptions`
   - Pure calculations (mostly), uses date functions
   - Calls: `tagRepository.findActiveHolidaysByDate()` - **REQUIRES MOCK**
   - **VERDICT**: Testable with database mock OR with test data setup

2. **`isHolidayDate`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `unixSeconds` (number), `holidays` (Tag[])
   - Pure calculation: string comparison
   - No external dependencies
   - **VERDICT**: Can be tested directly with test data

3. **`isHolidaySeason`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `incomingTimepoint` (number), `holidays` (Tag[])
   - Pure calculation: date string comparison
   - No external dependencies
   - **VERDICT**: Can be tested directly with test data

4. **`getDateString`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `unixSeconds` (number)
   - Pure calculation: date formatting
   - No external dependencies
   - **VERDICT**: Can be tested directly

5. **`getProgressionsByStreamType`** 🔴 **NOT TESTABLE**
   - Needs: `streamType` (StreamType)
   - Calls: `episodeProgressionRepository.findByStreamType()` - **REQUIRES DATABASE MOCK**
   - **VERDICT**: Must mock repository

---

### 🟡 LEVEL 3: Cadenced Stream Building

#### Main decision point: buildCadencedContinuousStream

1. **`findNextCadenceTime`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `now` (number - unix timestamp in seconds)
   - Pure calculation: date/time math
   - No external dependencies
   - **VERDICT**: Can be tested directly
   - Logic: Finds next :00 or :30 mark

2. **`buildCadencedWithInitialBuffer`** 🔴 **NOT TESTABLE**
   - Calls: `createBuffer()`, `createMediaBlock()`, manager functions
   - Calls: `playerManager.addMediaBlockToPlayer()` - **REQUIRES MOCK**
   - Calls: `streamManager.addItemToOnDeck()` - **REQUIRES MOCK**

3. **`buildCadencedWithoutInitialBuffer`** 🔴 **NOT TESTABLE**
   - Calls: `playerManager` functions - **REQUIRES MOCK**
   - Calls: `streamManager` functions - **REQUIRES MOCK**

---

### 🟡 LEVEL 4: Media Selection

#### selectSecondAnchorAndBuildStream:

1. **`segmentTags`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `tags` (Tag[])
   - Pure filtering: groups tags by type
   - No external dependencies
   - **VERDICT**: Can be tested directly
   - Returns: `SegmentedTags`

2. **`selectThemedMedia`** 🔴 **NOT TESTABLE** (calls other functions that aren't pure)
   - Needs: Multiple parameters including holiday context
   - Calls: `movieRepository.findByTags()` - **REQUIRES DATABASE MOCK**
   - Calls: `showRepository.findByEpisodeTags()` - **REQUIRES DATABASE MOCK**
   - Calls: `holidayIntentCacheManager.canAddMoreContent()` - **REQUIRES MOCK**
   - Calls: `selectSpecialtyAdjacentMedia()` - complex logic
   - Calls: `selectFacetAdjacentMedia()` - complex logic
   - Calls: `selectRandomMedia()` - requires repository mocks

3. **`selectRandomMedia`** 🔴 **NOT TESTABLE**
   - Calls: `cleanupExpiredRecentlyUsed()` - **REQUIRES DATABASE MOCK**
   - Calls: `movieRepository.findRandomMovieUnderDuration()` - **REQUIRES DATABASE MOCK**
   - Calls: `showRepository.findAllShowsUnderDuration()` - **REQUIRES DATABASE MOCK**
   - Calls: `getEpisodeFromShowCandidates()` - complex logic

4. **`selectHolidayMediaForTag`** 🔴 **NOT TESTABLE**
   - Calls: `movieRepository.findByTags()` - **REQUIRES DATABASE MOCK**
   - Calls: `showRepository.findByEpisodeTags()` - **REQUIRES DATABASE MOCK**

5. **`selectSpecialtyAdjacentMedia`** 🔴 **NOT TESTABLE** (currently stubbed)
   - Calls: `movieRepository.findByTagsAndAgeGroupsUnderDuration()` - **REQUIRES DATABASE MOCK**
   - Returns: null (not fully implemented)

---

### 🟡 LEVEL 5: Buffer Construction

#### createBuffer & constructBufferHalf:

1. **`createBuffer`** 🔴 **NOT TESTABLE**
   - Calls: `recentlyUsedMediaRepository.deleteExpired()` - **REQUIRES DATABASE MOCK**
   - Calls: `promoRepository.findRandomPromo()` - **REQUIRES DATABASE MOCK**
   - Calls: `constructBufferHalf()` - complex logic

2. **`determineBufferStrategy`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: `duration` (number)
   - Pure calculation: threshold comparison
   - No external dependencies
   - **VERDICT**: Can be tested directly
   - Returns: `BufferStrategy` ("short" | "medium" | "large")

3. **`randomizeShortsMusicCount`** ✅ **TESTABLE** (with Math.random seeding)
   - Needs: `strategy` (BufferStrategy)
   - Pure calculation: random number generation
   - **VERDICT**: Can test with seeded random or multiple runs
   - Returns: number (count of shorts/music items)

4. **`splitCountBetweenHalves`** ✅ **TESTABLE** (with Math.random seeding)
   - Needs: `totalCount` (number)
   - Pure calculation: random split
   - **VERDICT**: Can test with seeded random
   - Returns: `{halfA: number, halfB: number}`

5. **`selectCommercials`** 🔴 **NOT TESTABLE** (requires test data of commercials)
   - Needs: Commercial[] data structures
   - Pure logic: duration matching algorithm
   - **Note**: Logic IS testable IF commercials array is provided
   - **VERDICT**: Testable with test data arrays (no database calls)

6. **`selectShortsAndMusic`** ✅ **TESTABLE**
   - Needs: `music` (Music[]), `shorts` (Short[]), `targetCount`, `maxDuration`
   - Pure logic: selection and duration calculation
   - No external dependencies
   - **VERDICT**: Can be tested directly with test data arrays

7. **`constructBufferHalf`** 🔴 **NOT TESTABLE** (calls repository functions)
   - Calls: `commercialRepository.findByDefaultSpecialtyTag()` - **REQUIRES DATABASE MOCK**
   - Calls: `selectBufferMedia()` - calls repository functions
   - Calls: `recentlyUsedMediaRepository.recordUsage()` - **REQUIRES DATABASE MOCK**

---

### 🟡 LEVEL 6: Helper & Utility Functions

1. **`isBufferMediaPoolValid`** ✅ **TESTABLE - PURE FUNCTION**
   - Needs: Arrays of commercials/shorts/music + duration
   - Pure calculation: duration analysis
   - No external dependencies
   - **VERDICT**: Can be tested directly with test data

2. **`selectBufferMedia`** 🔴 **NOT TESTABLE** (calls repository functions)
   - Calls: `getHolidayBufferMedia()` which calls repositories
   - Calls: `getSpecialtyBufferMedia()` which calls repositories

3. **`selectFacetAdjacentMedia`** 🔴 **NOT TESTABLE** (calls repository functions)
   - Calls: `facetRepository.findByGenreAndAestheticId()` - **REQUIRES DATABASE MOCK**
   - Calls: `movieRepository.findByTag()` - **REQUIRES DATABASE MOCK**

4. **`findMatchingFacets`** 🔴 **NOT TESTABLE**
   - Calls: `facetRepository.findByGenreAndAestheticId()` - **REQUIRES DATABASE MOCK**

5. **`findMediaWithFacet`** 🔴 **NOT TESTABLE**
   - Calls: `movieRepository.findByTag()` - **REQUIRES DATABASE MOCK**
   - Calls: `showRepository.findByTag()` - **REQUIRES DATABASE MOCK**

6. **`doesNextEpisodeFitDuration`** ✅ **TESTABLE**
   - Needs: `show` (Show), `progressionMap`, `availableDuration`
   - Pure logic: episode lookup and duration check
   - No external dependencies
   - **VERDICT**: Can be tested with test Show data

7. **`incrementShowProgression`** ✅ **TESTABLE**
   - Needs: `show` (Show), `progressionMap` (Map)
   - Pure logic: map mutation and wraparound logic
   - No external dependencies
   - **VERDICT**: Can be tested with test data

8. **`cleanupExpiredRecentlyUsed`** 🔴 **NOT TESTABLE**
   - Calls: `recentlyUsedMediaRepository.deleteExpired()` - **REQUIRES DATABASE MOCK**

9. **`getEpisodeFromShowCandidates`** ✅ **TESTABLE** (if helper functions work)
   - Needs: `shows` (Show[]), `progressionMap`, `duration`
   - Depends on: `doesNextEpisodeFitDuration()` ✅, `incrementShowProgression()` ✅
   - Pure logic: show shuffling and episode selection
   - **VERDICT**: Can be tested with test Show data

10. **`createMediaBlock`** ✅ **TESTABLE**
    - Needs: `buffer?`, `mainBlock?`, `startTime?`, `duration?`
    - Pure construction: Creates MediaBlock object
    - No external dependencies (except MediaBlock constructor)
    - **VERDICT**: Can be tested directly

11. **`createBackfillBuffer`** 🔴 **NOT TESTABLE** (calls createBuffer)
    - Calls: `createBuffer()` - **NOT TESTABLE** (calls repositories)

12. **`constructContinuousStreamBlocks`** 🔴 **NOT TESTABLE** (calls media selection)
    - Calls: `selectThemedMedia()` - **NOT TESTABLE**
    - Calls: `selectRandomMedia()` - **NOT TESTABLE**

---

## Summary: Testable Functions Without Mocking

### ✅ Pure Logic Functions (17 total)

These functions can be tested directly with test data arrays/objects without creating any mocks:

1. **`isHolidayDate`** - Check if date matches holiday date
2. **`isHolidaySeason`** - Check if date falls in holiday season
3. **`getDateString`** - Format unix timestamp to YYYY-MM-DD
4. **`findNextCadenceTime`** - Find next :00/:30 cadence mark
5. **`segmentTags`** - Segment tags by type
6. **`determineBufferStrategy`** - Select buffer strategy by duration
7. **`randomizeShortsMusicCount`** - Randomize shorts/music count
8. **`splitCountBetweenHalves`** - Split count randomly between two halves
9. **`selectShortsAndMusic`** - Select shorts/music from arrays by duration
10. **`isBufferMediaPoolValid`** - Validate media pool validity
11. **`doesNextEpisodeFitDuration`** - Check if episode fits duration
12. **`incrementShowProgression`** - Increment episode progression
13. **`getEpisodeFromShowCandidates`** - Select episode from shows
14. **`createMediaBlock`** - Create MediaBlock object
15. **`selectCommercials`** - Select commercials by duration (with test data)
16. **`shuffle`** (in spectrum.ts) - Fisher-Yates shuffle algorithm
17. **`shuffleAndHalve`** (in spectrum.ts) - Shuffle and halve array

### 🟡 Partially Testable Functions (with limitations)

These require test data arrays but have no external dependencies:

- **`constructBufferHalf`** - If given pre-populated arrays, the logic is testable
- **`selectBufferMedia`** - If given pre-populated arrays

### 🔴 Functions Requiring Mocks/Database

These functions require mocking database repositories or external services (76+ functions):

- All repository calls: `movieRepository.*`, `showRepository.*`, `tagRepository.*`, `commercialRepository.*`, `episodeProgressionRepository.*`, `recentlyUsedMediaRepository.*`, `facetRepository.*`, `shortRepository.*`, `musicRepository.*`, `promoRepository.*`
- All manager calls: `playerManager.*`, `streamManager.*`, `holidayIntentCacheManager.*`
- Integration functions that call the above

---

## Testing Strategy Recommendations

### Tier 1: Immediately Testable (No Setup Required)

Test these functions with simple test data:

- Pure utility functions (date, time, tag operations)
- Array manipulation functions (shuffle, split, select)
- Configuration/strategy determination functions

### Tier 2: Testable with Test Data (Minimal Setup)

Test these with pre-built test data arrays:

- `selectShortsAndMusic` - with array of Music/Short objects
- `selectCommercials` - with array of Commercial objects
- `doesNextEpisodeFitDuration` - with Show objects
- `getEpisodeFromShowCandidates` - with Show objects
- `createMediaBlock` - with Movie/Episode objects

### Tier 3: Requires Database/Mocking

These functions require either:

- A test database with sample data, OR
- Comprehensive mocks of all repository functions
- Examples: `createStream`, `buildContinuousStream`, `selectThemedMedia`

---

## Files Involved

### Pure Function Files

- `src/electron/services/streamConstruction/selectionHelpers.ts`
- `src/electron/utils/common.ts`
- `src/electron/services/bufferConstructor.ts` (functions 6-9)
- `factories/mediaBlock.factory.ts`

### Complex Files (Mostly Require Mocks)

- `src/electron/services/streamService.ts`
- `src/electron/services/streamConstruction/continuousStreamBuilder.ts`
- `src/electron/services/bufferConstructor.ts` (main functions)
- `src/electron/services/streamConstruction/mediaSelector.ts`
- `src/electron/prisms/spectrum.ts`
- `src/electron/prisms/facets.ts`
