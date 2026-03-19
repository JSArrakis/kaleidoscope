# Kaleidoscope — Project TODOs

High-level feature work that requires design discussion, significant implementation effort, or cross-cutting architectural decisions. These items are tracked here so progress context isn't lost between sessions.

---

## TODO #1 — Design Mosaics

**Status:** 🔲 Not started — requires design discussion

Mosaics are Kaleidoscope's "+1" taxonomy: the musical genre classification system for music videos and audio content. The concept was defined early in development but needs to be fully redesigned now that the rest of the taxonomy system, Prism system, and stream construction pipeline have matured significantly since the original conception.

This TODO will only be marked complete when explicitly signed off after a full design discussion.

**Scope of discussion needed:**

- What role do Musical Genres play in buffer construction vs. anchor selection?
- How do Mosaics relate to (or bridge between) the existing 6 visual taxonomies?
- How does the Spectrum buffer system use Musical Genre tags when selecting music videos?
- What does a "mosaic" actually represent — a single musical genre tag, a relationship between genres, or something else?
- Where does music video selection fit in the Prism hierarchy?

**Relevant files:**

- `docs/mosaic/` — existing concept docs (pre-redesign)
- `docs/taxonomies/musicalGenres/` — currently empty
- `src/electron/repositories/musicRepository.ts`
- `src/electron/prisms/spectrum.ts` — music video selection in buffer construction

---

## TODO #2 — Player Logging Helper (Test/Verification Mode)

**Status:** 🔲 Not started

Create a test-mode player backend that writes to a log file instead of pushing to the actual player. Should only activate when a specific setting/flag is enabled (e.g. `KALEIDOSCOPE_LOG_PLAYER=true` or a settings toggle).

**Purpose:** Allows end-to-end verification of stream construction output — block timings, buffer content, anchor selection, progression — without requiring a live player or actual media files.

**Requirements:**

- Must be toggleable via a setting, not hardcoded
- Should log each `MediaBlock` in a structured, human-readable format:
  - `startTime` (ISO and Unix)
  - `anchorMedia` title, duration, durationLimit, type, tags
  - `buffer[]` — each item's title, type, duration
  - Total block duration
- Should live in `playerManager.ts` as an additional dispatch target (alongside the existing `electron` stub)
- Log file path should be configurable or default to a known location in the project

---

## TODO #3 — FFmpeg / Plex Integration

**Status:** 🔲 Not started — requires architectural scoping

Build the interface and helper layer required to transcode and serve the stream through FFmpeg and connect to Plex as a media server backend.

**Scope:**

- Define the FFmpeg command structure for concatenating `MediaBlock` sequences
- Handle transitions between blocks (gap-free playback)
- Plex channel/DVR integration — how does Kaleidoscope advertise itself as a source?
- Handle live stream vs. pre-generated playlist approaches
- Error handling for missing files, codec mismatches, duration drift

**Relevant existing stub:** `playerManager.ts` already has `ffmpeg-plex` as a planned player type — this TODO is what fleshes that out.

---

## TODO #4 — Facet Learning System (Upvote / Downvote)

**Status:** 🔲 Not started

Implement the upvote/downvote feedback system for facet relationships, allowing the stream to personalize transition probabilities over time based on viewer response.

**How it works (design intent):**

- Positive feedback (upvote) on a transition → decrease the distance between the two facets (make that transition more likely in future selections)
- Negative feedback (downvote) on a transition → increase the distance (make it less likely)
- No feedback → distances remain unchanged
- Changes are persisted to the `facets` / `facet_relationships` tables in the DB

**Requirements:**

- UI controls to upvote/downvote the current On Deck → Upcoming transition
- A service function (likely in `streamManager.ts` or a new `facetFeedbackService.ts`) that:
  - Identifies the facet relationship between the current and next anchor media
  - Applies a delta to the `distance` field of the matching `facet_relationship` row
  - Clamps distance to [0.0, 1.0]
- Decide on delta magnitude (fixed step vs. weighted accumulation)
- Consider: should feedback invalidate the holiday intent cache or affect the Spectrum gates? Probably not — limit scope to facet relationships only.

**Relevant files:**

- `src/electron/prisms/facets.ts` — relationship selection
- `src/electron/repositories/facetRepository.ts` — DB access
- `docs/prisms/facets/index.md` — design spec for the learning system
