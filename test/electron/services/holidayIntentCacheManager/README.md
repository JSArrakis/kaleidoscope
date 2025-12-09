# HolidayIntentCacheManager Test Suite

## Overview

Comprehensive test suite for `HolidayIntentCacheManager` service with shared test database setup and isolated test cases for each method.

## Test Database Setup

### Location

- **Setup File**: `test/electron/services/holidayIntentCacheManager/setup.ts`
- **Database Path**: `temp-test.db` (root directory, cleaned up after tests)

### Database Schema

Creates a complete test database with:

- `tags` table (holidays with date/season info)
- `movies` and `shows` tables
- `episodes` table
- `media_tags`, `episode_tags`, `show_tags`, `show_secondary_tags` tables

### Test Data Fixture

Pre-populated with:

- **Christmas Holiday** (Dec 25, season Nov 1 - Dec 31)

  - 5 movies: ~524 minutes total
  - 2 shows with episodes: ~179 minutes total
  - **Total: ~703 minutes**

- **Halloween Holiday** (Oct 31, season Oct 1 - Oct 31)

  - 2 movies: ~186 minutes total

- **Easter Holiday** (Apr 20, season Mar 15 - Apr 30)
  - 1 movie: 93 minutes

## Test Files Structure

Each method has its own test file with multiple test cases covering:

- ✅ Happy path (expected behavior)
- ✅ Edge cases (boundaries, empty states)
- ✅ Negative paths (error handling, invalid input)
- ✅ Integration scenarios (interactions with other methods)

### Test Files

#### 1. **getIntent.test.ts** (5 tests)

Tests lazy-loading cache mechanism and invalidation strategy

Tests:

- Lazy-load and cache on first access
- Return cached intent without recalculation
- Recalculate if marked stale
- Handle multiple different holiday tags independently
- Gracefully handle non-existent holiday tags

#### 2. **calculateIntent.test.ts** (11 tests)

Tests core calculation logic for holiday intent

Tests:

- Create HolidayIntent with correct structure
- Calculate totalAvailableMinutes correctly from DB
- Handle empty holidays (0 content)
- Set currentRotationDay to valid 1-3
- Initialize lastRotationDate to today
- Initialize selectedMinutesToday to 0
- Set lastResetDate to today
- Set calculatedAt to recent timestamp
- Initialize stale to false
- Calculate threeDayDistribution correctly
- Handle holidays independently
- Verify deterministic calculations
- Work with movies-only holidays
- Work with episodes-only holidays
- Produce values suitable for budgeting

#### 3. **calculateThreeDayDistribution.test.ts** (6 tests)

Tests the 3-day rotation distribution algorithm

Tests:

- Distribute evenly when total < 810 minutes
- Distribute remainder starting with day 1
- Cap at 270/day when total > 810
- Handle zero total gracefully
- Handle very small amounts (1-2 min)
- Maintain consistency across multiple accesses

#### 4. **getRotationDay.test.ts** (5 tests)

Tests rotation cycle determination based on date

Tests:

- Return valid rotation day (1, 2, or 3)
- Cycle correctly: day 1 → 2 → 3 → 1
- Be deterministic for same date
- Handle dates across year boundaries
- Calculate based on epoch days

#### 5. **getTodayTargetMinutes.test.ts** (6 tests)

Tests daily budget target retrieval

Tests:

- Return correct target for rotation day
- Reset selectedMinutesToday on new date
- Update rotation day on date change
- Return 0 for holiday with no content
- Maintain consistency for same date
- Return value from threeDayDistribution array

#### 6. **canAddMoreContent.test.ts** (7 tests)

Tests budget checking logic

Tests:

- Return true when selected < target
- Return false when selected >= target
- Return false when selected > target
- Reset budget on date change
- Return false for zero-content holiday
- Track across multiple calls
- Handle different holidays independently

#### 7. **trackSelectedMinutes.test.ts** (9 tests)

Tests tracking of selected content

Tests:

- Accumulate selectedMinutesToday
- Reset counter on date change
- Update lastResetDate when date changes
- Update currentRotationDay on date change
- Work with zero minutes
- Handle negative minutes (edge case)
- Track independently per holiday
- Allow exceeding target (budget check is elsewhere)
- Not throw for non-existent holiday

#### 8. **getRemainingMinutesToday.test.ts** (8 tests)

Tests available budget calculation

Tests:

- Return full target when nothing selected
- Decrease as content selected
- Return 0 when fully exhausted
- Never return negative (clamped to 0)
- Reset on date change
- Return 0 for zero-content holiday
- Track independently per holiday
- Handle fractional remaining correctly

#### 9. **invalidateHoliday.test.ts** (8 tests)

Tests single-holiday invalidation

Tests:

- Mark holiday as stale
- Trigger recalculation on next access
- Increase staleCount in stats
- Not affect other holidays
- Handle non-existent holiday gracefully
- Allow re-invalidating already stale holiday
- Preserve cache entry (not delete)
- Work correctly with clear()

#### 10. **invalidateAll.test.ts** (8 tests)

Tests full-cache invalidation

Tests:

- Mark all holidays as stale
- Trigger recalculation for all on access
- Update staleCount correctly as accessed
- Preserve cache size
- Handle empty cache
- Allow re-invalidating all again
- Work with clear() afterwards
- Recalculate with potentially new data

#### 11. **clear.test.ts** (8 tests)

Tests cache clearing

Tests:

- Remove all cached holidays
- Reset staleCount to 0
- Allow fresh loading after clear
- Work on already-empty cache
- Allow multiple clears
- Truly reset cache (not just reset values)
- Provide isolation for tests
- Immediately reflect in getStats

#### 12. **getStats.test.ts** (12 tests)

Tests cache statistics reporting

Tests:

- Return correct structure (cacheSize, staleCount)
- Return 0 for empty cache
- Match number of unique cached holidays
- Return 0 staleCount when fresh
- Increment staleCount correctly
- Reflect staleCount = cacheSize when all invalidated
- Decrease staleCount as entries recalculated
- Reset to 0 after clear
- Accurate stats in mixed scenarios
- Not count duplicates
- Be callable without errors in all states
- Update immediately

## Running Tests

### Run all HolidayIntentCacheManager tests:

```bash
npm test -- holidayIntentCacheManager
```

### Run specific test file:

```bash
npm test -- getIntent.test.ts
```

### Run with coverage:

```bash
npm test -- holidayIntentCacheManager --coverage
```

## Test Isolation & Cleanup

- **Before each test**: Fresh database created, test data populated, cache cleared
- **After each test**: Database cleaned up, cache cleared
- **Database path**: `temp-test.db` automatically deleted after tests
- **No test data leakage**: Each test starts with clean slate

## Key Testing Patterns

### 1. Database-Backed Tests

Tests that interact with repositories query against the temporary test database with known data.

### 2. State Tracking Tests

Tests verify internal state changes through public API calls and getStats().

### 3. Determinism Tests

Tests verify same inputs produce same outputs (important for rotation calculations).

### 4. Edge Case Coverage

Each test file includes tests for:

- Empty/zero values
- Boundary conditions
- Invalid input gracefully handled
- Integration with related methods

### 5. Clear Comments

Each test includes:

- **GOAL**: What behavior is being verified
- **FACTORS**: Input conditions and state
- **EXPECTED**: Exact expected behavior

## Coverage Goals

Target coverage for holidayIntentCacheManager:

- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100% (all public and private methods)
- **Statement Coverage**: 100%

## Integration Notes

These tests are designed to work alongside streamConstructor tests once implemented. The HolidayIntentCacheManager is the caching layer for holiday content distribution decisions.

Test data is suitable for:

- ✅ HolidayIntentCacheManager tests (current)
- ✅ Future movieRepository/showRepository holiday tag tests
- ✅ Future streamConstructor PATH 1/2/3 tests
