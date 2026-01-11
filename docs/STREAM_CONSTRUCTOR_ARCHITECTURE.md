# Stream Constructor Architecture

## Overview

The `streamConstructor` module builds a continuous 24/7 media stream that fills time from the current moment until end of day with a sequence of movies, TV show episodes, and filler content (bumpers, commercials, promos, music). It implements a **"play immediately while building ahead"** strategy that prioritizes responsive user experience while performing computationally intensive media selection in the background.

## Core Strategy: Immediate Playback + Background Construction

### The Problem Being Solved

Traditional stream construction would build the entire day's queue before playing anything. This causes:

- User experiences delay before content starts
- Large computational upfront cost blocks the main thread
- No responsive feedback

### The Solution

Split construction into two phases:

1. **Immediate Phase**: Create and push the first few blocks to the player right away so something plays immediately
2. **Background Phase**: While those blocks are playing, construct the remaining blocks for the rest of the day

This ensures zero dead air while using the playback time to enable background processing.

## Architectural Components

### 1. Initialization (`createInitializationData`)

Prepares shared data for the entire construction process:

- Extracts and normalizes the incoming timepoint (unix seconds)
- Calculates `endOfTimeWindow` (end of day or next scheduled block)
- Calculates `iterationDuration` (time window rounded to 30-minute multiples)
- Loads active holiday tags for the current date
- Selects the first media item (the "anchor" for media selection)
- Pre-loads episode progression map (shows → current episode number)

### 2. Two Construction Modes

#### Mode A: Cadence = TRUE (scheduled blocks)

Cadence-enabled streams have periodic anchor points (e.g., every 30 minutes at a specific time).

**If time exists before next cadence point:**

```
Timeline: NOW ----[gap]---- CADENCE_POINT ---- rest_of_day
                  (filler)    (anchor media)
```

1. Create **initial filler buffer** to fill the gap (using selectedFirstMedia tags)
2. Push filler to player and start playback (immediate feedback)
3. Immediately push the **anchor media block** to queue (extends playback duration)
4. Create **backfill buffer** between filler and anchor media
5. Select first media for iteration loop
6. Construct remaining blocks until end of day in background

**If no time before next cadence point:**

```
Timeline: NOW = CADENCE_POINT (or close enough)
          (start with anchor media directly)
```

1. Create initial media block with selectedFirstMedia
2. Push to player and start playback immediately
3. Construct remaining blocks in background

#### Mode B: Cadence = FALSE (continuous)

No scheduled anchor points. Similar flow to "no initial buffer" above:

1. Create initial media block with selectedFirstMedia
2. Push to player and start playback
3. Construct remaining blocks in background

### 3. Backfill Buffer System

**Purpose**: Anchor media has two duration properties:

- `duration`: actual content length
- `durationLimit`: intended time slot (e.g., 30 minutes)

A **backfill buffer** (shorts, bumpers, music, commercials) fills the gap between them.

**Example:**

```
Anchor media: 24-minute episode in a 30-minute slot
Backfill needed: 6 minutes
Buffer content: 4-minute bumper + 2-minute commercial
```

Backfill buffers are created:

- Between initial anchor and iteration anchor (in cadence mode)
- Between initial block and first remaining block (in all modes)
- Created asynchronously using `createAndPushBackfillBuffer()`

### 4. Remaining Stream Construction (`constructStream`)

Builds blocks iteratively until `endOfTimeWindow` is reached.

**Loop pattern:**

```
FOR each timepoint < endOfTimeWindow:
  1. Select next media (themed or random)
  2. Create MediaBlock with selected media and start time
  3. Advance timepoint by block duration
```

**Key behaviors:**

- Takes `iterationFirstMediaBlock` as the first block
- Creates a copy of `progressionMap` to avoid mutation
- Respects available duration when selecting media
- Tracks holiday context for media selection

### 5. Media Selection Algorithms

#### Random Selection (`selectRandomMediaForStream`)

- Cleans up expired recently-used media first
- Coin flip: if duration >= 5400 seconds (1.5 hours), randomly choose show/movie
- Otherwise defaults to shows for shorter durations
- Checks show episode progression to select the "next" episode to play

#### Themed Selection (`selectThemedMediaForStream`)

Three-path algorithm:

**PATH 1: Holiday Date** (today is an exact holiday)

- Saturate stream with holiday-tagged content
- Randomly select from movies and episodes tagged with active holidays
- Avoid blacklisted media

**PATH 2: Holiday Season** (today is within a holiday's season span)

- Respect a 3-day content distribution budget via `holidayIntentCacheManager`
- Check if can add more content for each holiday tag
- Track selected minutes to stay within budget
- Fall through to PATH 3 if budget exhausted

**PATH 3: Non-Holiday** (default behavior)

- Coin flip: attempt specialty-adjacent selection or facet-adjacent selection
- Fallback chain: specialty → facet → random

### 6. Episode Progression Tracking

**Why needed**: Shows should play episodes sequentially across a stream.

**How it works:**

- `progressionMap`: Map<showId, currentEpisodeNumber>
- Before selecting from a show, check if the next episode fits in available duration
- After selecting, increment the progression (wraps to episode 1 after last)
- Progression map is copied in `constructStream` to avoid mutation across iterations

## Data Flow

```
createStream(streamType, options, timepoint)
  ↓
createInitializationData(timepoint, options)
  └─→ Returns: selectedFirstMedia, progressionMap, endOfTimeWindow, iterationDuration

constructContinuousStream(options, timepoint)
  ├─→ [IMMEDIATE] Create initial buffer/media block
  ├─→ [IMMEDIATE] Push to playerManager + start playback
  ├─→ [IMMEDIATE] Create backfill buffer + push to player
  │
  └─→ [BACKGROUND] constructStream(...)
      ├─→ Loop: Select media → Create block → Advance timepoint
      └─→ Returns: Array of remaining MediaBlocks for stream manager

Returns: [streamBlocks[], errorMessage]
  - streamBlocks[0..N]: All blocks including initial + remaining
  - Initial blocks already playing
  - Remaining blocks managed by streamManager for upcoming/onDeck processing
```

## Key Design Decisions

### 1. Separation of Immediate vs Queued Blocks

- **Immediate blocks** (initial buffer + anchor) go to `playerManager.addMediaBlockToPlayer()` + `playerManager.play()`
- **Remaining blocks** accumulated in array for stream manager to handle
- This enables asynchronous construction while playback begins

### 2. Progressive Timepoint Advancement

- Timepoint advances as each block is created
- Each block knows its exact `startTime` on the timeline
- Enables precise scheduling of all content

### 3. Progression Map as Construction State

- Temporary state during construction (not persisted immediately)
- Copied to prevent cross-iteration pollution
- Updated as shows are selected to simulate future stream sequence

### 4. Holiday-Aware Content Selection

- Three distinct algorithmic paths based on holiday context
- Budget-aware selection during holiday seasons
- Blacklist support for avoiding overplayed holiday content

### 5. Backfill Buffers as Filler Strategy

- Uses `createBuffer()` to assemble shorts/bumpers/music
- Respects tag relationships between adjacent media
- Bridges duration gaps without explicit scheduling

## Type Definitions Required

```typescript
type StreamType = "Cont" | "Adhoc"; // Continuous or Ad-hoc
type MediaBlock = {
  buffer: (Promo | Music | Short | Commercial | Bumper)[];
  mainBlock?: Movie | Episode;
  startTime: number; // Unix seconds
  duration: number; // Seconds
  getEndTime(): number;
  toDB(): object;
};

type StreamInitializationData = {
  activeHolidayTags: Tag[];
  progressionMap: Map<string, number | undefined>;
  startingTimepoint: number;
  iterationDuration: number;
  endOfTimeWindow: number;
  selectedFirstMedia: Movie | Episode | null;
  nextScheduledBlock: ScheduledBlock | null;
};

type StreamConstructionOptions = {
  Cadence: boolean;
  Themed: boolean;
  StreamType: StreamType;
};

type SegmentedTags = {
  specialtyTags: Tag[];
  ageGroupTags: Tag[];
  // ... other tag categories
};
```

## Error Handling

- Returns `[[], errorMessage]` on initialization failure (no media found)
- Returns `[[], errorMessage]` on any exception during construction
- Logs detailed error messages to console for debugging

## Future Considerations

- Scheduled block integration (currently stubbed as TODO)
- Adhoc stream construction path (not implemented)
- Smart shuffle for holiday content (prevent back-to-back movies)
- Holiday media play count tracking
- Specialty-adjacent media implementation
