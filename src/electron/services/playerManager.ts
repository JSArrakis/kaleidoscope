type PlayerType = "vlc" | "electron" | "web" | "ffmpeg-plex";

let currentPlayerType: PlayerType = "electron"; // Default to electron player
let isPlayerInitialized: boolean = false;

/**
 * Set the current player type being used
 */
export function setPlayerType(playerType: PlayerType): void {
  currentPlayerType = playerType;
  console.log(`[PlayerManager] Player type set to: ${playerType}`);
}

/**
 * Get the current player type
 */
export function getPlayerType(): PlayerType {
  return currentPlayerType;
}

/**
 * Set player initialization status
 */
export function setPlayerInitialized(initialized: boolean): void {
  isPlayerInitialized = initialized;
}

/**
 * Check if player is initialized and ready for playback
 */
export function isPlayerReady(): boolean {
  return isPlayerInitialized;
}

/**
 * Add a media block to the current player immediately
 * This is called for fast-path playback to minimize latency
 * TODO: Implement player-specific logic for VLC, Electron, Web players
 */
export async function addMediaBlockToPlayer(
  mediaBlock: MediaBlock,
): Promise<void> {
  if (!isPlayerInitialized) {
    console.warn(
      "[PlayerManager] Player not initialized, queueing media block for later playback",
    );
    return;
  }

  try {
    switch (currentPlayerType) {
      case "vlc":
        // TODO: Implement VLC-specific playback logic
        console.log("[PlayerManager] [VLC] Adding media block to VLC player");
        // await vlcService.addMediaBlockToPlaylist(mediaBlock);
        // await vlcService.playVLC();
        break;

      case "electron":
        // TODO: Implement Electron player-specific playback logic
        console.log(
          "[PlayerManager] [Electron] Adding media block to Electron player",
        );
        // await electronPlayer.addMediaBlock(mediaBlock);
        // await electronPlayer.play();
        break;

      case "web":
        // TODO: Implement web player-specific playback logic
        console.log("[PlayerManager] [Web] Adding media block to web player");
        // await webPlayer.addMediaBlock(mediaBlock);
        // await webPlayer.play();
        break;

      case "ffmpeg-plex":
        // TODO: Implement FFmpeg/Plex stream output logic
        console.log("[PlayerManager] [FFmpeg-Plex] Adding media block to FFmpeg-Plex stream");
        // await ffmpegPlexService.addMediaBlockToStream(mediaBlock);
        break;

      default:
        throw new Error(`Unknown player type: ${currentPlayerType}`);
    }

    console.log(
      `[PlayerManager] Media block queued for immediate playback at ${mediaBlock.startTime}s`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[PlayerManager] Failed to add media block to player: ${message}`,
    );
    throw error;
  }
}

/**
 * Initialize the player with stream configuration
 * TODO: Implement player-specific initialization
 */
export async function initializePlayer(playerType?: PlayerType): Promise<void> {
  if (playerType) {
    setPlayerType(playerType);
  }

  try {
    switch (currentPlayerType) {
      case "vlc":
        // TODO: Initialize VLC service
        console.log("[PlayerManager] Initializing VLC player");
        // await vlcService.initializeVLCService();
        break;

      case "electron":
        // TODO: Initialize Electron player
        console.log("[PlayerManager] Initializing Electron player");
        // await electronPlayer.initialize();
        break;

      case "web":
        // TODO: Initialize web player
        console.log("[PlayerManager] Initializing web player");
        // await webPlayer.initialize();
        break;

      case "ffmpeg-plex":
        // TODO: Initialize FFmpeg/Plex stream output
        console.log("[PlayerManager] Initializing FFmpeg-Plex stream");
        // await ffmpegPlexService.initialize();
        break;
    }

    setPlayerInitialized(true);
    console.log(
      `[PlayerManager] Player initialized and ready for playback (${currentPlayerType})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PlayerManager] Failed to initialize player: ${message}`);
    throw error;
  }
}

/**
 * Stop the current player and cleanup
 * TODO: Implement player-specific cleanup
 */
export async function stopPlayer(): Promise<void> {
  try {
    switch (currentPlayerType) {
      case "vlc":
        // TODO: Stop VLC service
        console.log("[PlayerManager] Stopping VLC player");
        // await vlcService.stopVLC();
        break;

      case "electron":
        // TODO: Stop Electron player
        console.log("[PlayerManager] Stopping Electron player");
        // await electronPlayer.stop();
        break;

      case "web":
        // TODO: Stop web player
        console.log("[PlayerManager] Stopping web player");
        // await webPlayer.stop();
        break;

      case "ffmpeg-plex":
        // TODO: Stop FFmpeg/Plex stream output
        console.log("[PlayerManager] Stopping FFmpeg-Plex stream");
        // await ffmpegPlexService.stop();
        break;
    }

    setPlayerInitialized(false);
    console.log("[PlayerManager] Player stopped");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PlayerManager] Failed to stop player: ${message}`);
    throw error;
  }
}

/**
 * Start playback on the current player
 * Called immediately after adding the first media block to minimize latency
 * Accepts optional timeDeltaMs for deviation correction tracking
 * TODO: Implement player-specific play logic
 * TODO: Pass timeDeltaMs to deviation correction mechanism
 */
export async function play(options?: { timeDelta?: number }): Promise<void> {
  if (!isPlayerInitialized) {
    console.warn(
      "[PlayerManager] Player not initialized, cannot start playback",
    );
    return;
  }

  const timeDeltaMs = options?.timeDelta || 0;

  try {
    switch (currentPlayerType) {
      case "vlc":
        // TODO: Start playback on VLC
        console.log(
          `[PlayerManager] [VLC] Starting playback (timeDeltaMs: ${timeDeltaMs}ms)`,
        );
        // TODO: Pass timeDeltaMs to deviation correction mechanism
        // await vlcService.playVLC();
        break;

      case "electron":
        // TODO: Start playback on Electron player
        console.log(
          `[PlayerManager] [Electron] Starting playback (timeDeltaMs: ${timeDeltaMs}ms)`,
        );
        // TODO: Pass timeDeltaMs to deviation correction mechanism
        // await electronPlayer.play();
        break;

      case "web":
        // TODO: Start playback on web player
        console.log(
          `[PlayerManager] [Web] Starting playback (timeDeltaMs: ${timeDeltaMs}ms)`,
        );
        // TODO: Pass timeDeltaMs to deviation correction mechanism
        // await webPlayer.play();
        break;
    }

    console.log(
      `[PlayerManager] Playback started on ${currentPlayerType} player`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PlayerManager] Failed to start playback: ${message}`);
    throw error;
  }
}
