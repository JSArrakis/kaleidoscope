import { useEffect, useMemo, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface HomeData {
  isStartingTest: boolean;
  testStatus: string;
  normalizationStatusLabel: string;
}
interface HomeActions {
  openPlayer: () => void;
  runAdhocCadencedTest: () => Promise<void>;
  runAdhocUncadencedTest: () => Promise<void>;
}

export interface HomeViewModel extends HomeData, HomeActions {}

const useHomeViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): HomeViewModel => {
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [testStatus, setTestStatus] = useState("");
  const [normalizationStatus, setNormalizationStatus] =
    useState<NormalizationStatusSnapshot | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const refreshStatus = async () => {
      try {
        const nextStatus =
          await window.electron.getNormalizationStatusHandler();
        if (!isCancelled) {
          setNormalizationStatus(nextStatus);
        }
      } catch {
        // Ignore transient polling failures; next interval refresh will retry.
      }
    };

    void refreshStatus();

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 2000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

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
      return `Preparing stream assets: active ${queue.activeCount}, queued ${queue.queuedCount}, cache pressure ${pressure}`;
    }

    if (queue.failedCount > 0) {
      return `Normalization degraded: ${queue.failedCount} failure(s), cache pressure ${pressure}`;
    }

    return `Normalization ready: ${queue.normalizedCount} source(s) warmed, cache pressure ${pressure}`;
  }, [normalizationStatus]);

  const runAdhocTest = async (cadence: boolean) => {
    try {
      setIsStartingTest(true);
      setTestStatus(
        `Starting ${cadence ? "cadenced" : "uncadenced"} adhoc test...`,
      );

      const result = await window.electron.runAdhocPlayerTestHandler(cadence);
      setTestStatus(`${result.message} (${result.blockCount} blocks)`);

      navigate("/player");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start adhoc test.";
      setTestStatus(message);
    } finally {
      setIsStartingTest(false);
    }
  };

  return {
    isStartingTest,
    testStatus,
    normalizationStatusLabel,
    openPlayer: () => navigate("/player"),
    runAdhocCadencedTest: async () => runAdhocTest(true),
    runAdhocUncadencedTest: async () => runAdhocTest(false),
  };
};

export default useHomeViewModel;
