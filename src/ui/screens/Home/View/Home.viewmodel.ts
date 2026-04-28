import { useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface HomeData {
  isStartingTest: boolean;
  testStatus: string;
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
    openPlayer: () => navigate("/player"),
    runAdhocCadencedTest: async () => runAdhocTest(true),
    runAdhocUncadencedTest: async () => runAdhocTest(false),
  };
};

export default useHomeViewModel;
