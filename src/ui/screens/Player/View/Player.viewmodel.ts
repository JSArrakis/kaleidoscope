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
  mediaKind: PlayerMediaKind;
  mediaProbe: MediaProbeResult | null;
  isProbing: boolean;
  supportMessage: string;
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

  const refreshPlayerState = async (): Promise<void> => {
    const nextState = await window.electron.getPlayerStateHandler();
    setPlayerState(nextState);
  };

  useEffect(() => {
    void refreshPlayerState();

    const intervalId = window.setInterval(() => {
      void refreshPlayerState();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
    () => toFileUrl(currentFilePath),
    [currentFilePath],
  );
  const currentFileName = useMemo(
    () => currentQueueItem?.title ?? getFileName(currentFilePath),
    [currentFilePath, currentQueueItem],
  );

  useEffect(() => {
    if (!currentFilePath) {
      setMediaProbe(null);
      setIsProbing(false);
      return;
    }

    let isCancelled = false;
    setIsProbing(true);

    window.electron
      .probeMediaMetadataHandler(currentFilePath)
      .then((result) => {
        if (!isCancelled) {
          setMediaProbe(result);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setMediaProbe({
            filePath: currentFilePath,
            isPlayable: false,
            errorMessage:
              error instanceof Error ? error.message : "Unknown probe error.",
          });
        }
      })
      .finally(() => {
        if (!isCancelled) {
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
    void window.electron
      .playerSelectQueueItemHandler(index)
      .then((nextState) => setPlayerState(nextState));
  };

  const playPrevious = () => {
    void window.electron
      .playerPlayPreviousHandler()
      .then((nextState) => setPlayerState(nextState));
  };

  const playNext = () => {
    void window.electron
      .playerPlayNextHandler()
      .then((nextState) => setPlayerState(nextState));
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
    mediaKind,
    mediaProbe,
    isProbing,
    supportMessage,
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
