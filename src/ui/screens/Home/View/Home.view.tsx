import { FC } from "react";
import { Button } from "../../../components";
import { HomeViewModel } from "./Home.viewmodel";
import styles from "./Home.module.css";

interface HomeViewProps {
  viewModel: HomeViewModel;
}

const HomeView: FC<HomeViewProps> = ({ viewModel }) => {
  const {
    cadence,
    themed,
    durationMinutes,
    isStartingStream,
    streamStatus,
    normalizationStatusLabel,
    canStartStream,
    streamEligibilityMessage,
    openPlayer,
    openBootstrapLog,
    setCadence,
    setThemed,
    setDurationMinutes,
    startAdhocStream,
  } = viewModel;

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Home</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <div className={styles.heroCard}>
              <p className={styles.eyebrow}>Adhoc Stream</p>
              <h2 className={styles.heroTitle}>Launch a stream</h2>

              <div className={styles.optionRow}>
                <label className={styles.optionLabel}>
                  <button
                    type="button"
                    className={`${styles.toggleChip} ${cadence ? styles.toggleChipOn : ""}`}
                    onClick={() => setCadence(!cadence)}
                  >
                    <span
                      className={`material-symbols-rounded ${styles.chipIcon}`}
                    >
                      {cadence ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    Cadenced
                  </button>
                </label>
                <label className={styles.optionLabel}>
                  <button
                    type="button"
                    className={`${styles.toggleChip} ${themed ? styles.toggleChipOn : ""}`}
                    onClick={() => setThemed(!themed)}
                  >
                    <span
                      className={`material-symbols-rounded ${styles.chipIcon}`}
                    >
                      {themed ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    Themed
                  </button>
                </label>
              </div>

              <div className={styles.durationRow}>
                <span className={styles.durationLabel}>Duration</span>
                <div className={styles.durationPicker}>
                  {[30, 60, 120, 180, 240].map((min) => (
                    <button
                      key={min}
                      type="button"
                      className={`${styles.durationChip} ${durationMinutes === min ? styles.durationChipActive : ""}`}
                      onClick={() => setDurationMinutes(min)}
                    >
                      {min < 60 ? `${min}m` : `${min / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.launchRow}>
                <Button
                  onClick={() => void startAdhocStream()}
                  className={styles.launchButton}
                  disabled={!canStartStream || isStartingStream}
                  title={streamEligibilityMessage}
                >
                  {isStartingStream ? "Building…" : "Launch"}
                </Button>
                <Button onClick={openPlayer} className={styles.ghostButton}>
                  Open Player
                </Button>
                <Button
                  onClick={() => void openBootstrapLog()}
                  className={styles.ghostButton}
                  title="Open bootstrap activity log for testing"
                >
                  📋 Log
                </Button>
              </div>

              {!canStartStream && (
                <p className={styles.eligibilityStatus}>
                  {streamEligibilityMessage}
                </p>
              )}
              <p className={styles.statusLine}>{normalizationStatusLabel}</p>
              {streamStatus ? (
                <p className={styles.statusLine}>{streamStatus}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
