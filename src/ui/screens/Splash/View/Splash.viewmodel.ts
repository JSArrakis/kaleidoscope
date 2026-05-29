import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface SplashData {
  anchorContentLoaded: boolean;
  facetWalkabilityLoaded: boolean;
  cadenceBufferLoaded: boolean;
}
interface SplashActions {}

export interface SplashViewModel extends SplashData, SplashActions {}

const ICON_UPDATE_DELAY_MS = 500;

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const useSplashViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): SplashViewModel => {
  const [anchorContentLoaded, setAnchorContentLoaded] = useState(false);
  const [facetWalkabilityLoaded, setFacetWalkabilityLoaded] = useState(false);
  const [cadenceBufferLoaded, setCadenceBufferLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStartupChecks = async () => {
      try {
        await window.electron.runStartupReadinessChecksHandler();
        const [
          anchorContentStatus,
          facetWalkabilityStatus,
          cadenceBufferStatus,
        ] = await Promise.all([
          window.electron.getAnchorContentReadinessStatusHandler(),
          window.electron.getFacetWalkabilityReadinessStatusHandler(),
          window.electron.getCadenceBufferReadinessStatusHandler(),
        ]);

        if (!isMounted) {
          return;
        }

        setAnchorContentLoaded(!!anchorContentStatus);
        await delay(ICON_UPDATE_DELAY_MS);
        if (!isMounted) {
          return;
        }

        setFacetWalkabilityLoaded(!!facetWalkabilityStatus);
        await delay(ICON_UPDATE_DELAY_MS);
        if (!isMounted) {
          return;
        }

        setCadenceBufferLoaded(!!cadenceBufferStatus);
      } catch (error) {
        console.error("[Splash] Startup readiness checks failed", error);
        if (!isMounted) {
          return;
        }

        // If the IPC request failed, still let the splash complete so the app
        // can surface the warning state later in the UI.
        setAnchorContentLoaded(true);
        await delay(ICON_UPDATE_DELAY_MS);
        if (!isMounted) {
          return;
        }

        setFacetWalkabilityLoaded(true);
        await delay(ICON_UPDATE_DELAY_MS);
        if (!isMounted) {
          return;
        }

        setCadenceBufferLoaded(true);
      }
    };

    void loadStartupChecks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (anchorContentLoaded && facetWalkabilityLoaded && cadenceBufferLoaded) {
      const timer = setTimeout(() => {
        navigate("/home");
      }, 1500); // Delay navigation by 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [
    navigate,
    anchorContentLoaded,
    facetWalkabilityLoaded,
    cadenceBufferLoaded,
  ]);

  return {
    anchorContentLoaded,
    facetWalkabilityLoaded,
    cadenceBufferLoaded,
  };
};

export default useSplashViewModel;
