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

### Hardcoded default thresholds (v1)

The following defaults are intentionally hardcoded for the first production pass.
They should live in one constants module and be logged at startup.

#### A. Cadenced startup admission control

- `FIRST_ANCHOR_SAFETY_MARGIN_SEC = 120`
- `MIN_OPENING_BUFFER_SEC = 300` (5 minutes)
- `TARGET_OPENING_BUFFER_SEC = 900` (15 minutes when content is available)
- `MAX_OPENING_BUFFER_SEC = 1500` (25 minutes hard cap)
- `ANCHOR_SELECTION_LOOKAHEAD_COUNT = 12` candidates

Decision rule:

- `warmupWindowSec = requiredStart - now`
- Candidate passes if: `estimatedNormalizeSec <= warmupWindowSec - FIRST_ANCHOR_SAFETY_MARGIN_SEC`

Fallback order:

1. Try next anchor candidate (up to lookahead count).
2. Expand opening buffer up to `MAX_OPENING_BUFFER_SEC` and re-check first candidate.
3. If still failing, force fast-start mezzanine generation for selected anchor.
4. If stream is still not ready, show explicit "Preparing first anchor" state and delay start.

#### B. Normalization throughput assumptions for estimation

Use conservative defaults until runtime telemetry is collected.

- `REMUX_ESTIMATE_SEC = 5`
- `TRANSCODE_SPEED_SD_X = 6.0` (source seconds processed per wall-clock second)
- `TRANSCODE_SPEED_HD_X = 2.5`
- `TRANSCODE_SPEED_UHD_X = 0.8`
- `TRANSCODE_ESTIMATE_OVERHEAD_SEC = 20`

Estimate formula:

- `estimatedNormalizeSec = (durationSec / speedMultiplier) + TRANSCODE_ESTIMATE_OVERHEAD_SEC`

Where multiplier is selected by source height:

- `<= 576`: SD
- `577-1080`: HD
- `> 1080`: UHD

#### C. Cache size and eviction watermarks

- `CACHE_MAX_SIZE_GB = 300`
- `CACHE_SOFT_WATERMARK = 0.80` (start background cleanup)
- `CACHE_HARD_WATERMARK = 0.90` (aggressive cleanup)
- `CACHE_CRITICAL_WATERMARK = 0.95` (emergency cleanup)
- `CACHE_TARGET_AFTER_EVICT = 0.75`
- `MIN_FREE_DISK_GB = 20` (global drive protection)
- `EVICTION_BATCH_GB = 10` per pass

Drive protection rule:

- If free disk is below `MIN_FREE_DISK_GB`, skip non-essential writes and evict immediately
  down to `CACHE_TARGET_AFTER_EVICT`.

#### D. Tier windows and ranking defaults

- `PINNED_NOW_WINDOW_HOURS = 4`
- `PINNED_SOON_WINDOW_HOURS = 24`
- `WARM_RECENCY_DAYS = 14`
- `COLD_RECENCY_DAYS = 45`
- `REUSE_WINDOW_DAYS = 30`

Weighted rank defaults:

- `ageWeight = 1.0`
- `sizeWeight = 2.0`
- `reuseWeight = 3.0`
- `costWeight = 1.5`

Interpretation:

- Larger files are evicted sooner unless they are reused often or expensive to recreate.

#### E. Cadence drift realignment defaults

- `DRIFT_TOLERANCE_SEC = 3`
- `DRIFT_SOFT_CORRECTION_SEC = 12`
- `DRIFT_HARD_CORRECTION_SEC = 45`
- `MAX_FILLER_ADJUST_PER_BOUNDARY_SEC = 120`
- `REALIGNMENT_LOOKAHEAD_BLOCKS = 3`

Behavior:

- `abs(drift) <= 3`: no action
- `3 < abs(drift) <= 12`: micro-adjust with filler substitution
- `12 < abs(drift) <= 45`: active add/remove fillers over next 1-3 blocks
- `abs(drift) > 45`: force hard realignment at next safe boundary

Hard realignment action:

- Recompute upcoming fillers for next anchor boundary and rebuild those buffer slots only.

#### F. Two-tier trigger defaults (only for high-risk anchors)

Two-tier is enabled when all conditions below are true:

1. Cadenced stream
2. Anchor can appear in first 2 blocks
3. At least one "heavy" media condition:
   - `durationSec >= 7200` (2 hours), or
   - `videoHeight >= 2160`, or
   - source codec in `{hevc, vc1, mpeg2video, prores}`

Fast-start mezzanine profile defaults:

- Container: MP4
- Video codec: H.264
- Audio codec: AAC
- Resolution cap: 1920x1080
- Video preset: veryfast
- Video CRF: 22
- Audio bitrate: 160k

High-quality derivative defaults:

- Container: MP4
- Video codec: H.264
- Audio codec: AAC
- Preserve source resolution up to 2160p cap
- Video preset: medium
- Video CRF: 18
- Audio bitrate: 192k

Eviction preference under pressure:

- Evict high-quality derivative before mezzanine for the same source.

#### G. Non-cadenced stream defaults

- No first-anchor cadence gating.
- Still use cache tiers and watermarks.
- If first anchor is unnormalized, start normalization immediately and show progress UI.

#### H. Operational defaults

- `NORMALIZATION_WORKERS = 2`
- `MAX_IN_FLIGHT_PER_SOURCE = 1` (dedupe)
- `STATUS_LOG_INTERVAL_SEC = 30`
- `EVICTION_CHECK_INTERVAL_MIN = 10`
- `ADMISSION_RECHECK_INTERVAL_SEC = 15` while preparing startup

These values favor startup reliability and conservative disk safety over absolute quality.
Tune only after collecting real throughput and cache hit telemetry.

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

---

## Part 9: Next Implementation Sequence (Three Workstreams)

This section defines the exact order and execution plan for the next three workstreams.
We will implement them one at a time in the order listed below.

### Workstream 1 (First): Cadenced First-Anchor Readiness Admission Control

Objective:

- Prevent cadenced startup from selecting a first anchor that cannot be normalized before
  its required boundary.

Scope:

- Cadenced stream startup only.
- Initial first-anchor selection path only.
- No changes to uncadenced selection behavior.

Primary files:

- `src/electron/services/streamConstruction/continuousStreamBuilder.ts`
- `src/electron/services/streamConstruction/mediaSelector.ts`
- `src/electron/services/normalization/normalizationWorker.ts`
- `src/electron/services/normalization/normalizationDefaults.ts`

Implementation steps:

1. Add an admission helper that evaluates candidate anchors using:

- warmup window from now until required cadence start
- estimated normalization time from probe metadata and defaults

2. Extend first-anchor selection to evaluate up to
   `ANCHOR_SELECTION_LOOKAHEAD_COUNT` candidates.
3. Accept first candidate that satisfies:
   `estimatedNormalizeSec <= warmupWindowSec - FIRST_ANCHOR_SAFETY_MARGIN_SEC`.
4. If no candidate passes:

- expand opening buffer (up to `MAX_OPENING_BUFFER_SEC`) and retry once
- if still failing, flag startup as preparation-required and continue with explicit
  prepare-first-anchor state

5. Add startup logs with chosen candidate, estimate, warmup window, and fallback path.

Acceptance criteria:

- A 2-4 hour heavy movie is rejected as first cadenced anchor when warmup is too short.
- A shorter or already-normalized candidate is selected when available.
- If no candidate passes, stream enters clear preparation mode rather than silent stall.
- Uncadenced startup behavior remains unchanged.

Validation:

- Unit tests for admission pass/fail decisions.
- Manual scenario tests at near-boundary starts (for example 3:55 to 4:00 cadence).

### Workstream 2 (Second): Cadence Drift Realignment Monitor and Corrector

Objective:

- Keep cadence parity near boundaries by adjusting upcoming filler organically when drift
  exceeds tolerance.

Scope:

- Continuous and adhoc cadenced streams.
- Correction applied only to upcoming filler windows (never mutate currently playing media).

Primary files:

- `src/electron/services/backgroundService.ts`
- `src/electron/services/streamManager.ts`
- `src/electron/services/bufferConstructor.ts`
- `src/electron/services/streamConstruction/continuousStreamBuilder.ts`

Implementation steps:

1. Add drift computation at boundary checkpoints:
   `driftSec = actualBoundaryTime - targetBoundaryTime`.
2. Add tolerance and correction levels:

- no-op inside `DRIFT_TOLERANCE_SEC`
- soft correction inside `DRIFT_SOFT_CORRECTION_SEC`
- hard correction beyond `DRIFT_HARD_CORRECTION_SEC`

3. Implement soft correction by swapping upcoming fillers with duration-near alternatives.
4. Implement hard correction by rebuilding next filler window up to
   `MAX_FILLER_ADJUST_PER_BOUNDARY_SEC`.
5. Restrict correction horizon to `REALIGNMENT_LOOKAHEAD_BLOCKS`.
6. Emit logs that include pre-drift, action type, and post-correction residual.

Acceptance criteria:

- Drift remains inside tolerance in normal operation after correction pass.
- Correction never removes the currently playing item.
- Correction never changes anchor order; only filler is adjusted.
- No destabilizing oscillation across successive checkpoints.

Validation:

- Simulation tests with injected duration errors.
- Multi-cycle manual run validating stable correction over several hours.

### Workstream 3 (Third): Normalization and Cache Status Exposure via IPC

Objective:

- Surface real-time normalization and cache state to renderer so startup status and
  operational visibility are explicit.

Scope:

- Main-process status provider and renderer consumer.
- Read-only status reporting in this phase (no control commands yet).

Primary files:

- `src/electron/main.ts`
- `src/electron/preload.cts`
- `types.d.ts`
- `src/electron/services/normalization/normalizationQueue.ts`
- `src/ui/screens/Player/View/Player.viewmodel.ts`
- `src/ui/screens/Home/View/Home.view.tsx`

Implementation steps:

1. Add queue status DTO from normalization service:

- queuedCount, activeCount, normalizedCount, failedCount
- recent failures summary

2. Add cache status DTO:

- totalBytes, maxBytes, usageRatio, freeDiskBytes
- last eviction result (count/bytes)

3. Add new IPC handler to fetch combined status snapshot.
4. Expose the handler through preload and type declarations.
5. Render status in Player and Home:

- preparing, warming, ready, degraded states
- optional inline warning for high cache pressure

Acceptance criteria:

- Renderer can request and display normalization/cache status without polling errors.
- Startup state clearly indicates whether stream is preparing first anchor.
- Cache pressure state is visible before failures occur.

Validation:

- Type-safe IPC compile checks.
- Manual UI verification under normal load and forced failure scenarios.

### Delivery order and stop points

Execution order:

1. Workstream 1
2. Workstream 2
3. Workstream 3

After each workstream:

- Run `npm run transpile:electron`
- Run `npm run build`
- Capture a short verification note before moving to the next workstream

---

## Part 10: Manual Regression Checklist

Use this checklist after major stream, normalization, or playout changes.

### A. Startup Admission Checks

1. Start a cadenced stream near a boundary (for example, 3:55 local time).
2. Verify first-anchor admission log appears with warmup and estimate values.
3. Verify a heavy first candidate is skipped when estimate exceeds warmup budget.
4. Verify selected first anchor starts without blocking UI thread.
5. Verify uncadenced startup still begins immediately with no cadence gating behavior.

Expected result:

- Cadenced startup chooses a first anchor that fits warmup budget, or marks preparation-required explicitly.

### B. Normalization Queue and Cache Checks

1. Import one item each of movie, show, commercial, short, music, promo, and bumper.
2. Confirm ingest-time normalization jobs are enqueued.
3. Start a stream and confirm stream-time enqueue also runs for relevant blocks.
4. Confirm queue snapshot reflects active, queued, and normalized counts.
5. Confirm cache usage ratio updates and eviction runs near watermark.

Expected result:

- Queue counts and cache metrics evolve predictably; no duplicate transcoding for the same source in one session.

### C. Cadence Realignment Checks

1. Run a cadenced stream long enough to cross multiple boundaries.
2. Confirm realignment logs appear only when drift exceeds tolerance.
3. Verify corrections affect Upcoming filler only (never currently playing anchor).
4. Verify anchor order remains unchanged after correction.
5. Verify post-correction drift trends toward tolerance range.

Expected result:

- Soft/hard correction keeps cadence stable without destabilizing the queue.

### D. UI Status Checks (Home and Player)

1. Open Home and verify normalization status label renders.
2. Open Player and verify normalization status label updates while queue activity changes.
3. Simulate normalization failures (invalid media path) and verify degraded status appears.
4. Simulate cache pressure and verify elevated/high pressure language appears.
5. Verify UI remains functional if status endpoint is temporarily unavailable.

Expected result:

- Home and Player both present clear preparing/warming/ready/degraded states.

### E. Stop/Restart and Persistence Checks

1. Start stream, then stop stream, then start again.
2. Verify queue/cache status snapshots remain valid after restart.
3. Restart app and start stream again.
4. Verify previously normalized files are reused from disk cache.
5. Verify no crash or dead queue state after restart.

Expected result:

- Disk cache reuse works across app restarts and startup remains predictable.

---

## Part 11: Planned Startup Cache Rotation (Design Only, Not Implemented)

Goal:

- Keep at least one cache-ready anchor candidate available for every supported
  facet genre/aesthetic combination so stream startup can respond quickly,
  including future taxonomy-filtered launches.

Scope for future implementation:

1. Build and maintain a "startup readiness roster" keyed by facet pair:
   `genreTagId + aestheticTagId`.
2. For each facet pair, ensure at least one normalized/playable candidate is
   present in disk cache and metadata index.
3. If multiple candidates exist for a facet pair, rotate them with a fair policy
   (round-robin with cooldown) so startup does not always pick the same item.
4. Add optional readiness dimensions for future taxonomy filters:
   allow-list/deny-list presets should map to at least one ready startup anchor
   where feasible.
5. Expose readiness diagnostics in normalization status:
   covered pairs, missing pairs, and stale pairs (missing playable cache file).

Selection behavior target:

- On stream start, when filter context is known, first-anchor selection checks
  readiness roster first and chooses a ready candidate from the matching facet
  set; if several are valid, pick next in rotation.
- If no ready candidate exists for that scope, fall back to normal media
  selection and mark startup as preparation-required.

Operational policy target:

- Run a low-priority background maintainer loop that refreshes missing/stale
  facet coverage opportunistically without interfering with near-term playback
  prewarm jobs.

Non-goal for this phase:

- No schema, queue policy, or selection logic changes are implemented in this
  document section. This is a roadmap item only.

---

## Part 12: Universal Receiver Bootstrap Coverage Prewarm (Design)

Goal:

- Guarantee fast first-anchor startup for non-embedded targets (Plex, Jellyfin,
  and native in-app player) by maintaining a small pre-transcoded bootstrap pool
  that covers startup contexts across genre/aesthetic tags.

### 12.1 Why this is needed

Current first-anchor admission improves startup by preferring cached-ready
candidates, but it is still opportunistic. A universal receiver model needs a
deterministic readiness layer where startup candidates are deliberately selected,
prepared, and rotated.

Target outcome:

- Startup chooses randomly from a pool that is already playable for the active
  output target profile.
- Pool coverage ensures each represented startup tag-space can be entered
  without a cold transcode.

### 12.2 Coverage model (tag-driven)

Coverage dimensions in scope now:

- Genre tags
- Aesthetic tags

A candidate anchor (movie or episode) may satisfy multiple tags at once.
If one item contains several genre/aesthetic tags, all of those tags are marked
as covered by that single item.

Coverage set definition:

- Only include tags that are attached to at least one anchor candidate
  (movie or episode).
- Do not require coverage for orphan tags that are not attached to anchor media.

### 12.3 Bootstrap pool construction algorithm

High-level algorithm:

1. Build `uncoveredTags` = all represented genre/aesthetic tags attached to at
   least one movie or episode.
2. While `uncoveredTags` is not empty:
   - Pick the first unrepresented tag.
   - Randomly select one eligible movie/episode that contains that tag.
   - Add selected media to bootstrap pool.
   - Remove all tags on that media from `uncoveredTags`.
3. Stop when all represented tags are covered.

Properties:

- Randomized selection produces variety across recomputes.
- Multi-tag items naturally reduce pool size and transcode load.
- Pool can be rebuilt with a deterministic seed later if reproducibility is needed.

### 12.4 Represented-tag tracking in data layer

Requirement:

- System must know whether a tag is associated with any movie or episode.

Two implementation options:

Option A (recommended initially): derived query at recompute time

- Compute represented tags from junction tables (`movie_tags`, `episode_tags`)
  when bootstrap planner runs.
- Advantages: no write-time coupling, no counter drift risk.

Option B (future optimization): denormalized counters/flags on tags

- Add fields such as `anchorAssociationCount` or `hasAnchorAssociation`.
- Update on media create/update/delete tag operations.
- Requires strict update discipline and repair tooling.

Recommendation:

- Start with Option A to keep correctness simple.
- Move to Option B only if planner query cost is proven problematic.

### 12.5 Playback target scope (fixed at 3)

Active target profiles:

1. Native in-app player
2. Plex
3. Jellyfin

Planner/queue implications:

- For each bootstrap anchor, prewarm up to 3 output variants (one per profile)
  as required by profile compatibility.
- Shared variants should be reused if two profiles are equivalent.

### 12.6 Recompute and invalidation strategy

Recompute triggers:

- Tag association changes on movies/episodes (create/update/delete)
- Movie/episode create/delete
- Playback profile changes
- Manual "Rebuild Bootstrap Pool" action

Recompute behavior:

- Build a new candidate pool in memory first.
- Diff old vs new pool.
- Queue only missing/stale variants for prewarm.
- Retain still-valid prepared variants to minimize re-transcode work.

Expected effect:

- Multi-tag anchors reduce churn because one item can continue covering many tags
  after content changes.

### 12.7 Rotation policy

Requirement:

- Rotate bootstrap pool usage after stream start so startup does not repeatedly
  pick the same first anchor.

Policy:

- Maintain `lastUsedAt` per bootstrap candidate.
- Enforce cooldown window `X` after stream start (configurable).
- Startup selection picks randomly among candidates not in cooldown.
- If all are in cooldown, select least recently used candidate.

Suggested initial defaults:

- `X = 6 hours` for daily household usage patterns.
- Profile-specific rotation state (same media can be recent for Plex but not
  necessarily for native, if needed later).

### 12.8 Startup selection contract

At stream start:

1. Determine requested playback target profile.
2. Query bootstrap pool candidates that are:
   - coverage-valid,
   - prewarmed for that profile,
   - not in cooldown (or best fallback if all in cooldown).
3. Randomly select from eligible set.
4. If no eligible candidate exists, fall back to existing first-anchor admission
   and mark startup as preparation-required.

### 12.9 New status surfaces to expose

Expose separate diagnostics to support startup warnings and operations:

- Represented tags count (genre/aesthetic)
- Covered tags count (genre/aesthetic)
- Missing tags list
- Bootstrap pool size
- Ready variants per profile (native/plex/jellyfin)
- Rotation cooldown pressure (eligible vs cooled-down)
- Last recompute timestamp and duration

### 12.10 Phase implementation roadmap

Phase A: Planner + coverage metadata

- Build represented-tag query and coverage planner.
- Persist bootstrap pool records and tag coverage mapping.

Phase B: Multi-profile prewarm queue integration

- Add profile-aware prewarm jobs.
- Reuse existing normalization pipeline where possible.

Phase C: Startup selector + rotation

- Integrate bootstrap-first selector in first-anchor admission.
- Add cooldown/rotation state updates on stream start.

Phase D: Recompute/invalidation + diagnostics

- Hook media/tag mutation paths to schedule pool recompute.
- Add status endpoints/UI indicators.

Open design items (deferred):

- Exact query/performance thresholds for Option A vs Option B tag tracking
- Final default cooldown `X`
- Whether per-profile rotation state is necessary in v1

---

## Part 13: Bootstrap Prewarm Implementation Spec (Schema + Contracts)

This section turns Part 12 into concrete implementation contracts so coding can
start immediately.

### 13.1 Data model (SQLite schema)

#### 13.1.1 Playback profile enum

Use text values in SQLite:

- `native`
- `plex`
- `jellyfin`

#### 13.1.2 Tables

Table: `bootstrap_pool_items`

Purpose:

- Stores each selected bootstrap anchor candidate (movie or episode) and
  rotation metadata.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `poolItemId TEXT UNIQUE NOT NULL` (UUID)
- `mediaItemId TEXT NOT NULL`
- `mediaType TEXT NOT NULL` (`Movie` or `Episode`)
- `selectionSeed INTEGER NULL` (optional deterministic rebuild seed)
- `lastUsedAt INTEGER NULL` (unix seconds)
- `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`
- `updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP`

Indexes:

- `UNIQUE(mediaItemId, mediaType)`
- `INDEX idx_bootstrap_pool_last_used(lastUsedAt)`

Table: `bootstrap_pool_item_tags`

Purpose:

- Many-to-many mapping from pool item to the tags it covers.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `poolItemId TEXT NOT NULL`
- `tagId TEXT NOT NULL`
- `tagType TEXT NOT NULL` (`Genre` or `Aesthetic`)
- `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`

Indexes/constraints:

- `UNIQUE(poolItemId, tagId)`
- `INDEX idx_bootstrap_item_tags_tag(tagId, tagType)`

FKs:

- `poolItemId -> bootstrap_pool_items(poolItemId) ON DELETE CASCADE`
- `tagId -> tags(tagId) ON DELETE CASCADE`

Table: `bootstrap_profile_variants`

Purpose:

- Stores target-profile prewarmed path for each pool item.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `variantId TEXT UNIQUE NOT NULL` (UUID)
- `poolItemId TEXT NOT NULL`
- `profile TEXT NOT NULL` (`native|plex|jellyfin`)
- `playablePath TEXT NOT NULL`
- `cacheKey TEXT NULL`
- `isReady INTEGER NOT NULL DEFAULT 0`
- `isStale INTEGER NOT NULL DEFAULT 0`
- `lastPreparedAt INTEGER NULL` (unix seconds)
- `lastValidationAt INTEGER NULL` (unix seconds)
- `lastError TEXT NULL`
- `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`
- `updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP`

Indexes/constraints:

- `UNIQUE(poolItemId, profile)`
- `INDEX idx_bootstrap_variants_profile_ready(profile, isReady, isStale)`

FKs:

- `poolItemId -> bootstrap_pool_items(poolItemId) ON DELETE CASCADE`

Table: `bootstrap_coverage_runs`

Purpose:

- Tracks each planner/recompute run for diagnostics and UI status.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `runId TEXT UNIQUE NOT NULL` (UUID)
- `startedAt INTEGER NOT NULL` (unix seconds)
- `completedAt INTEGER NULL` (unix seconds)
- `durationMs INTEGER NULL`
- `representedTagCount INTEGER NOT NULL DEFAULT 0`
- `coveredTagCount INTEGER NOT NULL DEFAULT 0`
- `missingTagCount INTEGER NOT NULL DEFAULT 0`
- `selectedItemCount INTEGER NOT NULL DEFAULT 0`
- `queuedVariantJobs INTEGER NOT NULL DEFAULT 0`
- `status TEXT NOT NULL` (`running|completed|failed`)
- `errorMessage TEXT NULL`

Index:

- `INDEX idx_bootstrap_runs_started(startedAt DESC)`

Table: `bootstrap_missing_tags`

Purpose:

- Snapshot of missing tags produced by the latest completed run.

Columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `runId TEXT NOT NULL`
- `tagId TEXT NOT NULL`
- `tagType TEXT NOT NULL`
- `reason TEXT NOT NULL` (`no_anchor_association|no_ready_variant|excluded`)
- `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`

Indexes/constraints:

- `UNIQUE(runId, tagId)`
- `INDEX idx_bootstrap_missing_tag(tagId, tagType)`

FKs:

- `runId -> bootstrap_coverage_runs(runId) ON DELETE CASCADE`

### 13.2 Query contracts (derived represented tags)

Keep represented-tag detection as derived query in v1.

Represented tags query:

```sql
SELECT DISTINCT t.tagId, t.type
FROM tags t
WHERE t.type IN ('Genre', 'Aesthetic')
  AND (
    EXISTS (
      SELECT 1 FROM movie_tags mt
      JOIN movies m ON m.mediaItemId = mt.mediaItemId
      WHERE mt.tagId = t.tagId
    )
    OR EXISTS (
      SELECT 1 FROM episode_tags et
      JOIN episodes e ON e.mediaItemId = et.mediaItemId
      WHERE et.tagId = t.tagId
    )
  )
ORDER BY t.type, t.tagId;
```

Eligible anchors by tag query contract:

- Input: `tagId`, optional `excludedMediaIds[]`
- Output rows: `mediaItemId`, `mediaType`, `duration`, `durationLimit`, `path`

Supported via `UNION ALL` of movies + episodes and randomized ordering.

### 13.3 Repository contracts

New file target:

- `src/electron/repositories/bootstrapPoolRepository.ts`

Interface:

```ts
export interface BootstrapPoolRepository {
  beginCoverageRun(): { runId: string; startedAt: number };
  completeCoverageRun(input: {
    runId: string;
    completedAt: number;
    durationMs: number;
    representedTagCount: number;
    coveredTagCount: number;
    missingTagCount: number;
    selectedItemCount: number;
    queuedVariantJobs: number;
  }): void;
  failCoverageRun(runId: string, errorMessage: string): void;

  clearPool(): void;
  upsertPoolItem(input: {
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
  }): void;
  replacePoolItemTags(
    poolItemId: string,
    tags: Array<{ tagId: string; tagType: "Genre" | "Aesthetic" }>,
  ): void;

  upsertProfileVariant(input: {
    poolItemId: string;
    profile: "native" | "plex" | "jellyfin";
    playablePath: string;
    cacheKey?: string | null;
    isReady: boolean;
    isStale: boolean;
    lastPreparedAt?: number | null;
    lastValidationAt?: number | null;
    lastError?: string | null;
  }): void;

  setLastUsedAt(poolItemId: string, unixSeconds: number): void;

  replaceMissingTags(
    runId: string,
    missing: Array<{
      tagId: string;
      tagType: "Genre" | "Aesthetic";
      reason: "no_anchor_association" | "no_ready_variant" | "excluded";
    }>,
  ): void;

  findRepresentedTags(): Array<{
    tagId: string;
    tagType: "Genre" | "Aesthetic";
  }>;
  findRandomEligibleAnchorByTag(input: {
    tagId: string;
    excludedMediaItemIds: string[];
  }): {
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    tags: Tag[];
    path: string;
    duration: number;
    durationLimit: number;
  } | null;

  findStartupCandidates(input: {
    profile: "native" | "plex" | "jellyfin";
    cooldownSeconds: number;
    now: number;
  }): Array<{
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    playablePath: string;
    lastUsedAt: number | null;
  }>;

  getLatestCoverageSnapshot(): {
    runId: string;
    representedTagCount: number;
    coveredTagCount: number;
    missingTagCount: number;
    selectedItemCount: number;
    queuedVariantJobs: number;
    status: "running" | "completed" | "failed";
    startedAt: number;
    completedAt: number | null;
  } | null;
}
```

### 13.4 Service contracts

New service 1:

- `src/electron/services/bootstrap/bootstrapCoveragePlannerService.ts`

Responsibilities:

- Build represented tag set.
- Construct pool with the uncovered-tag algorithm.
- Persist pool and coverage-run metrics.
- Produce profile prewarm job list.

Contract:

```ts
export type BootstrapCoveragePlanResult = {
  runId: string;
  representedTags: number;
  coveredTags: number;
  missingTags: Array<{
    tagId: string;
    tagType: "Genre" | "Aesthetic";
    reason: string;
  }>;
  selectedPoolItems: number;
  queuedVariantJobs: number;
  durationMs: number;
};

export async function rebuildBootstrapCoveragePool(input?: {
  profiles?: Array<"native" | "plex" | "jellyfin">;
  seed?: number;
}): Promise<BootstrapCoveragePlanResult>;
```

New service 2:

- `src/electron/services/bootstrap/bootstrapVariantPrewarmService.ts`

Responsibilities:

- Convert planner output into normalization/prewarm jobs per profile.
- Reuse existing normalized outputs when compatible.

Contract:

```ts
export async function prewarmBootstrapVariants(input: {
  runId: string;
  profiles: Array<"native" | "plex" | "jellyfin">;
}): Promise<{ queued: number; reused: number; failed: number }>;
```

New service 3:

- `src/electron/services/bootstrap/bootstrapFirstAnchorSelector.ts`

Responsibilities:

- Return random candidate from ready pool for requested profile.
- Enforce cooldown and update `lastUsedAt` on selection.

Contract:

```ts
export async function selectBootstrapFirstAnchor(input: {
  profile: "native" | "plex" | "jellyfin";
  now: number;
  cooldownSeconds: number;
}): Promise<{
  media: Movie | Episode;
  playablePath: string;
  poolItemId: string;
} | null>;
```

### 13.5 Integration points with existing startup flow

Integration order in first-anchor admission:

1. Try bootstrap selector for target profile.
2. If bootstrap candidate found, return immediately.
3. Else run existing admission path:
   - uncadenced cached-first logic
   - cadenced warmup-budget logic

Files to integrate:

- `src/electron/services/streamConstruction/firstAnchorAdmissionService.ts`
- `src/electron/services/streamService.ts` (optional lazy-trigger recompute)

### 13.6 IPC/API contracts (Electron)

Add IPC handlers:

- `rebuildBootstrapCoveragePool`
- `getBootstrapCoverageStatus`
- `getBootstrapMissingTags`
- `getBootstrapProfileReadiness`
- `setBootstrapRotationCooldown`

Type contracts in renderer:

```ts
type BootstrapCoverageStatus = {
  runId: string | null;
  status: "idle" | "running" | "completed" | "failed";
  representedTags: number;
  coveredTags: number;
  missingTags: number;
  selectedPoolItems: number;
  readyByProfile: {
    native: number;
    plex: number;
    jellyfin: number;
  };
  lastStartedAt: number | null;
  lastCompletedAt: number | null;
  lastError: string | null;
};
```

### 13.7 Config defaults

New defaults in normalization/bootstrap settings:

- `BOOTSTRAP_PROFILES = ["native", "plex", "jellyfin"]`
- `BOOTSTRAP_ROTATION_COOLDOWN_SECONDS = 21600` (6h)
- `BOOTSTRAP_REBUILD_DEBOUNCE_MS = 2000`
- `BOOTSTRAP_MAX_REBUILD_CONCURRENCY = 1`

### 13.8 Migration and rollout order

1. Add schema migrations and repository with no runtime wiring.
2. Implement planner service + manual IPC trigger.
3. Implement prewarm service and store profile readiness.
4. Add first-anchor bootstrap selector behind feature flag.
5. Enable by default after readiness metrics stabilize.

Feature flags:

- `ENABLE_BOOTSTRAP_COVERAGE_POOL` (default false during rollout)
- `ENABLE_BOOTSTRAP_SELECTOR` (default false until prewarm stable)

### 13.9 Acceptance criteria (implementation-ready)

1. Rebuild run computes represented tags from anchor associations only.
2. Pool covers all represented tags unless no eligible anchors exist.
3. Each selected pool item stores covered tag mapping.
4. Ready variants are tracked independently for native/plex/jellyfin.
5. Startup uses bootstrap selector first and records `lastUsedAt`.
6. Cooldown rotation prevents immediate repetitive first-anchor picks.
7. Diagnostics expose represented vs covered vs missing counts.
8. Fallback startup path remains functional if bootstrap is empty or stale.

---

## Part 14: Local Native Player Plan (VLC-like Local Playback)

Goal:

- Make local playback "just work" for nearly all files by using a native decoder
  backend (mpv or libVLC) instead of Chromium `<video>` for local mode.
- Keep profile/prewarm/transcode strategy for remote streaming targets.

### 14.1 Product behavior target

Local mode:

- Plays original media files directly whenever possible.
- Avoids startup transcode waits for local in-house playback.
- Uses existing stream construction (`MediaBlock[]`) unchanged.

Remote mode (Plex/Jellyfin/etc):

- Continues to use profile-aware prewarm and stream output pipeline.

### 14.2 Player abstraction layer

Create a unified backend interface so stream logic is player-agnostic.

New interface file:

- `src/electron/services/player/backends/IPlaybackBackend.ts`

```ts
export interface PlaybackBackend {
  readonly id: "electron" | "mpv" | "vlc" | "stream-output";

  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  enqueueBlock(block: MediaBlock): Promise<void>;
  replaceQueue(blocks: MediaBlock[]): Promise<void>;

  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  selectIndex(index: number): Promise<void>;

  getStateSnapshot(): Promise<ElectronPlayerState>;
}
```

Existing `playerManager.ts` becomes an orchestrator/facade:

- Chooses active backend based on configured playback mode.
- Keeps current IPC API stable for UI.

### 14.3 Backend adapters

#### A. Electron backend (existing)

- Wrap current queue implementation in interface adapter.
- Keeps backward compatibility and test harness behavior.

#### B. mpv backend (new, recommended first)

New files:

- `src/electron/services/player/backends/mpvBackend.ts`
- `src/electron/services/player/mpv/mpvProcess.ts`
- `src/electron/services/player/mpv/mpvIpc.ts`

Design:

- Spawn bundled `mpv.exe` as subprocess.
- Control through JSON IPC socket (`--input-ipc-server=...`).
- Use commands: `loadfile`, `playlist-next`, `playlist-prev`, `set_property`,
  `get_property`.

Initial mpv startup args (draft):

- `--idle=yes`
- `--force-window=yes`
- `--keep-open=yes`
- `--input-ipc-server=<pipe-or-socket-path>`
- `--hwdec=auto`

Queue behavior:

- First item via `loadfile <path> replace`.
- Next items via `loadfile <path> append-play`.
- For block-level context, flatten block to ordered files exactly as current
  queue logic does.

#### C. libVLC backend (optional later)

- Keep as v2 option if mpv packaging/control becomes problematic.
- Same `PlaybackBackend` contract allows swapping implementation.

### 14.4 Backend selection and config

New config keys:

- `LOCAL_PLAYBACK_BACKEND = "mpv" | "electron"` (default `mpv` once stable)
- `REMOTE_PLAYBACK_BACKEND = "stream-output"`
- `MPV_BINARY_PATH` optional override (dev/debug)

Selection policy:

- If stream target is local display: use `LOCAL_PLAYBACK_BACKEND`.
- If stream target is remote receiver: use stream-output backend.

### 14.5 Lifecycle and teardown design

Requirements:

- Backend must be fully stoppable on window close and app quit.
- No orphan child processes.

Lifecycle sequence:

1. App start: initialize selected backend.
2. Stream start: pass first block(s), call `play()`.
3. Stream stop: call backend `stop()`, clear queue state.
4. App shutdown: call backend `shutdown()`; kill child process if graceful
   stop timeout exceeded.

Timeout policy (draft):

- Graceful stop timeout: 2000ms
- Force kill timeout: +1000ms

### 14.6 Failure handling and fallback

Failure classes:

- Backend init failure (binary missing, socket failure)
- Runtime command failure (queue op fails)
- Process crash during playback

Fallback policy:

1. Attempt backend restart once.
2. If restart fails, fallback to Electron backend (existing).
3. Surface degraded-mode warning in UI and logs.

Do not block stream construction on backend failure; only playback surface
degrades.

### 14.7 UI and state contracts

State additions:

- Active backend id
- Backend health (`healthy|degraded|failed`)
- Last backend error message/time

IPC additions:

- `getPlaybackBackendStatus`
- `setPlaybackBackendPreference`
- `restartPlaybackBackend`

No breaking changes to existing player controls expected.

### 14.8 Packaging and distribution

Windows initial scope:

- Bundle `mpv.exe` and required DLLs under app resources.
- Resolve path via `process.resourcesPath` in production.

Dev mode:

- Allow external `mpv` from env/path for rapid iteration.

Future:

- Add macOS/Linux bundled binaries if/when cross-platform local native playback
  is required.

### 14.9 Security and stability notes

- Never pass unsanitized user input into process args.
- Use strict argument arrays (no shell interpolation).
- Validate file existence before enqueue.
- Watchdog child process exit events and clear stale IPC handles.

### 14.10 Implementation phases

Phase 1: Abstraction scaffold

- Add `PlaybackBackend` interface.
- Wrap existing Electron backend.
- Keep behavior unchanged.

Phase 2: mpv backend MVP

- Spawn mpv, append queue items, play/next/prev/stop support.
- Basic state snapshot bridge.

Phase 3: Lifecycle hardening

- Graceful shutdown and force-kill fallback.
- Crash restart + backend fallback policy.

Phase 4: UI/backend status

- Add backend status indicators and manual restart action.

Phase 5: Default switch

- Set local default backend to mpv after soak testing.

### 14.11 Acceptance criteria

1. Local playback starts without transcoding for legacy AVI/MKV test files.
2. Queue transitions are gapless or near-gapless across buffer + anchor files.
3. Closing app leaves no orphan mpv process.
4. Backend crash recovers or falls back automatically.
5. Remote streaming mode remains unchanged and functional.
6. Existing player UI controls continue to work through backend abstraction.
