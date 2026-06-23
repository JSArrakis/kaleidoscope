import { useEffect, useMemo, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface HomeData {
  cadence: boolean;
  themed: boolean;
  durationMinutes: number;
  isStartingStream: boolean;
  streamStatus: string;
  normalizationStatusLabel: string;
  canStartStream: boolean;
  streamEligibilityMessage: string;
}
interface HomeActions {
  openPlayer: () => void;
  openBootstrapLog: () => Promise<void>;
  setCadence: (v: boolean) => void;
  setThemed: (v: boolean) => void;
  setDurationMinutes: (v: number) => void;
  startAdhocStream: () => Promise<void>;
}

export interface HomeViewModel extends HomeData, HomeActions {}

const useHomeViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): HomeViewModel => {
  const [cadence, setCadence] = useState(false);
  const [themed, setThemed] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [normalizationStatus, setNormalizationStatus] =
    useState<NormalizationStatusSnapshot | null>(null);
  const [streamEligibility, setStreamEligibility] =
    useState<StreamStartEligibility | null>(null);

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

  // Poll bootstrap eligibility for stream start button state
  useEffect(() => {
    let isCancelled = false;

    const checkEligibility = async () => {
      try {
        const eligibility =
          await window.electron.checkStreamStartEligibilityHandler();
        if (!isCancelled) {
          setStreamEligibility(eligibility);
        }
      } catch {
        // Ignore transient polling failures; next interval refresh will retry.
      }
    };

    void checkEligibility();

    const intervalId = window.setInterval(() => {
      void checkEligibility();
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

  const runAdhocTest = async (cadenceOverride: boolean) => {
    try {
      setIsStartingStream(true);
      setStreamStatus(
        `Starting ${cadenceOverride ? "cadenced" : "uncadenced"} adhoc test...`,
      );

      const result =
        await window.electron.runAdhocPlayerTestHandler(cadenceOverride);
      setStreamStatus(`${result.message} (${result.blockCount} blocks)`);

      navigate("/player");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start adhoc test.";
      setStreamStatus(message);
    } finally {
      setIsStartingStream(false);
    }
  };

  const startAdhocStream = async () => {
    try {
      setIsStartingStream(true);
      setStreamStatus("Building stream…");

      const result = await window.electron.startAdhocStreamHandler({
        cadence,
        themed,
        durationMinutes,
      });

      setStreamStatus(`${result.message} (${result.blockCount} blocks)`);

      if (result.status === 200) {
        navigate("/player");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start stream.";
      setStreamStatus(message);
    } finally {
      setIsStartingStream(false);
    }
  };

  return {
    cadence,
    themed,
    durationMinutes,
    isStartingStream,
    streamStatus,
    normalizationStatusLabel,
    canStartStream: streamEligibility?.canStart ?? false,
    streamEligibilityMessage: streamEligibility?.statusMessage ?? "Checking...",
    openPlayer: () => navigate("/player"),
    openBootstrapLog: async () => {
      try {
        const result = await window.electron.openBootstrapLogHandler();
        console.log(`Bootstrap log opened: ${result.path}`);
      } catch (error) {
        console.error("Failed to open bootstrap log:", error);
      }
    },
    setCadence,
    setThemed,
    setDurationMinutes,
    startAdhocStream,
  };
};

export default useHomeViewModel;
