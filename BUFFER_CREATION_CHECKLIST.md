# Buffer Creation Process Checklist

## Overview

The goal of `createBuffer()` is to fill a specified duration exactly using a combination of commercials, shorts, and music videos. The buffer is split into two halves: Half A (themed to preceding show/movie) and Half B (themed to next show/movie).

---

## Phase 1: Input Processing & Setup

- [ ] Extract Half A tags (from preceding show/movie)
- [ ] Extract Half B tags (from next show/movie)
- [ ] Extract active holiday tags (for current date/season)
- [ ] Calculate Half A duration (if both halves have tags)
- [ ] Calculate Half B duration (remaining duration after Half A)
- [ ] Account for promo duration (subtract 15 seconds from total available duration)
- [ ] Handle edge cases:
  - [ ] No Half A tags (entire buffer is Half B themed)
  - [ ] No Half B tags (entire buffer is Half A themed)
  - [ ] No tags on either half (promo only or default media only)

---

## Phase 2: Media Selection - Primary Algorithm

For each half (A and B):

- [ ] Call `selectBufferMedia()` with appropriate tags and duration
- [ ] Select commercials, shorts, and music videos matching the tag signature
- [ ] Apply hierarchical spectrum selection (if implemented):
  - [ ] Phase 1: Perfect matches (all relevant tags)
  - [ ] Phase 2: Good matches (age + holiday + specialty + genre)
  - [ ] Phase 3: Decent matches (age + genre/aesthetic combinations)
  - [ ] Phase 4: Fallback matches (age + any single tag)
  - [ ] Phase 5: Emergency matches (age + untagged + reusage)

---

## Phase 3: Reusage Avoidance & Tracking

- [ ] Query `recentlyUsedMediaRepository` for previously used media
- [ ] Filter out any media used within the minimum reusage timespan
- [ ] Calculate reusage window:
  - [ ] Determine current time (unix timestamp)
  - [ ] Identify all known future show/movie timepoints for the day
  - [ ] Calculate duration from first selection to next applicable timepoint
  - [ ] If duration >= minimum threshold, mark media as reusable
- [ ] Track all selected media in `recentlyUsedMediaRepository`:
  - [ ] Record mediaItemId
  - [ ] Record mediaType (Commercial, Short, Music)
  - [ ] Record lastUsedDate
  - [ ] Update usageCount
  - [ ] Calculate and set expirationDate based on reusage window
  - [ ] **NEW:** Record the specific timepoint/timeslot when media is used in this buffer
  - [ ] **NEW:** On next buffer creation, check if any previously_used_media records have expired (current timepoint > expirationDate) and delete them to free up for reuse
  - [ ] **NEW:** Ensure reusage windows are correctly calculated: commercials (2 hours from use), shorts/music videos (3 hours from use)

---

## Phase 4: Content Volume Validation

After selecting media from tags:

- [ ] Calculate total available tagged media:
  - [ ] Sum all commercial durations matching tag signature
  - [ ] Sum all short durations matching tag signature
  - [ ] Sum all music durations matching tag signature
  - [ ] Total = commercials + shorts + music
- [ ] Check if available tagged content < 2 hours (7200 seconds):
  - [ ] If YES: Use only 50% of selected tagged media
  - [ ] If NO: Use 100% of selected tagged media
- [ ] For remaining duration, fill with "default" media:
  - [ ] Default commercials (no specific tag match required)
  - [ ] Default shorts (no specific tag match required)
  - [ ] Default music (no specific tag match required)
- [ ] Purpose of default fill:
  - [ ] Spread out custom/tagged content
  - [ ] Reduce repeated content throughout the day

---

## Phase 5: Duration Reconciliation & Ratio Application

- [ ] Apply media type ratio rules based on buffer duration:
  - [ ] Ratio Rule Set 1 (Short duration buffers):
    - [ ] TODO: Define duration threshold
    - [ ] TODO: Define commercial:short:music ratio
  - [ ] Ratio Rule Set 2 (Medium duration buffers):
    - [ ] TODO: Define duration threshold
    - [ ] TODO: Define commercial:short:music ratio
  - [ ] Ratio Rule Set 3 (Long duration buffers):
    - [ ] TODO: Define duration threshold
    - [ ] TODO: Define commercial:short:music ratio
- [ ] Calculate required durations per media type based on ratios:
  - [ ] Required commercial duration
  - [ ] Required short duration
  - [ ] Required music duration
- [ ] Attempt to match selected media to required durations:
  - [ ] Select commercials closest to required duration
  - [ ] Select shorts closest to required duration
  - [ ] Select music closest to required duration
- [ ] If perfect match cannot be achieved:
  - [ ] Get as close as possible to target duration
  - [ ] Calculate remaining duration needed
  - [ ] Remove one commercial from selection
  - [ ] Fill remaining space with default commercials that exactly fit:
    - [ ] Query default commercials by exact duration
    - [ ] Or use combination of default commercials to fill remaining space exactly

---

## Phase 6: Final Buffer Assembly

- [ ] Assemble buffer in correct order:
  - [ ] Half A media
  - [ ] Promo (if available)
  - [ ] Half B media
- [ ] Verify total duration matches target:
  - [ ] Sum all selected media durations
  - [ ] Add promo duration (if present)
  - [ ] Should equal: duration - promoOffset
- [ ] Calculate remaining duration (for buffer chaining):
  - [ ] Actual total - target duration
  - [ ] Pass to next buffer creation if applicable

---

## Phase 7: Usage Recording & Logging

- [ ] Record all selected media as "recently used":
  - [ ] For each commercial, short, music in buffer
  - [ ] Call `recentlyUsedMediaRepository.recordUsage()`
  - [ ] Set appropriate expiration dates based on reusage window
- [ ] Log buffer creation summary:
  - [ ] Number of commercials selected
  - [ ] Number of shorts selected
  - [ ] Number of music videos selected
  - [ ] Total duration filled
  - [ ] Remaining duration (if any)
- [ ] Log any warnings:
  - [ ] Content volume too low (triggered 50% reduction)
  - [ ] Reconciliation required (removed commercial for default fill)
  - [ ] Ratio enforcement applied
- [ ] **NEW:** Run isBufferMediaPoolValid tests:
  - [ ] Execute comprehensive test suite: `npm test -- test/electron/prisms/spectrum/isBufferMediaPoolValid.test.ts`
  - [ ] Verify all 40+ test cases pass
  - [ ] Confirm buffer media pool validation logic works correctly

---

## Edge Cases & Error Handling

- [ ] Handle no media available for tags:
  - [ ] Fall back to default media
  - [ ] Log warning
- [ ] Handle media duration exactly matches remaining duration:
  - [ ] No reconciliation needed
  - [ ] Return cleanly
- [ ] Handle zero remaining duration:
  - [ ] Return empty buffer
  - [ ] Log info
- [ ] Handle promo selection failure:
  - [ ] Continue with full duration for media
  - [ ] Log why promo was unavailable
- [ ] Handle reusage repository unavailable:
  - [ ] Proceed without reusage tracking
  - [ ] Log warning

---

## Related TODOs to Resolve

- [ ] Define ratio rules for different buffer durations (Phase 5)
- [ ] Define 2-hour threshold logic and any exceptions (Phase 4)
- [ ] Determine minimum reusage window calculation (Phase 3)
- [ ] Clarify "default media" selection criteria (Phase 4)
- [ ] Implement media duration sum utility (`core.sumMediaDuration()`)
- [ ] Determine exact matching algorithm for duration reconciliation (Phase 5)
- [ ] Handle `recordBatchUsage()` implementation in recentlyUsedMediaRepository (Phase 7)

---

## References

- `createBuffer()` - Main entry point
- `constructBufferHalf()` - Processes each half
- `selectBufferMedia()` - Spectrum selection algorithm
- `getHolidayBufferMedia()` - Holiday-specific media selection
- `recentlyUsedMediaRepository` - Tracks media usage and reusage windows
- `commercialRepository.findHolidayCommercials()`
- `shortRepository.findHolidayShorts()`
- `musicRepository.findHolidayMusic()`
