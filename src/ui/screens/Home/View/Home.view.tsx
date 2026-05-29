import { FC } from "react";
import { Button } from "../../../components";
import { HomeViewModel } from "./Home.viewmodel";
import styles from "./Home.module.css";

interface HomeViewProps {
  viewModel: HomeViewModel;
}

const HomeView: FC<HomeViewProps> = ({ viewModel }) => {
  const { isStartingTest, testStatus, normalizationStatusLabel } = viewModel;

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Home</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <div className={styles.heroCard}>
              <p className={styles.eyebrow}>Temporary Workflow</p>
              <h2 className={styles.heroTitle}>Open the new in-app player</h2>
              <p className={styles.heroBody}>
                This first pass adds a VLC-style player screen inside Prism so
                you can load local audio or video files and start validating the
                interaction model.
              </p>
              <Button
                onClick={viewModel.openPlayer}
                className={styles.playerButton}
              >
                Go To Player Screen
              </Button>
              <div className={styles.testActions}>
                <Button
                  onClick={viewModel.runAdhocCadencedTest}
                  className={styles.testButton}
                >
                  Run Adhoc Test (Cadenced)
                </Button>
                <Button
                  onClick={viewModel.runAdhocUncadencedTest}
                  className={styles.testButton}
                >
                  Run Adhoc Test (Uncadenced)
                </Button>
              </div>
              <p className={styles.testHint}>
                Requires KALEIDOSCOPE_USE_FILESYSTEM_ADHOC_TEST=1 in your dev
                terminal.
              </p>
              <p className={styles.testStatus}>{normalizationStatusLabel}</p>
              {isStartingTest && (
                <p className={styles.testStatus}>Starting test stream...</p>
              )}
              {!isStartingTest && testStatus && (
                <p className={styles.testStatus}>{testStatus}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
