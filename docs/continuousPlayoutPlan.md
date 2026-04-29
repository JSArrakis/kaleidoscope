# Continuous Playout Engine: Development Plan

This document is a complete, from-the-ground-up development plan for building a continuous
channel playout system in Kaleidoscope. It covers every concept involved, maps each piece to
what already exists in the codebase, and describes every file that needs to be created or
changed. Nothing is assumed to be obvious. If a term is unfamiliar, it is explained before it
is used.

---

## Part 1: What We Are Building and Why

### The current situation

Right now when a stream starts, the `buildContinuousStream()` function runs, generates a
list of `MediaBlock` objects, and hands them to `playerManager.ts`. The player manager
flattens each block into a queue of individual file paths and stores them in memory.
The Electron renderer's `<video>` HTML element then tries to play each file in sequence.

The problem is that the `<video>` element is embedded in a Chromium browser context.
Chromium is a web browser, and web browsers have strict rules about which video formats
they will play. Specifically, Chromium requires:

- Container format: MP4 (or WebM, but we are not using that)
- Video codec: H.264 (also called AVC)
- Audio codec: AAC (or MP3 in some cases)

Most source media in a personal library does not meet all three of these requirements.
Common formats that Chromium cannot play include: AVI with DivX or Xvid video, MKV
containers of any kind, AC3 (Dolby Digital) audio, DTS audio, HEVC (H.265) video.

The current `ffmpegPlaybackProxy.ts` tries to solve this by converting each file on
demand when the renderer asks for a playable path. This works in principle but has a
critical timing problem: transcoding a 24-minute AVI file to H.264/AAC takes roughly
2 to 3 minutes. The player stalls at 0:00 and waits. Cadence timing falls apart.

### The solution at a high level

Instead of converting files one at a time on demand, we build a pipeline that:

1. Knows what files are coming up by looking at the stream schedule ahead of time.
2. Converts those files in the background before they are needed.
3. Stitches the converted files together into one continuous output using FFmpeg.
4. Serves that output in a format that any player (Chromium, Plex, Jellyfin, VLC) can consume.

The stream schedule already exists. `buildContinuousStream()` and `buildAdhocStream()`
already produce a full ordered list of `MediaBlock` objects with timing information
attached. We do not change those at all. We only change what happens after that list is
produced.

---

## Part 2: Concepts You Need to Know

### 2.1 What is a codec vs a container?

A video file is two separate things wrapped together. The **container** is the outer box
(AVI, MKV, MP4, TS). The **codec** is how the video and audio data inside the box are
compressed (H.264, H.265, DivX, AAC, AC3, MP3). An MP4 container almost always holds
H.264 video and AAC audio. An AVI container often holds older codecs like Xvid or DivX.
An MKV container can hold almost anything.

### 2.2 What is remuxing?

Remuxing means moving video and audio data from one container into another without
re-encoding the actual video or audio data. Because you are not touching the compressed
data, this is nearly instantaneous. A 2-hour movie remuxed from AVI to MP4 takes 1-3
seconds regardless of hardware.

Remuxing only works if the codec inside the source file is already one that the target
container supports. If a file is AVI with H.264 video and AAC audio, remuxing it into MP4
is instant and lossless. If a file is AVI with Xvid video, remuxing will not help because
Chromium still cannot play Xvid, even inside an MP4 box.

### 2.3 What is transcoding?

Transcoding means actually re-encoding the video and/or audio data from one codec to
another. This is computationally expensive. A modern CPU can transcode standard-definition
video (480p, 720p) at roughly 5x to 20x realtime speed, meaning a 24-minute episode takes
1 to 5 minutes to transcode. High-definition content takes longer.

FFmpeg is the tool we already use for this. The `ffmpeg-static` package bundles a compiled
FFmpeg binary that works on Windows, macOS, and Linux without any installation.

### 2.4 What is MPEG-TS?

MPEG-TS (MPEG Transport Stream) is a container format specifically designed for continuous
broadcasting. Unlike MP4, which was designed for files with a known start and end,
MPEG-TS is designed to be written and read simultaneously in a streaming context. It is
the container format used by digital television broadcasts worldwide. Plex Live TV,
Jellyfin Live TV, and most streaming protocols use MPEG-TS internally.

### 2.5 What is HLS?

HLS stands for HTTP Live Streaming. It was invented by Apple and has become the universal
standard for streaming video over HTTP. Instead of one giant file, HLS splits video into
small chunks called segments, typically 2 to 10 seconds long. It writes an index file
called a playlist (extension `.m3u8`) that lists the segments in order. A player reads
the playlist, downloads segments in order, and plays them back seamlessly.

The critical property of HLS for our purposes is that a player can start playing after
it has downloaded only the first few segments, and new segments can be appended to the
playlist continuously. This means there is no "full file" the player has to wait for.
The player starts as soon as the first 2-3 segments (about 10-20 seconds of content)
are written to disk.

HLS is natively supported by Safari and iOS. For Chrome and Electron, the `hls.js`
JavaScript library adds full HLS support to any `<video>` element with a few lines of
code. Plex and Jellyfin can consume HLS directly. VLC can consume HLS directly.

### 2.6 What is FFmpeg's concat protocol?

FFmpeg can stitch multiple files together without gaps by reading them through a special
input mode called the concat demuxer. You provide a text file like this:

```
file '/path/to/commercial1.mp4'
file '/path/to/commercial2.mp4'
file '/path/to/episode1.mp4'
file '/path/to/movie1.mp4'
```

FFmpeg reads them in sequence and outputs a single continuous stream. The key property is
that as long as all input files share the same codec, resolution, sample rate, and channel
count, transitions are truly gapless. No black frame appears between files.

This is exactly what we want for cadenced streams: commercials play back-to-back with no
gap, then the show starts immediately after the last commercial.

### 2.7 What is mpv?

mpv is a free, open-source media player that can play virtually any video format without
additional configuration. It uses libav (the same underlying library as FFmpeg) and
understands every codec ever made. For our purposes, the key properties are:

- It can play AVI, MKV, TS, and anything else without conversion.
- It can be launched as a subprocess from Node.js.
- It accepts commands over a socket connection (add a file to the queue, pause, seek, etc.).
- It can be run in a separate window that overlays or sits next to the Electron app window.

Running mpv as a sidecar means: instead of the Electron `<video>` element playing files,
we launch mpv as a separate process and tell it what to play. The user sees the mpv window.
The Electron app remains the control surface (what is playing, what is coming up, the
library UI) but delegates actual rendering of video to mpv.

This bypasses the Chromium codec restriction entirely. The user never installs mpv manually;
we bundle it in the `resources/` folder of the Electron app.

---

## Part 3: The Complete Architecture

The system has four distinct layers. Each layer has one clear job.

```
Layer 1: Stream Construction (unchanged)
  buildContinuousStream() / buildAdhocStream()
  Produces: ordered MediaBlock[] with timing metadata

Layer 2: Normalization Queue (new)
  NormalizationWorker + NormalizationQueue
  Takes: MediaBlock[] from Layer 1
  Produces: ordered list of normalized file paths (all H.264/AAC/MP4)
  Strategy: instant remux if compatible, background transcode if not

Layer 3: Playout Engine (replaces/completes ffmpegStreamService.ts)
  PlayoutEngine
  Takes: ordered normalized file paths from Layer 2
  Produces: one of two outputs (chosen at startup):
    a. HLS stream served on localhost:3333/stream.m3u8
    b. Individual file paths fed to mpv via socket

Layer 4: Player Surface (replaces current Electron <video> approach)
  Two implementations:
    a. HlsPlayer: Electron <video> + hls.js library consuming localhost:3333/stream.m3u8
    b. MpvSidecar: mpv subprocess controlled via IPC socket
```

The layers communicate in sequence. The stream construction layer hands blocks to the
normalization queue. The normalization queue hands normalized paths to the playout engine.
The playout engine hands output to the player surface.

---

## Part 4: The Startup Timing Concern - Answered in Full

This is the most important section. Let us trace exactly what happens from the moment
the user presses "Go" to the moment video is playing, with the proposed architecture.

### How the current system handles startup

When the user presses "Go" today:

1. `buildContinuousStream()` runs synchronously (it queries the database, runs selection
   logic, and calculates timings). For a cadenced stream this takes roughly 100-500ms.
2. The result is a `MediaBlock[]`. For a cadenced stream, the first block has `startTime`
   equal to right now. Its `buffer` array contains commercials/shorts/music totaling
   enough time to fill to the next :00 or :30 boundary. The `anchorMedia` is the first
   show or movie.
3. The blocks are split into `onDeck` (first 3) and `upcoming` (the rest).
4. The player manager flattens the first block into queue items. The renderer starts
   trying to play the first file immediately.

The cadence timing is encoded in absolute Unix timestamps on each block. If the first
anchor's `startTime` is `now + 1200` (20 minutes from now), that means 20 minutes of
commercials were built as the opening buffer. The background service checks these
timestamps every 5 minutes to decide what should be "on deck" and what has expired.

### How the new system handles startup

The startup flow changes only in Layer 2 and Layer 3. Layer 1 (stream construction)
is completely unchanged.

When the user presses "Go" with the new system:

1. `buildContinuousStream()` runs exactly as today. No change. Returns `MediaBlock[]`.
2. The blocks are stored in StreamManager's `onDeck` and `upcoming` exactly as today.
   No change to this logic either.
3. **New step**: The full ordered list of media files extracted from the blocks is passed
   to `NormalizationQueue`.
4. `NormalizationQueue` immediately begins normalizing files from the front of the list.
   For each file, it first probes the format (using ffprobe, which is already bundled and
   already used in `ffmpegPlaybackProxy.ts`). If the file is already H.264/AAC in a
   compatible container, it is remuxed in 1-3 seconds. If it needs transcoding, that
   takes longer but starts immediately.
5. As soon as the **first normalized file** is ready, the playout engine starts.
6. While the first file is playing, normalization of subsequent files continues in the
   background.

### Startup admission control for large first anchors (new rule)

For cadenced streams, first-anchor selection must be readiness-aware.

Before committing the first anchor, evaluate whether it can be normalized inside the
available warm-up window created by opening buffer media.

Definitions:

- `requiredStart`: absolute Unix time when the first anchor must begin (cadence boundary)
- `now`: current Unix time at stream start
- `warmupWindowSec = requiredStart - now`
- `estimatedNormalizeSec`: estimated time to normalize this anchor

Admission rule:

- If `estimatedNormalizeSec <= warmupWindowSec`, keep candidate as first anchor.
- If `estimatedNormalizeSec > warmupWindowSec`, skip as first anchor and choose the next
  candidate that passes.

This prevents a 3-4 hour UHD movie from being selected first when only a small opening
window is available (for example a 3:55 start with a short cadence fill to 4:00).

For uncadenced streams, this rule is optional because there is no hard wall-clock boundary.

### Why the initial buffer is the key

In a cadenced stream, the very first items in the queue are **buffer media**: commercials,
shorts, and music that fill time before the first show begins. These files are typically
30-second to 2-minute clips. Normalizing a 30-second commercial via remux takes under a
second. Transcoding a 30-second commercial takes under 10 seconds.

A typical opening buffer for a cadenced stream might contain 8-15 commercials totaling
10-20 minutes of content. By the time all of those short clips have played, the first
anchor (a 22-minute episode or 90-minute movie) will have been fully normalized. This is
the natural pre-warm window. It costs us nothing because the cadence logic already
requires it.

For an uncadenced stream (no buffers), the first item is the anchor directly. In this
case we must normalize the anchor before starting. If it requires transcoding, we show
a "Preparing stream..." state for the duration of the transcode. For most modern files
(H.264 already) this is a 1-3 second remux. For legacy AVI files this might be 1-5
minutes. We can display progress to the user during this time.

### What about cadence accuracy?

The current system uses wall-clock Unix timestamps to enforce cadence. The next show
starts at exactly :00 or :30. With the playout engine approach, the cadence is enforced
differently but equivalently: the playout engine receives a sequence of files with known
durations. It plays them in order. The buffer files before each anchor fill exactly the
right amount of time to hit the :00 or :30 boundary. The boundary is maintained not by
checking wall-clock time but by construction: the sum of buffer durations equals the time
needed to reach the boundary.

This is actually more reliable than the current wall-clock approach, because it is not
affected by system clock drift, sleep/wake cycles, or the Electron app being backgrounded.

### Cadence drift realignment during playout

Cadence can still drift from small duration mismatches, variable frame rates, or source
metadata inaccuracies. Add a realignment monitor that checks drift at anchor boundaries:

- `driftSec = actualBoundaryTime - targetBoundaryTime`

Realignment policy:

- If `abs(driftSec) <= 3`, do nothing (within tolerance).
- If `driftSec > 3` (running late), reduce upcoming low-priority filler duration by removing
  or replacing filler items (commercials first, then promos, then music).
- If `driftSec < -3` (running early), insert filler from a duration-indexed filler bank.

Selection is solved as a bounded duration-fit problem targeting a residual within
`+- 3` seconds. This keeps cadence aligned organically without abrupt jumps.

---

## Part 5: Phase-by-Phase Implementation Plan

### Phase 1: Normalization Pipeline

**Goal**: Replace `ffmpegPlaybackProxy.ts` with a proactive, queue-driven normalization
system that processes files before they are needed.

**New file**: `src/electron/services/normalization/normalizationWorker.ts`

This is the core unit. It takes a single file path and produces a normalized MP4 file.
Logic:

```typescript
// Pseudocode for the worker
async function normalizeFile(sourcePath: string): Promise<string> {
  // 1. Probe the file using ffprobe (already written in ffmpegPlaybackProxy.ts)
  const probe = await probeFile(sourcePath);

  // 2. Check if already playable (already written in ffmpegPlaybackProxy.ts)
  if (isAlreadyChromiumPlayable(probe)) {
    return sourcePath; // No conversion needed at all
  }

  // 3. Check cache (already written in ffmpegPlaybackProxy.ts)
  const cacheKey = createCacheKey(sourcePath);
  const cachedPath = getCachedPath(cacheKey);
  if (cachedPath && (await isValidCache(cachedPath))) {
    return cachedPath;
  }

  // 4. Determine strategy
  // canRemux = codecs are compatible but container is wrong
  // mustTranscode = codecs need re-encoding
  const strategy = determineStrategy(probe);

  // 5. Run FFmpeg
  const outputPath = getCacheFilePath(cacheKey);
  await runFfmpeg(sourcePath, outputPath, strategy);
  return outputPath;
}
```

Most of this logic already exists in `ffmpegPlaybackProxy.ts`. The new file extracts
it into a pure worker function and adds a `strategy` determination step that distinguishes
remux from transcode. The existing `ffmpegPlaybackProxy.ts` already has `isAlreadyChromiumPlayable()`,
`createCacheKey()`, and `runFfmpegConversion()`. Those are moved here with minor changes.

**Changes to `ffmpegPlaybackProxy.ts`**: This file is refactored to be a thin wrapper
that calls `normalizationWorker.normalizeFile()`. Eventually it may be deleted entirely.

**New file**: `src/electron/services/normalization/normalizationQueue.ts`

This is the queue manager. It holds the ordered list of files to normalize, runs workers
concurrently up to a concurrency limit (2 workers by default), and emits events when
files are ready.

```typescript
class NormalizationQueue extends EventEmitter {
  private queue: NormalizationJob[] = [];    // Ordered, matches playout order
  private active: Set<string> = new Set();   // Currently normalizing
  private results: Map<string, string> = new Map(); // sourcePath → normalizedPath
  private concurrencyLimit = 2;

  // Called by the playout engine to feed files into the queue
  enqueue(jobs: NormalizationJob[]): void { ... }

  // Emits 'ready' when the next-in-sequence file is normalized
  // Emits 'progress' with transcode percentage for long jobs
  private processNext(): void { ... }
}
```

The queue processes files in the order they will play. The concurrencyLimit of 2 means
it is always working on normalizing 2 files simultaneously, so by the time file N is
done playing, file N+2 is already normalized and waiting.

**New file**: `src/electron/services/normalization/normalizationJobFactory.ts`

A simple factory that takes a `MediaBlock[]` and flattens it into an ordered array of
`NormalizationJob` objects. Buffer items come first (buffer array in order), then the
anchor. This mirrors exactly what `flattenMediaBlockToQueueItems()` in `playerManager.ts`
already does, but produces jobs for the normalization system instead of queue items for
the Electron player.

```typescript
interface NormalizationJob {
  jobId: string;
  sourcePath: string;
  title: string;
  mediaType: string;
  isBuffer: boolean;
  durationSeconds: number | null; // from probe, filled in after probe
  blockStartTime: number; // Unix timestamp from the MediaBlock
}
```

**What changes in the existing code**: `playerManager.ts` is where the current per-file
conversion request happens (called from the renderer via IPC). In the new architecture,
`playerManager.ts` is no longer responsible for normalization at all. Normalization
happens upstream, in the same process that runs stream construction. The player receives
normalized paths, not source paths. The `resolveElectronPlayablePath` IPC handler in
`main.ts` and its entry in `preload.cts` and `types.d.ts` are removed once this is
working.

**What does NOT change**: `buildContinuousStream()`, `buildAdhocStream()`, `bufferConstructor.ts`,
`streamManager.ts`, `backgroundService.ts`. All stream construction logic is completely
untouched. It still produces `MediaBlock[]` with `buffer` arrays and `anchorMedia` as today.

---

### Phase 2: Playout Engine (FFmpeg HLS output)

**Goal**: Complete `ffmpegStreamService.ts` (which is currently a stub with TODO comments)
into a working continuous playout engine that outputs HLS.

**What is HLS output in practice**: FFmpeg can write HLS files directly to disk. It
creates a folder like `%APPDATA%/prism/hls-output/` and writes:

- `stream.m3u8` (the playlist file, continuously updated as new segments are added)
- `segment000.ts`, `segment001.ts`, etc. (the actual video data, ~4 seconds each)

The playlist file is a plain text file that looks like this:

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4.008,
segment000.ts
#EXTINF:4.008,
segment001.ts
```

As FFmpeg writes more segments, it updates this file. An HLS player (hls.js in the
renderer, or Plex, or Jellyfin) polls this file periodically and downloads new segments
as they appear. The player always stays a few segments behind the write head, which gives
a buffer against network jitter and keeps playback smooth.

**Serving the HLS files**: The Electron main process can run a tiny HTTP server (using
Node's built-in `http` module) that serves files from the `hls-output/` folder. This
is `localhost:3333`. The renderer opens `http://localhost:3333/stream.m3u8` and hls.js
reads it. Plex/Jellyfin are given the same URL and read it over the local network.

**Completing `ffmpegStreamService.ts`**:

The current file already has the right class structure, the right imports, and the
`prime()` and `addMediaBlock()` stubs. The implementation is as follows.

The `prime()` method:

1. Creates the `hls-output/` directory in userData.
2. Starts a Node.js HTTP server on the configured port serving that directory.
3. Starts an FFmpeg process in a subprocess using `fluent-ffmpeg`.
4. The FFmpeg input is a named pipe (on Windows: a named pipe like `\\.\pipe\kaleidoscope-concat`)
   or a temporary concat list file that is updated dynamically.
5. FFmpeg output flags:
   - Output format: `hls`
   - Codec: `copy` (we pass it already-normalized H.264/AAC files so no re-encoding)
   - HLS segment duration: 4 seconds
   - HLS list size: 0 (keep all segments, never delete old ones - important for Plex)
   - HLS flags: `append_list` (add new segments rather than overwriting)
6. The process is stored as `this.ffmpegProcess`.

The `addMediaBlock()` method:

1. Flattens the media block into normalized file paths (calling into the normalization
   queue to wait for each path to be ready).
2. Appends those paths to the concat list.
3. Signals FFmpeg to read the new entries (via a pipe write or a concat file reload).

**The concat mechanism in detail**: FFmpeg has two ways to concatenate files dynamically:

Option A - Concat list file (simpler): Write all file paths to a `.txt` file before starting.
FFmpeg reads the entire list and processes them. To add more files, stop FFmpeg, append
to the file, and restart. This is simple but has a gap on restart.

Option B - Concat pipe (preferred): Use FFmpeg's `pipe:` input and write each file's path
to FFmpeg's stdin. FFmpeg reads them in order without stopping. This enables truly gapless
concatenation. This is what we want.

The practical implementation for our use case uses a **concat file that is re-read on each
new segment**. FFmpeg's `hls` muxer with `segment_list_type flat` supports this pattern.
We write a `concat_input.txt` containing all pending normalized file paths, and FFmpeg
reads them in order as it advances through segments. When we want to add more files,
we append to `concat_input.txt`. This is the safest and most compatible approach with
`fluent-ffmpeg` on Windows.

**New file**: `src/electron/services/playout/playoutQueue.ts`

This is the bridge between the normalization queue and the playout engine. It:

1. Listens to `NormalizationQueue`'s `'ready'` events.
2. When a normalized path is ready, appends it to the FFmpeg concat input.
3. Maintains a lookahead buffer: always tries to keep 3 items pre-normalized in the queue.

**New file**: `src/electron/services/playout/hlsServer.ts`

A tiny Node.js HTTP server that serves the HLS output directory. Uses Node's built-in
`http` module and `fs.createReadStream`. About 40 lines of code. Sets correct MIME types
(`application/vnd.apple.mpegurl` for `.m3u8`, `video/mp2t` for `.ts`).

---

### Phase 3: mpv Sidecar (Local Playback)

**Goal**: Bundle mpv and use it as the local playback surface instead of the Electron
`<video>` element. The `<video>` element then becomes the HLS consumer for Plex-mode output.

**What to bundle**: mpv provides pre-built Windows binaries at
`https://mpv.io/installation/`. The binary is a single `.exe` file (`mpv.exe`, about
40MB) that we place in `resources/mpv/mpv.exe`. During Electron packaging, `electron-builder`
is configured to include this file in the app bundle. No installer is needed; no PATH
entry is needed. We reference it via `path.join(process.resourcesPath, 'mpv', 'mpv.exe')`.

**New file**: `src/electron/services/mpv/mpvSidecar.ts`

This service manages the mpv subprocess lifecycle and the IPC socket connection.

mpv supports a JSON IPC protocol over a named socket. You can:

- Tell mpv to load a file: `{"command": ["loadfile", "/path/to/file.mp4"]}`
- Append a file to mpv's internal playlist: `{"command": ["loadfile", "/path/to/file.mp4", "append"]}`
- Observe playback position: subscribe to `playback-time` property changes
- Listen for end-of-file events: `{"event": "end-file"}`

The `mpvSidecar.ts` service:

```typescript
class MpvSidecar {
  private process: ChildProcess | null = null;
  private socket: net.Socket | null = null;
  private socketPath: string;

  async launch(): Promise<void> {
    // Start mpv with:
    // --input-ipc-server=<socketPath>  (enables IPC)
    // --no-terminal                    (no console window)
    // --keep-open=yes                  (don't close after last item)
    // --idle=yes                       (start without a file, wait for commands)
    // --force-window=yes               (show window immediately)
  }

  async appendFile(normalizedPath: string): Promise<void> {
    // Sends loadfile command with "append-play" flag
    // mpv plays files in sequence with no gap
  }

  async seek(seconds: number): Promise<void> { ... }
  async pause(): Promise<void> { ... }
  async resume(): Promise<void> { ... }

  onEndOfFile(callback: () => void): void { ... }
  onTimePosition(callback: (seconds: number) => void): void { ... }
}
```

The mpv playlist mode (`append-play`) means we keep adding normalized files to mpv's
internal queue while it plays. mpv handles the gapless transition between files natively.
We stay one file ahead: as file N starts playing, we append file N+1 to mpv's playlist.

**Changes to `playerManager.ts`**: Add a new function `enqueueMpvMediaBlock()` that
calls `mpvSidecar.appendFile()` for each item in the block (buffer first, then anchor).
The existing `enqueueElectronMediaBlock()` stays for now during the transition period.

**Changes to `main.ts`**: Add a new IPC handler `launchMpvPlayer` that calls
`mpvSidecar.launch()` and begins feeding it files from the normalization queue.

---

### Phase 4: Renderer Changes (HLS Player)

**Goal**: Update the Player screen to use hls.js for HLS playback instead of the
current direct file path approach.

**Install the dependency**: `npm install hls.js` and `npm install --save-dev @types/hls.js`.

**Changes to `Player.view.tsx`**:

Replace the current `<video src={resolvedPlayablePath}>` approach with:

```tsx
import Hls from "hls.js";

useEffect(() => {
  if (!videoRef.current) return;

  if (Hls.isSupported()) {
    const hls = new Hls({
      lowLatencyMode: false, // We want buffer depth, not low latency
      maxBufferLength: 60, // Buffer up to 60 seconds ahead
      maxMaxBufferLength: 120, // Allow up to 2 minutes of buffer
    });
    hls.loadSource("http://localhost:3333/stream.m3u8");
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoRef.current?.play();
    });
    return () => hls.destroy();
  }
}, []);
```

The `resolvedPlayablePath` state variable, the `isResolvingPlaybackSource` flag, and the
`resolveElectronPlayablePathHandler` IPC call are all removed from `Player.viewmodel.ts`.
The player no longer needs to know about individual files. It just plays the HLS stream.

The queue display (showing what is playing and what is coming up) still comes from
`playerManager.ts` via the existing IPC/state mechanism. The HLS stream and the queue
display are independent. The queue tells the user what they are watching. The HLS stream
is what the video element actually plays. These two views of state stay in sync because
the playout engine and the normalization queue both record which item they are currently
processing and emit that state through IPC.

---

### Phase 5: Integration and Wiring

**Goal**: Connect all the new pieces together and make the "Go" button work end-to-end.

**Changes to `streamService.ts`**: After `buildContinuousStream()` returns blocks,
call `normalizationQueue.enqueue()` and `playoutEngine.prime()`. The stream construction
and stream playback are now connected at this point.

```typescript
export async function createStream(
  streamType: StreamType,
  options: StreamConstructionOptions,
  endTimepoint?: number,
): Promise<[MediaBlock[], string]> {
  const [blocks, error] = await buildStream(streamType, options, endTimepoint);
  if (error || blocks.length === 0) return [blocks, error];

  // Flatten all blocks into an ordered job list for normalization
  const jobs = normalizationJobFactory.fromBlocks(blocks);
  normalizationQueue.enqueue(jobs);

  // Prime the playout engine (starts HLS server and FFmpeg process)
  await playoutEngine.prime();

  return [blocks, error];
}
```

**Changes to `backgroundService.ts`**: When new blocks are generated during a day
rollover (the `rolloverToNextDay` call), those blocks also need to be passed to
`normalizationQueue.enqueue()`. Add a call to enqueue the rollover blocks immediately
after construction. The normalization queue will process them in the background well
before they are needed.

**Changes to `main.ts`**: Remove the `resolveElectronPlayablePath` IPC handler (it is
no longer needed). Add a `getStreamStatus` IPC handler that returns the current playout
state (buffering, playing, current title, next title). This feeds the UI status bar.

**Changes to `preload.cts`**: Remove `resolveElectronPlayablePathHandler`. Add
`getStreamStatus`.

**Changes to `types.d.ts`**: Remove `resolveElectronPlayablePath` from
`EventPayloadMapping` and the `window.electron` interface. Add `getStreamStatus`.

---

### Phase 6: Packaging and Bundling

**Goal**: Ship mpv and the ffmpeg/ffprobe binaries inside the Electron app package
so the user installs one app and everything works.

**Changes to `electron-builder.json`**:

```json
{
  "extraResources": [
    {
      "from": "resources/mpv/",
      "to": "mpv/",
      "filter": ["**/*"]
    }
  ]
}
```

The `ffmpeg-static` and `ffprobe-static` npm packages already handle bundling their
binaries. No additional configuration is needed for FFmpeg.

**New folder**: `resources/mpv/` in the repository root. This folder is gitignored
(the binary is large) and populated by a setup script or documented as a manual step.
Document the exact mpv build to download (the latest Windows 64-bit build from
`https://sourceforge.net/projects/mpv-player-windows/files/`).

---

## Part 6: File-by-File Change Summary

This table covers every file that needs to be created or modified.

| File                                                             | Action              | What changes                                                                               |
| ---------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `src/electron/services/normalization/normalizationWorker.ts`     | Create              | Per-file probe + remux/transcode logic, extracted from `ffmpegPlaybackProxy.ts`            |
| `src/electron/services/normalization/normalizationQueue.ts`      | Create              | Queue manager, concurrency control, EventEmitter for ready events                          |
| `src/electron/services/normalization/normalizationJobFactory.ts` | Create              | Flattens `MediaBlock[]` into ordered `NormalizationJob[]`                                  |
| `src/electron/services/playout/playoutQueue.ts`                  | Create              | Bridge between normalization queue and FFmpeg playout engine                               |
| `src/electron/services/playout/hlsServer.ts`                     | Create              | Node.js HTTP server for HLS files                                                          |
| `src/electron/services/ffmpegStreamService.ts`                   | Modify              | Implement `prime()` and `addMediaBlock()` stubs (file already exists)                      |
| `src/electron/services/mpv/mpvSidecar.ts`                        | Create              | mpv subprocess management, IPC socket protocol                                             |
| `src/electron/services/streamService.ts`                         | Modify              | Wire normalizationQueue and playoutEngine after stream construction                        |
| `src/electron/services/playerManager.ts`                         | Modify              | Add `enqueueMpvMediaBlock()`, remove per-item FFmpeg resolution                            |
| `src/electron/services/backgroundService.ts`                     | Modify              | Enqueue rollover blocks in normalizationQueue                                              |
| `src/electron/services/ffmpegPlaybackProxy.ts`                   | Modify/Delete       | Thin wrapper or remove; logic moved to normalizationWorker                                 |
| `src/electron/main.ts`                                           | Modify              | Remove `resolveElectronPlayablePath` handler, add `getStreamStatus`, add `launchMpvPlayer` |
| `src/electron/preload.cts`                                       | Modify              | Remove `resolveElectronPlayablePathHandler`, add `getStreamStatus`, `launchMpvPlayer`      |
| `types.d.ts`                                                     | Modify              | Remove resolved path types, add stream status type                                         |
| `src/ui/screens/Player/View/Player.view.tsx`                     | Modify              | Replace direct `<video src>` with hls.js integration                                       |
| `src/ui/screens/Player/View/Player.viewmodel.ts`                 | Modify              | Remove `resolvedPlayablePath` state and `resolveElectronPlayablePath` calls                |
| `src/ui/screens/Home/View/Home.view.tsx`                         | Modify              | Remove temporary test buttons when real stream launch works                                |
| `electron-builder.json`                                          | Modify              | Add `extraResources` entry for mpv binary                                                  |
| `resources/mpv/mpv.exe`                                          | Add (not committed) | Downloaded mpv binary, documented in README setup steps                                    |
| `package.json`                                                   | Modify              | Add `hls.js` dependency                                                                    |

**Files that do NOT change**:

- `continuousStreamBuilder.ts`
- `adhocStreamBuilder.ts`
- `bufferConstructor.ts`
- `streamManager.ts`
- `backgroundService.ts` (except rollover wiring, minor addition)
- All repositories
- All factories
- All handlers
- All database files
- `mediaSelector.ts`, `selectionHelpers.ts`, `programmingBlockSegmentBuilder.ts`

---

## Part 7: Recommended Build Order

The phases should be built in this order to keep the app functional at each step.

**Step 1 (1-2 days)**: Build `normalizationWorker.ts` and `normalizationQueue.ts`.
Write a simple test that takes 5 files from the filesystem and normalizes them in order,
logging each completion. Verify that remux happens in under 5 seconds and transcode
happens in the background. At this point the existing Electron `<video>` approach still
works in parallel.

**Step 2 (1 day)**: Build `normalizationJobFactory.ts` and wire it into `streamService.ts`.
When a stream is built, all its files immediately start normalizing in the background.
The existing player still works by serving normalized paths from the cache.

**Step 3 (2-3 days)**: Complete `ffmpegStreamService.ts` with a working HLS output.
Test by running a stream and opening `http://localhost:3333/stream.m3u8` in VLC or
directly in a browser. Verify segments appear and the stream plays continuously through
multiple files without gaps.

**Step 4 (1-2 days)**: Build `hlsServer.ts` and integrate hls.js into `Player.view.tsx`.
The Electron player now shows the HLS stream. Remove the `resolvedPlayablePath` mechanism.

**Step 5 (2-3 days)**: Build `mpvSidecar.ts`. Add a player mode toggle to settings.
When mpv mode is enabled, the Player screen shows a message ("Playing in mpv window")
and the video renders in the mpv window. When HLS mode is enabled, the video renders
in the Electron `<video>` element.

**Step 6 (1 day)**: Packaging. Download mpv binary, configure `electron-builder.json`,
test a production build. Verify mpv launches correctly from the packaged binary path.

**Step 7 (1 day)**: Plex/Jellyfin integration documentation. Write the setup instructions
for pointing Plex or Jellyfin at `http://[machine-ip]:3333/stream.m3u8` as a Live TV
or IPTV source. Plex requires an M3U playlist file; Jellyfin accepts direct M3U8.

---

## Part 8: Known Decisions and Open Questions

**Decided**:

- mpv for local playback (no user download required, bundled in app)
- HLS over HTTP for all network consumers (Plex, Jellyfin, Chromium via hls.js)
- Normalization cache stored in `%APPDATA%/prism/ffmpeg-playback-cache/` (already exists)
- HLS segments stored in `%APPDATA%/prism/hls-output/` (new, parallel to cache folder)
- Concurrency limit of 2 normalization workers (configurable)
- 4-second HLS segments (standard for video-on-demand)
- Cache eviction is schedule-aware (not plain LRU)
- Cadenced startup uses first-anchor readiness admission control
- Two-tier normalization is optional and only for large, high-risk first anchors

### Cache eviction strategy (detailed)

The normalization cache is persistent on disk and should be managed by policy tiers.

Tier definitions:

- `PinnedNow`: currently playing and near-term startup candidates. Never evict.
- `PinnedSoon`: assets referenced in the next schedule horizon (for example 24 hours).
  Evict only under emergency disk pressure.
- `Warm`: recently played or frequently selected assets.
- `Cold`: old and rarely reused assets.

Eviction order:

1. Cold
2. Warm
3. PinnedSoon (emergency only)
4. Never evict PinnedNow

Within Warm/Cold, rank by weighted score:

`evictScore = ageWeight * age + sizeWeight * sizeGb - reuseWeight * reuseRate - costWeight * transcodeCost`

Higher score means more evictable.

This prioritizes reclaiming large, stale files while protecting expensive-to-recreate media
likely to be needed soon.

### Two-tier normalization policy for huge anchors

Two-tier means storing two cached derivatives for the same source file:

1. Fast-start mezzanine copy: quick to produce, playout-safe profile (for example capped
   1080p H.264/AAC).
2. Higher-quality copy: slower to generate, produced in background.

Policy:

- Default to one normalized copy for normal content.
- Use two-tier only when media crosses a high-risk threshold (long runtime + high
  resolution + expensive codec) and may appear as an early cadenced anchor.
- If disk pressure is high, keep mezzanine and evict the higher-quality derivative first.

This preserves startup reliability while containing disk growth.

**Open questions**:

- Should old HLS segments be deleted after they are consumed? Keeping them all allows
  Plex to seek backward. Deleting them saves disk space. Recommend keeping them for now
  and adding a cleanup option later.
- Should the normalization cache be shared across streams (same file normalized once ever)
  or scoped per stream? The current cache key (path + size + mtime) is already
  content-addressed, so the same file is never transcoded twice regardless of which stream
  uses it. No change needed.
- What is the correct behavior when the user stops the stream and starts a new one?
  The HLS output folder should be cleared, the normalization queue flushed, and a new
  FFmpeg process started. The `stop()` method on `FFmpegStreamService` handles this.
- What resolution should transcoded output target? For now, preserve the source resolution.
  Do not upscale or downscale. Add a quality settings page later.
