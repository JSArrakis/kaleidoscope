import { useEffect, useMemo, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "m4v",
  "mov",
  "mkv",
  "webm",
  "avi",
  "mpeg",
  "mpg",
  "wmv",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "flac",
  "aac",
  "m4a",
  "ogg",
  "oga",
  "opus",
  "wma",
]);

type PlayerMediaKind = "audio" | "video" | "unknown";

interface PlayerData {
  queue: string[];
  selectedIndex: number;
  currentFilePath: string | null;
  currentFileName: string;
  mediaSource: string | null;
  isResolvingPlaybackSource: boolean;
  mediaKind: PlayerMediaKind;
  mediaProbe: MediaProbeResult | null;
  isProbing: boolean;
  supportMessage: string;
  normalizationStatus: NormalizationStatusSnapshot | null;
  normalizationStatusLabel: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

interface PlayerActions {
  goHome: () => void;
  openFiles: () => Promise<void>;
  selectQueueItem: (index: number) => void;
  playPrevious: () => void;
  playNext: () => void;
  getQueueItemKind: (filePath: string) => PlayerMediaKind;
}

export interface PlayerViewModel extends PlayerData, PlayerActions {}

function getFileName(filePath: string | null): string {
  if (!filePath) {
    return "No media selected";
  }

  const segments = filePath.split(/[/\\]/);
  return segments[segments.length - 1] || filePath;
}

function getExtension(filePath: string | null): string {
  if (!filePath) {
    return "";
  }

  const fileName = getFileName(filePath);
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "";
}

function getMediaKind(filePath: string | null): PlayerMediaKind {
  const extension = getExtension(filePath);

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return "audio";
  }

  return "unknown";
}

function toFileUrl(filePath: string | null): string | null {
  if (!filePath) {
    return null;
  }

  const normalizedPath = filePath.replace(/\\/g, "/");
  return encodeURI(`file:///${normalizedPath}`);
}

function getSupportMessage(
  filePath: string | null,
  mediaKind: PlayerMediaKind,
  mediaProbe: MediaProbeResult | null,
  currentQueueItem?: PlayerQueueItem,
): string {
  if (!filePath) {
    return "Choose one or more local media files, or let stream construction push blocks into the Electron player queue.";
  }

  if (mediaProbe?.errorMessage) {
    return `Probe failed: ${mediaProbe.errorMessage}`;
  }

  if (currentQueueItem?.sourceContext) {
    return "This queue item was handed off from stream construction through the Electron player manager and is now available in the in-app player.";
  }

  if (mediaKind === "unknown") {
    return "This file extension is not in the known audio/video list. Chromium may still play it, but full “play anything” support will require an Electron-side transcoding or native playback layer.";
  }

  return "This screen is using Electron + Chromium media playback today. FFmpeg can still be added later for unsupported codecs, probing, thumbnails, or live transcoding.";
}

const usePlayerViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): PlayerViewModel => {
  const [playerState, setPlayerState] = useState<ElectronPlayerState>({
    playerType: "electron",
    isInitialized: false,
    currentIndex: -1,
    queue: [],
    updatedAt: 0,
  });
  const [mediaProbe, setMediaProbe] = useState<MediaProbeResult | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [resolvedPlayablePath, setResolvedPlayablePath] = useState<
    string | null
  >(null);
  const [isResolvingPlaybackSource, setIsResolvingPlaybackSource] =
    useState(false);
  const [normalizationStatus, setNormalizationStatus] =
    useState<NormalizationStatusSnapshot | null>(null);

  const refreshPlayerState = async (): Promise<void> => {
    const nextState = await window.electron.getPlayerStateHandler();
    setPlayerState(nextState);
  };

  useEffect(() => {
    void refreshPlayerState();

    void window.electron
      .getNormalizationStatusHandler()
      .then(setNormalizationStatus)
      .catch(() => {
        // Keep UI responsive even if status endpoint is temporarily unavailable.
      });

    const intervalId = window.setInterval(() => {
      void refreshPlayerState();

      void window.electron
        .getNormalizationStatusHandler()
        .then(setNormalizationStatus)
        .catch(() => {
          // Ignore transient polling errors to avoid console spam in dev.
        });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (playerState.queue.length === 0 || playerState.currentIndex >= 0) {
      return;
    }

    console.log(
      `[PlayerVM] No active selection with queueLength=${playerState.queue.length}, selecting index 0`,
    );

    void window.electron.playerSelectQueueItemHandler(0).then((nextState) => {
      console.log(
        `[PlayerVM] Auto-select index 0 complete -> currentIndex=${nextState.currentIndex}`,
      );
      setPlayerState(nextState);
    });
  }, [playerState.currentIndex, playerState.queue.length]);

  const queue = useMemo(
    () => playerState.queue.map((item) => item.filePath),
    [playerState.queue],
  );
  const selectedIndex = playerState.currentIndex;
  const currentQueueItem =
    selectedIndex >= 0 ? (playerState.queue[selectedIndex] ?? null) : null;
  const currentFilePath = currentQueueItem?.filePath ?? null;
  const mediaKind = getMediaKind(currentFilePath);
  const mediaSource = useMemo(
    () => toFileUrl(resolvedPlayablePath ?? currentFilePath),
    [currentFilePath, resolvedPlayablePath],
  );
  const currentFileName = useMemo(
    () => currentQueueItem?.title ?? getFileName(currentFilePath),
    [currentFilePath, currentQueueItem],
  );

  useEffect(() => {
    if (!currentFilePath) {
      console.log(
        "[PlayerVM] No current file path; clearing resolved playback source",
      );
      setResolvedPlayablePath(null);
      setIsResolvingPlaybackSource(false);
      return;
    }

    let isCancelled = false;
    setIsResolvingPlaybackSource(true);
    console.log(`[PlayerVM] Resolving playable path for: ${currentFilePath}`);

    window.electron
      .resolveElectronPlayablePathHandler(currentFilePath)
      .then((resolvedPath) => {
        if (!isCancelled) {
          console.log(
            `[PlayerVM] Resolved playable path: ${currentFilePath} -> ${resolvedPath}`,
          );
          setResolvedPlayablePath(resolvedPath || currentFilePath);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[PlayerVM] Failed resolving playable path for ${currentFilePath}: ${message}`,
          );
          setResolvedPlayablePath(currentFilePath);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          console.log(
            `[PlayerVM] Resolve phase complete for: ${currentFilePath}`,
          );
          setIsResolvingPlaybackSource(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentFilePath]);

  useEffect(() => {
    if (!currentFilePath) {
      console.log("[PlayerVM] No current file path; clearing probe state");
      setMediaProbe(null);
      setIsProbing(false);
      return;
    }

    let isCancelled = false;
    setIsProbing(true);
    console.log(`[PlayerVM] Probing source metadata: ${currentFilePath}`);

    window.electron
      .probeMediaMetadataHandler(currentFilePath)
      .then((result) => {
        if (!isCancelled) {
          console.log(
            `[PlayerVM] Probe complete: container=${result.container} video=${result.videoCodec} audio=${result.audioCodec} playable=${result.isPlayable}`,
          );
          setMediaProbe(result);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown probe error.";
          console.error(`[PlayerVM] Probe failed: ${message}`);
          setMediaProbe({
            filePath: currentFilePath,
            isPlayable: false,
            errorMessage: message,
          });
        }
      })
      .finally(() => {
        if (!isCancelled) {
          console.log(
            `[PlayerVM] Probe phase complete for: ${currentFilePath}`,
          );
          setIsProbing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentFilePath]);

  const supportMessage = useMemo(
    () =>
      getSupportMessage(
        currentFilePath,
        mediaKind,
        mediaProbe,
        currentQueueItem ?? undefined,
      ),
    [currentFilePath, currentQueueItem, mediaKind, mediaProbe],
  );

  const normalizationStatusLabel = useMemo(() => {
    if (!normalizationStatus) {
      return "Normalization status unavailable";
    }

    const { queue, cache } = normalizationStatus;
    const pressure =
      cache.usageRatio >= 0.9
        ? "high"
        : cache.usageRatio >= 0.8
          ? "elevated"
          : "normal";

    if (queue.activeCount > 0 || queue.queuedCount > 0) {
      return `Warming media: active ${queue.activeCount}, queued ${queue.queuedCount}, cache pressure ${pressure}`;
    }

    if (queue.failedCount > 0) {
      return `Degraded: ${queue.failedCount} normalization failure(s), cache pressure ${pressure}`;
    }

    return `Ready: normalized ${queue.normalizedCount} source(s), cache pressure ${pressure}`;
  }, [normalizationStatus]);

  const openFiles = async () => {
    const selectedFiles = await window.electron.openFileDialogHandler();

    if (selectedFiles.length === 0) {
      return;
    }

    const nextState =
      await window.electron.replacePlayerQueueHandler(selectedFiles);
    setPlayerState(nextState);
  };

  const selectQueueItem = (index: number) => {
    console.log(`[PlayerVM] User selected queue index=${index}`);
    void window.electron
      .playerSelectQueueItemHandler(index)
      .then((nextState) => {
        console.log(
          `[PlayerVM] Queue selection applied currentIndex=${nextState.currentIndex}`,
        );
        setPlayerState(nextState);
      });
  };

  const playPrevious = () => {
    console.log("[PlayerVM] playPrevious invoked");
    void window.electron.playerPlayPreviousHandler().then((nextState) => {
      console.log(
        `[PlayerVM] playPrevious applied currentIndex=${nextState.currentIndex}`,
      );
      setPlayerState(nextState);
    });
  };

  const playNext = () => {
    console.log("[PlayerVM] playNext invoked");
    void window.electron.playerPlayNextHandler().then((nextState) => {
      console.log(
        `[PlayerVM] playNext applied currentIndex=${nextState.currentIndex}`,
      );
      setPlayerState(nextState);
    });
  };

  const goHome = () => {
    navigate("/home");
  };

  return {
    queue,
    selectedIndex,
    currentFilePath,
    currentFileName,
    mediaSource,
    isResolvingPlaybackSource,
    mediaKind,
    mediaProbe,
    isProbing,
    supportMessage,
    normalizationStatus,
    normalizationStatusLabel,
    canGoPrevious: selectedIndex > 0,
    canGoNext: selectedIndex >= 0 && selectedIndex < queue.length - 1,
    goHome,
    openFiles,
    selectQueueItem,
    playPrevious,
    playNext,
    getQueueItemKind: (filePath: string) => getMediaKind(filePath),
  };
};

export default usePlayerViewModel;
