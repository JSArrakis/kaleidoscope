type PlayerType = "vlc" | "electron" | "web" | "ffmpeg-plex";

let currentPlayerType: PlayerType = "electron"; // Default to electron player
let isPlayerInitialized: boolean = false;
let electronPlayerQueue: PlayerQueueItem[] = [];
let electronPlayerCurrentIndex = -1;
let electronPlayerUpdatedAt = 0;
let nextQueueItemSequence = 1;

function touchElectronPlayerState(): void {
  electronPlayerUpdatedAt = Date.now();
}

function getFallbackTitle(filePath: string): string {
  const segments = filePath.split(/[/\\]/);
  return segments[segments.length - 1] || filePath;
}

function clampElectronPlayerIndex(index: number): number {
  if (electronPlayerQueue.length === 0) {
    return -1;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= electronPlayerQueue.length) {
    return electronPlayerQueue.length - 1;
  }

  return index;
}

function createQueueItem(
  mediaItem: Movie | Episode | Promo | Music | Short | Commercial | Bumper,
  mediaBlock: MediaBlock,
  positionInBlock: number,
  isBuffer: boolean,
): PlayerQueueItem | null {
  if (!("path" in mediaItem) || !mediaItem.path) {
    return null;
  }

  const queueItem = {
    queueItemId: `player-item-${nextQueueItemSequence++}`,
    mediaItemId: mediaItem.mediaItemId,
    title: mediaItem.title || getFallbackTitle(mediaItem.path),
    filePath: mediaItem.path,
    mediaType: mediaItem.type,
    startTime: mediaBlock.startTime,
    blockStartTime: mediaBlock.startTime,
    positionInBlock,
    isBuffer,
    sourceContext: mediaBlock.sourceContext,
  };

  console.log(
    `[PlayerManager] createQueueItem id=${queueItem.queueItemId} type=${queueItem.mediaType} buffer=${isBuffer} path=${queueItem.filePath}`,
  );

  return queueItem;
}

function flattenMediaBlockToQueueItems(
  mediaBlock: MediaBlock,
): PlayerQueueItem[] {
  const queueItems: PlayerQueueItem[] = [];

  for (let index = 0; index < mediaBlock.buffer.length; index += 1) {
    const queueItem = createQueueItem(
      mediaBlock.buffer[index],
      mediaBlock,
      index,
      true,
    );
    if (queueItem) {
      queueItems.push(queueItem);
    }
  }

  if (mediaBlock.anchorMedia) {
    const anchorQueueItem = createQueueItem(
      mediaBlock.anchorMedia,
      mediaBlock,
      queueItems.length,
      false,
    );

    if (anchorQueueItem) {
      queueItems.push(anchorQueueItem);
    }
  }

  return queueItems;
}

function ensureElectronPlayerReadyState(): void {
  if (electronPlayerQueue.length === 0) {
    electronPlayerCurrentIndex = -1;
    return;
  }

  electronPlayerCurrentIndex = clampElectronPlayerIndex(
    electronPlayerCurrentIndex,
  );
}

function enqueueElectronMediaBlock(mediaBlock: MediaBlock): void {
  const queueItems = flattenMediaBlockToQueueItems(mediaBlock);

  if (queueItems.length === 0) {
    console.warn(
      "[PlayerManager] [Electron] Ignoring media block with no playable file paths",
    );
    return;
  }

  electronPlayerQueue.push(...queueItems);
  ensureElectronPlayerReadyState();
  touchElectronPlayerState();
  console.log(
    `[PlayerManager] Enqueued ${queueItems.length} items from block start=${mediaBlock.startTime}. queueLength=${electronPlayerQueue.length} currentIndex=${electronPlayerCurrentIndex}`,
  );
}

export function getPlayerStateSnapshot(): ElectronPlayerState {
  console.log(
    `[PlayerManager] Snapshot queueLength=${electronPlayerQueue.length} currentIndex=${electronPlayerCurrentIndex} initialized=${isPlayerInitialized}`,
  );
  return {
    playerType: currentPlayerType,
    isInitialized: isPlayerInitialized,
    currentIndex: electronPlayerCurrentIndex,
    queue: [...electronPlayerQueue],
    updatedAt: electronPlayerUpdatedAt,
  };
}

export function replacePlayerQueueFromFilePaths(
  filePaths: string[],
): ElectronPlayerState {
  electronPlayerQueue = filePaths.map((filePath, index) => ({
    queueItemId: `player-item-${nextQueueItemSequence++}`,
    title: getFallbackTitle(filePath),
    filePath,
    startTime: 0,
    blockStartTime: 0,
    positionInBlock: index,
    isBuffer: false,
  }));
  electronPlayerCurrentIndex = electronPlayerQueue.length > 0 ? 0 : -1;
  touchElectronPlayerState();

  return getPlayerStateSnapshot();
}

export function selectPlayerQueueItem(index: number): ElectronPlayerState {
  console.log(
    `[PlayerManager] selectQueueItem requested=${index} previous=${electronPlayerCurrentIndex}`,
  );
  electronPlayerCurrentIndex = clampElectronPlayerIndex(index);
  console.log(
    `[PlayerManager] selectQueueItem resolved=${electronPlayerCurrentIndex}`,
  );
  touchElectronPlayerState();
  return getPlayerStateSnapshot();
}

export function playNextInPlayerQueue(): ElectronPlayerState {
  console.log(
    `[PlayerManager] playNext from index=${electronPlayerCurrentIndex}`,
  );
  electronPlayerCurrentIndex = clampElectronPlayerIndex(
    electronPlayerCurrentIndex + 1,
  );
  console.log(
    `[PlayerManager] playNext resolved index=${electronPlayerCurrentIndex}`,
  );
  touchElectronPlayerState();
  return getPlayerStateSnapshot();
}

export function playPreviousInPlayerQueue(): ElectronPlayerState {
  console.log(
    `[PlayerManager] playPrevious from index=${electronPlayerCurrentIndex}`,
  );
  electronPlayerCurrentIndex = clampElectronPlayerIndex(
    electronPlayerCurrentIndex - 1,
  );
  console.log(
    `[PlayerManager] playPrevious resolved index=${electronPlayerCurrentIndex}`,
  );
  touchElectronPlayerState();
  return getPlayerStateSnapshot();
}

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
    if (currentPlayerType === "electron") {
      await initializePlayer("electron");
    } else {
      console.warn(
        "[PlayerManager] Player not initialized, queueing media block for later playback",
      );
      return;
    }
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
        console.log(
          "[PlayerManager] [Electron] Adding media block to Electron player",
        );
        enqueueElectronMediaBlock(mediaBlock);
        break;

      case "web":
        // TODO: Implement web player-specific playback logic
        console.log("[PlayerManager] [Web] Adding media block to web player");
        // await webPlayer.addMediaBlock(mediaBlock);
        // await webPlayer.play();
        break;

      case "ffmpeg-plex":
        // TODO: Implement FFmpeg/Plex stream output logic
        console.log(
          "[PlayerManager] [FFmpeg-Plex] Adding media block to FFmpeg-Plex stream",
        );
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
        console.log("[PlayerManager] Initializing Electron player");
        ensureElectronPlayerReadyState();
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
        console.log("[PlayerManager] Stopping Electron player");
        electronPlayerQueue = [];
        electronPlayerCurrentIndex = -1;
        touchElectronPlayerState();
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
        console.log(
          `[PlayerManager] [Electron] Starting playback (timeDeltaMs: ${timeDeltaMs}ms)`,
        );
        if (electronPlayerQueue.length > 0 && electronPlayerCurrentIndex < 0) {
          electronPlayerCurrentIndex = 0;
          touchElectronPlayerState();
        }
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

export function resetPlayerStateForTests(): void {
  currentPlayerType = "electron";
  isPlayerInitialized = false;
  electronPlayerQueue = [];
  electronPlayerCurrentIndex = -1;
  electronPlayerUpdatedAt = 0;
  nextQueueItemSequence = 1;
}
