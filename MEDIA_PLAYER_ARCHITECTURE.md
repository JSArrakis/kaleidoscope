# Media Player Architecture Documentation

## Overview

This architecture provides a modularized, abstraction-based approach to media streaming that allows seamless switching between VLC and FFmpeg backends. VLC's constraints serve as the baseline, ensuring all implementations are constrained by the same limitations for predictability and consistency.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│         Application Code (streamManager, controllers)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Uses
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              MediaPlayerFactory                              │
│  - Creates & manages player instances                        │
│  - Handles backend switching                                 │
│  - Provides singleton access                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ Creates
                   ┌───────┴────────┐
                   ▼                ▼
        ┌────────────────────┐ ┌─────────────────┐
        │ IMediaPlayer       │ │ IMediaPlayer    │
        │ (Interface)        │ │ (Interface)     │
        └────────────────────┘ └─────────────────┘
                   ▲                ▲
                   │                │
        ┌──────────┴────────┐ ┌─────┴──────────────┐
        │                   │ │                    │
        ▼                   ▼ ▼                    ▼
    ┌──────────┐      ┌──────────────┐
    │   VLC    │      │   FFmpeg     │
    │ Service  │      │   Service    │
    └──────────┘      └──────────────┘
```

## Component Descriptions

### 1. **IMediaPlayer Interface** (`services/interfaces/mediaPlayerInterface.ts`)

Defines the contract that all media player implementations must follow:

```typescript
// Core Methods
- initialize(password?: string): Prepare the player
- isConnected(): Check if player is ready
- cleanup(): Clean up resources

// Playback Control
- play(): Start playback
- stop(): Stop playback
- pause(): Pause playback
- resume(): Resume from pause

// Queue Management
- addToQueue(filePath): Add single file
- addMediaBlockToQueue(mediaBlock): Add media block (feature + buffers)
- getQueueInfo(): Get queue status
- clearQueue(): Clear all queued items

// Status Monitoring
- getStatus(): Get playback status
- getInfo(): Get detailed player info
```

### 2. **VLCMediaPlayer** (`services/vlcMediaPlayer.ts`)

- Implements IMediaPlayer for VLC backend
- Wraps existing VLC client library
- Uses HTTP API to control VLC
- Maintains VLC's queue-based model
- Constraints:
  - Playlist-based (items queued and played sequentially)
  - VLC handles timing and transitions
  - Can queue items dynamically

### 3. **FFmpegMediaPlayer** (`services/ffmpegMediaPlayer.ts`)

- Implements IMediaPlayer for FFmpeg backend
- **Constrained to match VLC's behavior** for consistency
- Maintains an internal queue (adapting FFmpeg to VLC's model)
- Spawns FFmpeg processes sequentially for each queued item
- Key differences from native FFmpeg:
  - Doesn't use native concat protocol (which is more efficient)
  - Instead: processes one file at a time, then spawns next
  - This aligns with VLC's sequential model and Kaleidoscope's procedural selection

### 4. **MediaPlayerFactory** (`services/mediaPlayerFactory.ts`)

- Factory pattern for creating/switching players
- Singleton instance manages current active player
- Handles initialization and cleanup
- Provides convenience functions
- Usage:
  ```typescript
  const factory = MediaPlayerFactory.getInstance();
  const player = await factory.createPlayer(MediaPlayerBackend.VLC, {
    password: 'mypass',
  });
  ```

## VLC as the Baseline Constraint

### Why VLC's Model is the Denominator

1. **Predictable Behavior**: VLC's queue model is simple and deterministic
2. **Timing Predictability**: Items play sequentially; timing is known in advance
3. **Procedural Alignment**: Kaleidoscope's procedural media selection needs to know:
   - Exact duration of current media
   - When to request next media
   - Whether to add buffers or features next
4. **Adaptation Strategy**: FFmpeg is adapted to work within VLC's constraints rather than forcing VLC to adopt FFmpeg's model

### How FFmpeg is Constrained

```
FFmpeg Native Approach (More Efficient):
─────────────────────────────────────
Create manifest of all day's media → FFmpeg concat protocol → Single stream
Problem: Can't adapt procedurally based on real-time decisions

Constrained FFmpeg Approach (VLC-aligned):
──────────────────────────────────────────
Queue item 1 → FFmpeg plays → Callback when done → Queue item 2 → Repeat
Allows: Procedural decisions between items, progression tracking, dynamic scheduling
```

## Usage Patterns

### In Application Code

```typescript
import { getMediaPlayer, MediaPlayerBackend } from './mediaPlayerFactory';

// Use default player (VLC)
const player = await getMediaPlayer();
await player.initialize('password');

// Or explicitly use FFmpeg
const ffmpegPlayer = await getMediaPlayer(MediaPlayerBackend.FFMPEG);
await ffmpegPlayer.initialize('stream_url');

// Same interface regardless of backend
await player.addMediaBlockToQueue(mediaBlock);
await player.play();
```

### In streamManager (No Changes Needed)

The current `addInitialMediaBlocks` and streaming logic work unchanged:

```typescript
// Works with any backend
async function addInitialMediaBlocks() {
  for (const item of onDeck) {
    const player = await getMediaPlayer();
    await player.addMediaBlockToQueue(item);
  }
}
```

## Benefits

1. **Abstraction**: Application code doesn't know which backend is active
2. **Consistency**: Both backends follow the same contract and constraints
3. **Flexibility**: Easy to switch backends or add new ones
4. **VLC Alignment**: FFmpeg behavior is bounded by VLC's model
5. **Procedural Control**: Both backends support dynamic media selection
6. **Testability**: Interface enables mock implementations for testing

## Future Extensions

To add a new backend (e.g., Plex Direct, HLS):

1. Create new class implementing IMediaPlayer
2. Implement all required methods
3. Register in MediaPlayerFactory
4. No changes needed to application code

```typescript
class PlexMediaPlayer implements IMediaPlayer {
  // Implement all interface methods
}

// In factory:
case MediaPlayerBackend.PLEX:
  player = new PlexMediaPlayer();
  break;
```

## Migration Path

1. **Phase 1**: Create abstraction (DONE)
2. **Phase 2**: Test VLC through new interface
3. **Phase 3**: Gradually migrate streamManager to use factory
4. **Phase 4**: Test FFmpeg implementation
5. **Phase 5**: Add configuration to choose backend
6. **Phase 6**: Add monitoring/fallback logic
