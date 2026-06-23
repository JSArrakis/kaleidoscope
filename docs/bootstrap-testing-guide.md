# Bootstrap Pre-Transcode Testing Guide

## Objective

Validate that the first untagged movie (The Matrix) is automatically added to the bootstrap pool and pre-transcoded, then selected immediately when starting a stream.

## Prerequisites

1. **Bootstrap selector enabled**: ✅ Already enabled in `npm run dev` (via `ENABLE_BOOTSTRAP_SELECTOR=1`)
2. **Empty database**: No movies, shows, or tags added yet
3. **Bootstrap log location**: Click the "📋 Log" button on Home screen to open it

## Test Procedure

### Step 1: Add The Matrix (No Tags)

1. Navigate to Movies screen
2. Add "The Matrix" WITHOUT any tags
3. **Expected immediate behavior:**
   - Movie is saved to database
   - Bootstrap trigger fires
   - Movie is added to bootstrap pool (because pool is empty and media is untagged)
   - Normalization is queued for 3 profiles (native, plex, jellyfin)

### Step 2: Wait for Transcoding

1. Monitor the Home screen eligibility status
2. **While transcoding:**
   - Launch button should be DISABLED
   - Status message: "Transcoding 1 item. Please wait for at least one to complete."
3. **After transcoding completes:**
   - Launch button becomes ENABLED
   - Status message: "Ready to start stream (1 pre-transcoded item available)"
4. **Timing:** Depends on movie file size, typically 30s-3min per profile

### Step 3: Start Stream

1. Configure stream options (cadence: on/off, duration: any)
2. Click "Launch" button
3. **Expected immediate behavior:**
   - Stream validation passes (≥1 ready anchor)
   - Bootstrap selector is invoked
   - The Matrix is selected from pool
   - First anchor starts IMMEDIATELY (requiresPreparation=false)
   - Stream begins playing within 1-2 seconds

### Step 4: Review Bootstrap Log

1. Click "📋 Log" button on Home screen
2. Log file opens in default text editor
3. Share the complete log contents for validation

---

## What to Look for in the Log

### Section 1: Media Ingest (Step 1)

```
────────────────────────────── NEW MOVIE INGESTED ──────────────────────────────
[INFO] [MEDIA_INGEST] Movie ingested: "The Matrix" (abc123) | Tags: []
[DEBUG] [TRIGGER_CHECK] Checking coverage trigger for Movie abc123 | Genre/Aesthetic tags: 0 | Current pool size: 0
[INFO] [TRIGGER_FALLBACK] ✅ First untagged Movie (abc123) - adding to pool as bootstrap fallback
[INFO] [POOL_ADD] Added to pool: Movie abc123 → poolItemId=def456 | Tags: 0
[DEBUG] [POOL_TAGS] Associated tags for poolItemId=def456 | Tags: []
[INFO] [PREWARM_QUEUE] Queued prewarm for poolItemId=def456 | Profiles: [native, plex, jellyfin] | RunId: incremental-def45678
```

**✅ Success indicators:**

- `TRIGGER_FALLBACK` shows "First untagged Movie"
- `POOL_ADD` confirms pool item created
- `PREWARM_QUEUE` shows 3 profiles queued

### Section 2: Transcoding Completion (Step 2)

```
[SUCCESS] [NORM_COMPLETE] ✅ Normalization completed: abc123 | Profile: native | Output: /cache/def456_native.mp4 | Duration: 45230ms
[INFO] [VARIANT_UPDATE] Variant updated: poolItemId=def456 | Profile: native | Status: READY ✅ | Path: /cache/def456_native.mp4
```

**✅ Success indicators:**

- `NORM_COMPLETE` for at least one profile
- `VARIANT_UPDATE` shows `Status: READY ✅`

### Section 3: Stream Start Validation (Step 3)

```
────────────────────────────── STREAM START VALIDATION ──────────────────────────────
[INFO] [STREAM_VALIDATION] Stream start validation: ✅ ALLOWED | Bootstrap enabled: true | Ready anchors: 1 (native=1, plex=0, jellyfin=0)
```

**✅ Success indicators:**

- `STREAM_VALIDATION` shows `✅ ALLOWED`
- At least 1 ready anchor reported

### Section 4: Bootstrap Selection (Step 3)

```
[INFO] [SELECT_ATTEMPT] Bootstrap selector invoked | Profile: native | Cooldown: 21600s
[SUCCESS] [SELECT_SUCCESS] Bootstrap anchor selected: Movie abc123 (poolItemId=def456) | ✅ READY IMMEDIATELY | Path: /cache/def456_native.mp4
[DEBUG] [SELECT_USAGE] Recorded anchor usage: poolItemId=def456 | lastUsedAt=1718513423
```

**✅ Success indicators:**

- `SELECT_SUCCESS` shows the movie was selected
- `✅ READY IMMEDIATELY` (not "REQUIRES PREPARATION")
- `SELECT_USAGE` confirms lastUsedAt timestamp recorded

---

## Expected Timing

| Event                                | Expected Time | What You'll See                  |
| ------------------------------------ | ------------- | -------------------------------- |
| Add Movie → Pool Addition            | <100ms        | Console logs, Log button appears |
| Pool Addition → Normalization Start  | <500ms        | UI shows "Transcoding 1 item..." |
| Normalization per profile            | 30s-3min      | Depends on file size             |
| First profile ready → Button enabled | Immediate     | Launch button becomes enabled    |
| Click Launch → Stream starts         | 1-2 seconds   | Player opens, playback begins    |

---

## Troubleshooting

### Launch button never enables

**Check log for:**

- Missing `NORM_COMPLETE` events
- `VARIANT_UPDATE` with `Status: NOT READY`
- Normalization errors

**Possible causes:**

- FFmpeg not installed
- Source file incompatible
- Disk space full

### Stream fails to start

**Check log for:**

- `STREAM_VALIDATION` shows `❌ BLOCKED`
- Missing `SELECT_SUCCESS` event

**Possible causes:**

- Bootstrap selector was disabled (check that you're running with `npm run dev`)
- Variant not actually ready (check database)

### Stream starts but has delay

**Check log for:**

- `SELECT_FALLBACK` instead of `SELECT_SUCCESS`
- `⚠️ REQUIRES PREPARATION` instead of `✅ READY IMMEDIATELY`

**Possible causes:**

- Bootstrap selector bypassed (fell back to on-demand)
- Wrong profile selected

---

## Success Criteria

✅ **Test PASSES if all of these are true:**

1. Log shows `TRIGGER_FALLBACK` when adding The Matrix
2. Log shows `PREWARM_QUEUE` for 3 profiles
3. Log shows at least one `NORM_COMPLETE` with `Status: READY ✅`
4. Log shows `STREAM_VALIDATION: ✅ ALLOWED`
5. Log shows `SELECT_SUCCESS` with `✅ READY IMMEDIATELY`
6. Stream starts and plays within 2 seconds of clicking Launch

---

## After Testing

1. Click "📋 Log" button to open the log file
2. Copy the entire contents
3. Share the log for validation
4. Note any unexpected behavior or timing issues
