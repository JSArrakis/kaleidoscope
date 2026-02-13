# ContinuousStreamBuilder Testing Checklist

Complete dependency map and setup requirements for testing `continuousStreamBuilder.ts`. Organized by category for predictable tests without random spies.

---

## 1. EXTERNAL DEPENDENCIES (Mocks Required)

### 1.1 Date/Time Functions (date-fns)

These are **deterministic** but need fixed timepoints for predictability:

- [ ] Mock `endOfDay()` - returns predictable end-of-day timestamps
- [ ] Mock `getDateString()` - returns consistent ISO date strings (YYYY-MM-DD)
- [ ] **Note:** date-fns utilities like `getUnixTime`, `getMinutes`, etc. are pure functions - consider NOT mocking unless you need specific edge cases

---

## 2. REPOSITORY LAYER (Mock/Stub)

### 2.1 TagRepository

- [ ] Mock `tagRepository.findActiveHolidaysByDate()`
  - Test cases: no holidays, single holiday, multiple holidays
  - Return controlled `Tag[]` with known properties

### 2.2 MovieRepository

- [ ] Mock `movieRepository.findRandomMovieUnderDuration()`
  - **CRITICAL:** This uses randomness internally - need to control output
  - Return predictable test movies with known durations/tags
- [ ] Mock `movieRepository.findByTags()`
  - Return test movies tagged with specific tagIds
- [ ] Mock `movieRepository.findByTagsAndAgeGroupsUnderDuration()`
  - Return filtered test movies

### 2.3 ShowRepository

- [ ] Mock `showRepository.findAllShowsUnderDuration()`
  - Return test shows with episodes
- [ ] Mock `showRepository.findByEpisodeTags()`
  - Return shows with episodes tagged with holiday tagIds

### 2.4 EpisodeProgressionRepository

- [ ] Mock `episodeProgressionRepository.findByStreamType()`
  - Return progression map (showItemId → episodeNumber)
  - Use predictable test data with known shows

### 2.5 RecentlyUsedMediaRepository

- [ ] Mock `recentlyUsedMediaRepository.deleteExpired()`
  - Return controlled count of deleted records
- [ ] Mock `recentlyUsedMediaRepository.findExpired()` (if used internally)

### 2.6 CommercialRepository & PromoRepository

- [ ] Mock `commercialRepository.findRandomCommercial...` (if called)
- [ ] Mock `promoRepository.findRandomPromo...` (if called)

---

## 3. SERVICE LAYER (Mock/Stub)

### 3.1 PlayerManager

- [ ] Mock `playerManager.addMediaBlockToPlayer(mediaBlock)`
  - Should accept MediaBlock and store it (no-op for tests)
- [ ] Mock `playerManager.play({ timeDelta })`
  - Should accept options object and record call

### 3.2 StreamManager

- [ ] Mock `streamManager.addItemToOnDeck(blocks)`
  - Should accept MediaBlock[] and store in a test queue

### 3.3 BufferConstructor

- [ ] Mock `createBuffer()`
  - **CRITICAL:** This contains `Math.random()` calls for randomization
  - Returns predictable buffer result: `{ buffer: [], errorMessage: "" }`
  - Control buffer duration output

---

## 4. UTILITY FUNCTIONS (Mock if Determinism Needed)

### 4.1 Common Utils

- [ ] Mock `findNextCadenceTime()` - or use real if test uses controlled timestamps
  - Real implementation is deterministic given a fixed timestamp
  - **Recommendation:** Use real, just pass controlled `startTimepoint` values
- [ ] Mock `segmentTags()` - or use real (it's deterministic)
  - Filters tags by type - pure function
  - **Recommendation:** Use real or mock for specific test scenarios

### 4.2 Selection Helpers (selectionHelpers.ts)

- [ ] Mock `getDateString()` - use real or mock for consistency
- [ ] Mock `isHolidayDate()` - use real (deterministic) with test dates
- [ ] Mock `isHolidaySeason()` - use real (deterministic) with test dates
- [ ] Mock `getProgressionsByStreamType()` - returns Map from repositor
  - Already covered by repository mock above
- [ ] Mock `doesNextEpisodeFitDuration()` - use real (deterministic)
- [ ] Mock `incrementShowProgression()` - use real (deterministic)
- [ ] Mock `cleanupExpiredRecentlyUsed()` - already mocked via repository
- [ ] Mock `getEpisodeFromShowCandidates()`
  - **CRITICAL:** Contains `Math.floor(Math.random() * ...)` for shuffling
  - Stub to return predictable episode from array

### 4.3 Media Selector (mediaSelector.ts)

- [ ] Mock `selectRandomMedia()`
  - **CRITICAL RANDOMNESS:** Uses `Math.random() < 0.5` for movie/show choice
  - Use `Math.random()` spy to control coin flip results
  - Stub to return predictable Movie or Episode
- [ ] Mock `selectThemedMedia()`
  - **CRITICAL RANDOMNESS:** Multiple `Math.random()` calls:
    - Coin flip between specialty/facet (line ~270)
    - Random selection from available pools (line ~200+)
  - Stub entire function or spy on `Math.random()`
- [ ] Mock `selectHolidayMediaForTag()` - internal to selectThemedMedia
- [ ] Mock `selectSpecialtyAdjacentMedia()` - currently returns null (stubbed)
- [ ] Mock `selectFacetAdjacentMedia()` - from prisms/facets.js

### 4.4 Prism Functions

- [ ] Mock `selectFacetAdjacentMedia()` (prisms/facets.js)
- [ ] Mock `selectBufferMedia()` (prisms/spectrum.js) - if used in buffer creation

---

## 5. FACTORIES

### 5.1 MediaBlock Factory

- [ ] Mock `createMediaBlock()`
  - Should create MediaBlock instances with controlled duration
  - **Note:** The real factory is deterministic - consider using it
  - Mock only if duration calculation needs to be controlled

---

## 6. TYPE DEFINITIONS & TEST DATA

### 6.1 Type Interfaces to Create Test Fixtures

- [ ] `StreamConstructionOptions` interface
  - Required fields: `Cadence: boolean`, `Themed: boolean`, `StreamType: StreamType`
- [ ] `StreamInitializationData` interface
  - Fields: `activeHolidayTags`, `progressionMap`, `startingTimepoint`, `iterationDuration`, `endOfTimeWindow`, `selectedFirstMedia`, `nextScheduledBlock`
- [ ] `MediaBlock` class (real or stub)
- [ ] `Movie` type with: `mediaItemId`, `duration`, `tags`, `durationLimit`
- [ ] `Episode` type with: `mediaItemId`, `duration`, `tags`, `durationLimit`, `showItemId`
- [ ] `Show` type with: `mediaItemId`, `episodes[]`
- [ ] `Tag` type with: `tagId`, `name`, `type`, `holidayDates[]`, `seasonStartDate`, `seasonEndDate`
- [ ] `SegmentedTags` type with segmented tag arrays
- [ ] `Promo`, `Commercial`, `Short`, `Bumper`, `Music` types (for buffer items)

---

## 7. RANDOMNESS HOTSPOTS (Use Spies/Stubs)

These are **the only places** where you should need to spy on randomness:

### 7.1 Math.random() Locations

1. **bufferConstructor.ts:33** - `Math.floor(Math.random() * 3)` - randomizeShortsMusicCount()
2. **bufferConstructor.ts:41** - `Math.floor(Math.random() * (totalCount + 1))` - splitCountBetweenHalves()
3. **mediaSelector.ts:25** - `Math.random() < 0.5` - selectRandomMedia() movie/show choice
4. **mediaSelector.ts:36** - `Math.floor(Math.random() * moviesWithTag.length)` - selectRandomMedia() movie selection
5. **mediaSelector.ts:200** - `Math.random() < availableMovies.length / totalAvailable` - selectThemedMedia() movie pool choice
6. **mediaSelector.ts:210+** - Random selection from pools
7. **mediaSelector.ts:260** - `Math.random() < 0.5` - specialty vs facet coin flip
8. **selectionHelpers.ts:157+** - `Math.floor(Math.random() * (i + 1))` - Fisher-Yates shuffle in getEpisodeFromShowCandidates()

**Strategy:**

- Use `jest.spyOn(Math, 'random')` and mock return values for these specific locations
- OR stub the entire higher-level function (selectRandomMedia, selectThemedMedia, getEpisodeFromShowCandidates)

---

## 8. DATABASE & TIME SETUP

### 8.1 Database Setup

- [ ] Mock SQLite database connection
  - Or use in-memory test database (better-sqlite3 supports `:memory:`)
  - Or use testDatabaseSetup.ts if it exists in your test/ folder

### 8.2 Timestamp Constants for Tests

Define these constants for consistent test timepoints:

```typescript
// Use fixed Unix timestamps (seconds)
const TEST_TIMESTAMP_1_JAN_2024_NOON = 1704110400; // 2024-01-01 12:00:00 UTC
const TEST_TIMESTAMP_XMAS_2024 = 1703592000; // 2024-12-25 12:00:00 UTC
const TEST_TIMESTAMP_EDGE_CASE_BEFORE_30 = 1704110160; // :59 mark
const TEST_TIMESTAMP_AT_CADENCE_POINT = 1704110400; // Exactly 12:00:00
```

---

## 9. CONTINUOUS STREAM BUILDER SPECIFIC SETUPS

### 9.1 Function-Level Test Fixtures

#### buildContinuousStream()

- [ ] Setup: StreamConstructionOptions with Cadence=true/false, Themed=true/false
- [ ] Setup: startTimepoint (unix seconds)
- [ ] Setup: Mock all dependencies per sections 2-7
- [ ] Verify: Returns [MediaBlock[], errorMessage]
- [ ] Verify: No uncadenced error if Cadence=false

#### initializeContinuousStream()

- [ ] Setup: Test timepoint
- [ ] Verify: Returns StreamInitializationData with all fields populated
- [ ] Verify: activeHolidayTags from repository
- [ ] Verify: endOfTimeWindow calculated correctly
- [ ] Verify: progressionMap from repository

#### buildCadencedContinuousStream()

- [ ] Setup: StreamConstructionOptions (Cadence must be true)
- [ ] Setup: InitData with controlled selectedFirstMedia
- [ ] Verify: Calls either buildCadencedWithInitialBuffer OR buildCadencedWithoutInitialBuffer
- [ ] Test case: nextCadenceTime > startingTimepoint (needs buffer)
- [ ] Test case: nextCadenceTime === startingTimepoint (no buffer)

#### buildCadencedWithInitialBuffer()

- [ ] Setup: InitData with selectedFirstMedia
- [ ] Verify: initialBufferDuration calculated correctly
- [ ] Verify: createBuffer() called with correct params
- [ ] Verify: playerManager.addMediaBlockToPlayer() called
- [ ] Verify: playerManager.play() called
- [ ] Verify: streamManager.addItemToOnDeck() called
- [ ] Verify: selectSecondAnchorAndBuildStream() called with correct args

#### buildCadencedWithoutInitialBuffer()

- [ ] Setup: InitData with selectedFirstMedia
- [ ] Verify: firstAnchorMediaBlock created at startingTimepoint
- [ ] Verify: playerManager functions called immediately
- [ ] Verify: selectSecondAnchorAndBuildStream() called

#### selectSecondAnchorAndBuildStream()

- [ ] Setup: firstAnchorMediaBlock with known duration
- [ ] Setup: secondAnchorMedia selection (themed or random)
- [ ] Verify: backfillBuffer created between anchors
- [ ] Verify: backfillBuffer injected into firstAnchor.buffer
- [ ] Verify: constructContinuousStreamBlocks() called with second anchor

#### createBackfillBuffer()

- [ ] Setup: mediaBlockA with mainBlock having duration < durationLimit
- [ ] Verify: backfillDuration calculated: durationLimit - duration
- [ ] Verify: createBuffer() called with backfillDuration
- [ ] Test case: backfillDuration <= 0 (return empty array)

#### constructContinuousStreamBlocks()

- [ ] Setup: timepoint, endOfTimeWindow, firstMediaTags, etc.
- [ ] Verify: Loop continues while timepoint < endOfTimeWindow
- [ ] Verify: Media selection respects Themed flag
- [ ] Verify: progressionMap is copied (not mutated)
- [ ] Verify: Each block added with incremented timepoint

---

## 10. INTEGRATION TEST SCENARIOS

### 10.1 Happy Path

- [ ] Full stream construction with Cadence=true, Themed=false
- [ ] Full stream construction with Cadence=true, Themed=true
- [ ] Stream with no holidays vs stream with active holidays
- [ ] Stream on holiday date vs holiday season vs non-holiday

### 10.2 Edge Cases

- [ ] startTimepoint exactly at cadence point (:00 or :30)
- [ ] startTimepoint 1 second before cadence point
- [ ] endOfDay very soon (small iteration duration)
- [ ] endOfDay far away (large iteration duration)
- [ ] No media available in database (error case)
- [ ] selectedFirstMedia is null (defensive check)

### 10.3 Media Selection Scenarios

- [ ] Random media selection with duration >= 5400 seconds (movie preference)
- [ ] Random media selection with duration < 5400 seconds (show preference)
- [ ] Themed selection on holiday date (saturate with holiday content)
- [ ] Themed selection during holiday season (budget-aware)
- [ ] Themed selection outside holidays (specialty/facet selection)

### 10.4 Buffer Scenarios

- [ ] Initial buffer creation (before first cadence point)
- [ ] Backfill buffer between two anchors
- [ ] Backfill with 0 or negative duration (should be empty)
- [ ] Multiple buffers in stream

---

## 11. CRITICAL ASSERTIONS FOR EACH TEST

### 11.1 Output Validation

- [ ] Returned MediaBlock[] is sorted by startTime
- [ ] Each MediaBlock.startTime is unique and progressive
- [ ] Each MediaBlock.duration is > 0
- [ ] All MediaBlock.mainBlock items are Movie or Episode
- [ ] All buffer items are Promo, Music, Short, Commercial, or Bumper

### 11.2 Player Manager Calls

- [ ] addMediaBlockToPlayer() called for first block in stream
- [ ] play() called with timeDelta parameter
- [ ] addItemToOnDeck() called with blocks

### 11.3 Timing Validation

- [ ] First MediaBlock.startTime >= streamConstructionOptions.startTimepoint
- [ ] Last MediaBlock.getEndTime() <= endOfDay
- [ ] No gaps or overlaps between blocks (except in buffer)

---

## 12. SETUP TEMPLATE (Jest)

```typescript
// continuousStreamBuilder.test.ts
import { buildContinuousStream } from "./continuousStreamBuilder";
import * as playerManager from "../playerManager";
import * as streamManager from "../streamManager";
import { tagRepository } from "../../repositories/tagsRepository";
import { movieRepository } from "../../repositories/movieRepository";
import { showRepository } from "../../repositories/showRepository";
// ... etc

describe("ContinuousStreamBuilder", () => {
  // SETUP PHASE
  beforeEach(() => {
    // Mock all repositories
    jest.spyOn(tagRepository, "findActiveHolidaysByDate").mockReturnValue([]);
    jest
      .spyOn(movieRepository, "findRandomMovieUnderDuration")
      .mockReturnValue(null);
    // ... mock all others

    // Mock services
    jest
      .spyOn(playerManager, "addMediaBlockToPlayer")
      .mockResolvedValue(undefined);
    jest.spyOn(streamManager, "addItemToOnDeck").mockReturnValue(undefined);
    // ... mock all others

    // CONTROL randomness strategically
    jest.spyOn(Math, "random").mockReturnValue(0.5); // Or use mockImplementation
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("buildContinuousStream", () => {
    it("should handle cadenced stream with initial buffer", async () => {
      // GIVEN: Setup test data
      const startTimepoint = TEST_TIMESTAMP_AT_CADENCE_POINT;
      const options: StreamConstructionOptions = {
        Cadence: true,
        Themed: false,
        StreamType: StreamType.Cont,
      };

      // Mock selectedFirstMedia
      const testMovie = createTestMovie();
      // ... setup mocks

      // WHEN
      const [blocks, error] = await buildContinuousStream(
        options,
        startTimepoint,
      );

      // THEN
      expect(error).toBe("");
      expect(blocks.length).toBeGreaterThan(0);
      expect(playerManager.addMediaBlockToPlayer).toHaveBeenCalled();
    });
  });
});
```

---

## SUMMARY: Critical Mocks to Avoid Randomness

**Always Mock These:**

1. Repository query functions (return test data)
2. Player/Stream manager service calls (no-op)
3. High-level selection functions that wrap randomness
   - `selectRandomMedia()` - stub entire function
   - `selectThemedMedia()` - stub entire function
   - `getEpisodeFromShowCandidates()` - stub entire function

**Use Math.random Spies For:**

1. Buffer constructor randomization (if testing buffer logic specifically)
2. Low-level random calculations (if unit testing those functions)

**Safe to Use Real:**

1. `findNextCadenceTime()` - pure function
2. `segmentTags()` - pure function
3. `isHolidayDate()` - pure function
4. `isHolidaySeason()` - pure function
5. `MediaBlock` constructor/duration calculation
6. Date-fns utilities (pure functions)

---

## 13. TEST HELPERS & BUILDERS (Available in test/helpers/)

A reusable test helpers library organized in `test/helpers/` with:

- **factories.ts** - Test data factories for all media types, tags, progressions
- **repositories.ts** - Mock builders for all repository methods
- **services.ts** - Mock builders for PlayerManager, StreamManager, etc.
- **mockConfig.ts** - Advanced mock configuration helpers
- **utils.ts** - Utility functions for validation, assertions, duration conversion
- **timestamps.ts** - Predefined timestamps and time generators
- **index.ts** - Central export (import once, get everything)

### 13.1 Test Data Factories

These create predictable test objects that can be used across multiple tests:

```typescript
// Movie, Episode, Show, Tag creation
createTestMovie(overrides?)          // 90-min test movie
createTestEpisode(overrides?)        // 30-min test episode
createTestShow(overrides?)           // Show with 3 episodes
createTestTag(overrides?)            // Generic tag
createTestHolidayTag(overrides?)     // Holiday-specific tag
createTestProgression(overrides?)    // Episode progression record
```

**Usage Example:**

```typescript
const movie = createTestMovie({
  duration: 7200,
  tags: [createTestTag({ name: "Action" })],
});
```

### 13.2 Individual Mock Builders (Configurable per Test)

Each repository/service method has its own builder that returns a Jest spy:

**Repository Mocks:**

```typescript
mockTagRepositoryFindActiveHolidaysByDate([holiday1, holiday2]);
mockMovieRepositoryFindRandomMovieUnderDuration(testMovie);
mockMovieRepositoryFindByTags([movie1, movie2]);
mockMovieRepositoryFindByTagsAndAgeGroupsUnderDuration([movies]);
mockShowRepositoryFindAllShowsUnderDuration([show1, show2]);
mockShowRepositoryFindByEpisodeTags([shows]);
mockEpisodeProgressionRepositoryFindByStreamType([progressions]);
mockRecentlyUsedMediaRepositoryDeleteExpired(5); // 5 records deleted
```

**Service Mocks:**

```typescript
mockPlayerManagerAddMediaBlockToPlayer();
mockPlayerManagerPlay();
mockStreamManagerAddItemToOnDeck();
mockStreamManagerGetOnDeck([blocks]);
```

**Usage Example (Per-Test Configuration):**

```typescript
test("should use holiday media on holiday date", () => {
  const holidayTag = createTestHolidayTag({
    tagId: "christmas",
    holidayDates: ["2024-12-25"],
  });

  mockTagRepositoryFindActiveHolidaysByDate([holidayTag]);
  mockMovieRepositoryFindByTags([
    createTestMovie({ title: "Christmas Movie 1" }),
    createTestMovie({ title: "Christmas Movie 2" }),
  ]);

  // ... test code
});
```

### 13.3 Composite Setup Helpers

Set up multiple mocks at once:

```typescript
// All repos with empty defaults (can override individually)
setupAllRepositoryMocks();

// All services with empty defaults
setupAllServiceMocks();

// Everything at once
setupAllMocks(); // Returns { repositories: {...}, services: {...} }
```

**Usage Example (Integration Tests):**

```typescript
beforeEach(() => {
  const { repositories, services } = setupAllMocks();

  // Configure each as needed
  repositories.movieRepository.findRandomMovieUnderDuration.mockReturnValue(
    createTestMovie(),
  );

  repositories.showRepository.findAllShowsUnderDuration.mockReturnValue([
    createTestShow(),
  ]);
});
```

### 13.4 Dynamic Mock Configuration

Use `MockConfigBuilder` for complex mock behaviors:

**Configuration by Function:**

```typescript
const spy = mockMovieRepositoryFindByTags();

MockConfigBuilder.configureWithFunction(spy, (tagIds) => {
  if (tagIds.includes("horror")) {
    return [createTestMovie({ title: "Scary Movie" })];
  } else if (tagIds.includes("comedy")) {
    return [createTestMovie({ title: "Funny Movie" })];
  }
  return [];
});

// Now findByTags() returns different movies based on tagIds passed in
movieRepository.findByTags(["horror"]); // → [Scary Movie]
movieRepository.findByTags(["comedy"]); // → [Funny Movie]
```

**Configuration by Map:**

```typescript
const tagToMoviesMap = new Map([
  [JSON.stringify(["horror"]), [createTestMovie({ title: "Scary" })]],
  [JSON.stringify(["comedy"]), [createTestMovie({ title: "Funny" })]],
]);

const spy = mockMovieRepositoryFindByTags();
MockConfigBuilder.configureWithMap(spy, tagToMoviesMap);
```

**Configuration with Sequence (Multiple Calls):**

```typescript
const spy = mockShowRepositoryFindAllShowsUnderDuration();

MockConfigBuilder.configureWithSequence(spy, [
  [createTestShow({ title: "Show 1" })],
  [createTestShow({ title: "Show 2" })],
  [createTestShow({ title: "Show 3" })],
]);

// First call returns [Show 1], second returns [Show 2], etc.
showRepository.findAllShowsUnderDuration(1800); // → [Show 1]
showRepository.findAllShowsUnderDuration(1800); // → [Show 2]
```

### 13.5 StreamConstructionOptions Builders

Quick builders for common test scenarios:

```typescript
createStreamConstructionOptions(overrides?)     // Base options
createCadencedThemedOptions()                   // Cadence=true, Themed=true
createCadencedRandomOptions()                   // Cadence=true, Themed=false
```

### 13.6 Time Constants & Helpers

Predefined timestamps for consistent testing:

```typescript
TEST_TIMESTAMPS = {
  JAN_1_2024_NOON: 1704110400,
  JAN_1_2024_BEFORE_30: 1704110160,
  JAN_1_2024_AT_30: 1704112200,
  CHRISTMAS_2024_NOON: 1703592000,

  // Generators for custom times
  atHour(hour): number
  atMinute(hour, minute): number
}
```

**Usage:**

```typescript
const startTime = TEST_TIMESTAMPS.JAN_1_2024_NOON;
const customTime = TEST_TIMESTAMPS.atHour(14); // 2 PM on Jan 1, 2024
```

### 13.7 Utility Functions

Helper functions to reduce test boilerplate:

```typescript
// Duration conversions
minutesToSeconds(45); // → 2700
hoursToSeconds(1.5); // → 5400

// Create progression maps from arrays
createProgressionMap([prog1, prog2]); // → Map<showId, episodeNum>

// Create segmented tags from mixed array
createSegmentedTags([genre, aesthetic, era]); // → SegmentedTags

// Validation helpers for integration tests
verifyMediaBlocksAreOrdered(blocks); // → boolean
getTotalDuration(blocks); // → number in seconds
```

**Usage Example:**

```typescript
const blocks = await buildContinuousStream(options, startTime);

expect(verifyMediaBlocksAreOrdered(blocks)).toBe(true);
expect(getTotalDuration(blocks)).toBeCloseTo(hoursToSeconds(12), 0);
```

---

## 14. COMPLETE TEST EXAMPLE USING HELPERS

```typescript
// continuousStreamBuilder.test.ts
import {
  createTestMovie,
  createTestShow,
  createTestHolidayTag,
  createStreamConstructionOptions,
  mockTagRepositoryFindActiveHolidaysByDate,
  mockMovieRepositoryFindRandomMovieUnderDuration,
  mockShowRepositoryFindAllShowsUnderDuration,
  mockPlayerManagerAddMediaBlockToPlayer,
  mockStreamManagerAddItemToOnDeck,
  setupAllRepositoryMocks,
  TEST_TIMESTAMPS,
  verifyMediaBlocksAreOrdered,
} from "./continuousStreamBuilder.test-helpers";

describe("buildContinuousStream", () => {
  beforeEach(() => {
    // Default empty mocks for all repos/services
    setupAllRepositoryMocks();
    mockPlayerManagerAddMediaBlockToPlayer();
    mockStreamManagerAddItemToOnDeck();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("with cadence and random selection", () => {
    it("should construct stream with movie and episodes", async () => {
      // GIVEN
      const startTime = TEST_TIMESTAMPS.JAN_1_2024_NOON;
      const options = createStreamConstructionOptions({
        Cadence: true,
        Themed: false,
      });

      const testMovie = createTestMovie({ duration: 7200 });
      const testShow = createTestShow();

      // Configure mocks JUST for this test
      mockMovieRepositoryFindRandomMovieUnderDuration(testMovie);
      mockShowRepositoryFindAllShowsUnderDuration([testShow]);

      // WHEN
      const [blocks, error] = await buildContinuousStream(options, startTime);

      // THEN
      expect(error).toBe("");
      expect(blocks.length).toBeGreaterThan(0);
      expect(verifyMediaBlocksAreOrdered(blocks)).toBe(true);
    });
  });

  describe("on holiday dates", () => {
    it("should saturate with holiday content", async () => {
      // GIVEN
      const startTime = TEST_TIMESTAMPS.CHRISTMAS_2024_NOON;
      const christmasTag = createTestHolidayTag({
        tagId: "christmas",
        holidayDates: ["2024-12-25"],
        name: "Christmas",
      });

      const options = createStreamConstructionOptions({
        Themed: true,
      });

      // Configure ONLY the mocks needed for this scenario
      mockTagRepositoryFindActiveHolidaysByDate([christmasTag]);
      mockMovieRepositoryFindByTags([
        createTestMovie({ title: "Holiday Movie 1" }),
        createTestMovie({ title: "Holiday Movie 2" }),
      ]);

      // WHEN
      const [blocks, error] = await buildContinuousStream(options, startTime);

      // THEN
      expect(error).toBe("");
      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});
```

---

## Next Steps

1. ✅ **Created test helpers** - `continuousStreamBuilder.test-helpers.ts`
2. **Create test database setup** - Use in-memory SQLite or testDatabaseSetup.ts
3. **Write unit tests** - One for each function in continuousStreamBuilder.ts
4. **Write integration tests** - Full stream construction scenarios using helpers
5. **Validate timestamps** - Use TEST_TIMESTAMPS constants for consistency
