# Memory Leak Analysis - Continuous TV Channel Application

## Critical Issues Found

### 1. **FFmpegMediaPlayer - Event Listener Accumulation** ⚠️ CRITICAL

**Location**: `ffmpegMediaPlayer.ts` - `playCurrentMedia()` method

**Problem**:

```typescript
this.ffmpegProcess.stdout?.on('data', data => {
  console.log(`FFmpeg stdout: ${data}`);
});

this.ffmpegProcess.stderr?.on('data', data => {
  console.log(`FFmpeg stderr: ${data}`);
});

this.ffmpegProcess.on('close', async code => {
  /* ... */
});
this.ffmpegProcess.on('error', error => {
  /* ... */
});
```

Every time a new media file plays, new event listeners are attached but **old ones are never removed**. Over a continuous 24/7 stream:

- ~86,400 media changes per day
- Each change = 4 new event listeners
- After a week: 2.4M+ orphaned event listeners
- Memory grows unbounded until crash

**Impact**: 💥 **Application crash within days**

### 2. **FFmpegMediaPlayer - Queue Growth Without Cleanup** ⚠️ HIGH

**Problem**:

```typescript
async addToQueue(filePath: string): Promise<void> {
  console.log(`Adding to FFmpeg queue: ${filePath}`);
  this.queue.push(filePath);
}
```

The `queue` array only grows. It's never trimmed, even after items are played:

- If streamManager adds 2 items every 5 minutes
- After 7 days: 4,032 items in queue
- Each is a string reference in memory
- Plus the metadata attached

**Impact**: 📈 **Memory slowly accumulates**

### 3. **FFmpegMediaPlayer - No Resource Cleanup on Error** ⚠️ HIGH

**Problem**:
If FFmpeg process fails or exits unexpectedly:

```typescript
this.ffmpegProcess.on('error', error => {
  console.error('FFmpeg process error:', error);
  // No cleanup! References remain!
});
```

Failed processes aren't cleaned up. Listeners still attached to dead processes.

**Impact**: 💧 **Memory leak on any playback error**

### 4. **VLCMediaPlayer - VLC Client Socket Leak** ⚠️ MEDIUM

**Problem**:

```typescript
async initialize(password: string = ''): Promise<void> {
  const client = this.initializeVLCClient(password);
  // ... code ...
  this.vlcClient = client;
}
```

VLC client maintains HTTP connections. With many `isConnected()` calls in a monitoring loop, if the connection isn't properly closed between calls, sockets accumulate.

**Impact**: 📊 **Slow growth over hours/days**

### 5. **VLCMediaPlayer - Exception on Repeated initialize()** ⚠️ MEDIUM

**Problem**:
If `initialize()` is called multiple times without cleanup, new clients are created but old ones aren't closed.

**Impact**: 🔗 **Socket/connection accumulation**

### 6. **FFmpegMediaPlayer - Console Logging** ⚠️ MEDIUM

**Problem**:

```typescript
this.ffmpegProcess.stdout?.on('data', data => {
  console.log(`FFmpeg stdout: ${data}`); // Large buffers logged repeatedly
});
```

Every byte of FFmpeg output is logged. FFmpeg outputs ~0.5-2MB per minute of media.

- 24/7 streaming = 720-2880 MB logged per day
- Logs accumulate in memory/files
- Old log buffers not garbage collected properly

**Impact**: 📝 **Significant memory pressure**

## Severity Summary

| Issue                        | Severity    | Impact                 | Timeline     |
| ---------------------------- | ----------- | ---------------------- | ------------ |
| Event listener accumulation  | 🔴 CRITICAL | OOM crash              | Days         |
| Queue growth without cleanup | 🟠 HIGH     | Gradual memory growth  | Weeks        |
| No error cleanup             | 🟠 HIGH     | Faster crash on errors | Days-Hours   |
| VLC socket leaks             | 🟡 MEDIUM   | Gradual growth         | Weeks-Months |
| Re-initialization leaks      | 🟡 MEDIUM   | Depends on usage       | Variable     |
| Console logging              | 🟡 MEDIUM   | Pressure on memory     | Weeks        |

## Required Fixes

All issues require implementation of proper resource cleanup and listener management.
