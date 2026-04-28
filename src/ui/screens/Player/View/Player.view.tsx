import { FC } from "react";
import { Button } from "../../../components";
import { PlayerViewModel } from "./Player.viewmodel";
import styles from "./Player.module.css";

interface PlayerViewProps {
  viewModel: PlayerViewModel;
}

function formatDuration(seconds?: number): string {
  if (!seconds || Number.isNaN(seconds)) {
    return "-";
  }

  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(wholeSeconds / 3600);
  const mins = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const PlayerView: FC<PlayerViewProps> = ({ viewModel }) => {
  const {
    queue,
    currentFilePath,
    currentFileName,
    mediaSource,
    mediaKind,
    mediaProbe,
    isProbing,
    supportMessage,
    canGoPrevious,
    canGoNext,
    goHome,
    openFiles,
    selectQueueItem,
    playPrevious,
    playNext,
    getQueueItemKind,
  } = viewModel;

  const isAudioOnly = mediaKind === "audio";

  return (
    <div className={styles.screen}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Temporary In-App Player</p>
            <h1 className={styles.screenTitle}>Player</h1>
          </div>
          <div className={styles.topBarActions}>
            <Button onClick={goHome} className={styles.ghostButton}>
              Back to Home
            </Button>
            <Button onClick={openFiles} className={styles.primaryButton}>
              Open Media Files
            </Button>
          </div>
        </div>

        <div className={styles.playerGrid}>
          <section className={styles.stagePanel}>
            <div className={styles.stageHeader}>
              <div>
                <p className={styles.nowPlayingLabel}>Now Playing</p>
                <h2 className={styles.nowPlayingTitle}>{currentFileName}</h2>
              </div>
              <p className={styles.filePath}>
                {currentFilePath ?? "No file loaded yet"}
              </p>
              {isProbing && (
                <p className={styles.probeStatus}>
                  Analyzing media stream metadata...
                </p>
              )}
              {!isProbing && mediaProbe && (
                <div className={styles.metaGrid}>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Container</span>
                    <span className={styles.metaValue}>
                      {mediaProbe.container ?? "-"}
                    </span>
                  </div>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Duration</span>
                    <span className={styles.metaValue}>
                      {formatDuration(mediaProbe.durationSeconds)}
                    </span>
                  </div>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Video Codec</span>
                    <span className={styles.metaValue}>
                      {mediaProbe.videoCodec ?? "-"}
                    </span>
                  </div>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Audio Codec</span>
                    <span className={styles.metaValue}>
                      {mediaProbe.audioCodec ?? "-"}
                    </span>
                  </div>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Resolution</span>
                    <span className={styles.metaValue}>
                      {mediaProbe.width && mediaProbe.height
                        ? `${mediaProbe.width}x${mediaProbe.height}`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.metaCell}>
                    <span className={styles.metaLabel}>Bitrate</span>
                    <span className={styles.metaValue}>
                      {mediaProbe.bitrate
                        ? `${Math.round(mediaProbe.bitrate / 1000)} kbps`
                        : "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.stageSurface}>
              {!mediaSource && (
                <div className={styles.emptyStage}>
                  <div className={styles.emptyIcon}>▶</div>
                  <p className={styles.emptyTitle}>
                    Load a video or music file
                  </p>
                  <p className={styles.emptyBody}>
                    This first pass uses the existing Electron file dialog and a
                    local playback surface inside the app.
                  </p>
                </div>
              )}

              {mediaSource && !isAudioOnly && (
                <video
                  key={mediaSource}
                  className={styles.mediaElement}
                  controls
                  autoPlay
                  preload="metadata"
                  src={mediaSource}
                />
              )}

              {mediaSource && isAudioOnly && (
                <div className={styles.audioStage}>
                  <div className={styles.audioBadge}>Audio</div>
                  <div className={styles.audioArtwork}>
                    {currentFileName.slice(0, 2).toUpperCase()}
                  </div>
                  <p className={styles.audioHint}>
                    Chromium is rendering this as audio-only. The queue and
                    transport stay in the same player shell.
                  </p>
                  <audio
                    key={mediaSource}
                    className={styles.audioElement}
                    controls
                    autoPlay
                    preload="metadata"
                    src={mediaSource}
                  />
                </div>
              )}
            </div>

            <div className={styles.transportBar}>
              <div className={styles.transportButtons}>
                <Button
                  onClick={playPrevious}
                  className={styles.transportButton}
                  style={{ opacity: canGoPrevious ? 1 : 0.45 }}
                >
                  Previous
                </Button>
                <Button onClick={openFiles} className={styles.transportPrimary}>
                  Replace Queue
                </Button>
                <Button
                  onClick={playNext}
                  className={styles.transportButton}
                  style={{ opacity: canGoNext ? 1 : 0.45 }}
                >
                  Next
                </Button>
              </div>
              <p className={styles.supportMessage}>{supportMessage}</p>
            </div>
          </section>

          <aside className={styles.queuePanel}>
            <div className={styles.queueHeader}>
              <div>
                <p className={styles.queueEyebrow}>Queue</p>
                <h2 className={styles.queueTitle}>
                  {queue.length} item{queue.length === 1 ? "" : "s"}
                </h2>
              </div>
            </div>

            <div className={styles.queueList}>
              {queue.length === 0 && (
                <div className={styles.queueEmpty}>
                  The queue will appear here after you open one or more files.
                </div>
              )}

              {queue.map((filePath, index) => {
                const isActive = filePath === currentFilePath;
                const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
                const kind = getQueueItemKind(filePath);

                return (
                  <button
                    key={filePath}
                    type="button"
                    className={`${styles.queueItem} ${isActive ? styles.queueItemActive : ""}`}
                    onClick={() => selectQueueItem(index)}
                  >
                    <span className={styles.queueIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className={styles.queueText}>
                      <span className={styles.queueName}>{fileName}</span>
                      <span className={styles.queuePath}>{filePath}</span>
                    </div>
                    <span className={styles.queueKind}>
                      {kind === "unknown" ? "media" : kind}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlayerView;
