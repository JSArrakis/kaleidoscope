import { useEffect, useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface SplashData {
  allMediaLoaded: boolean;
  allCollectionsLoaded: boolean;
  allPrismsLoaded: boolean;
  allTagsLoaded: boolean;
  serviceStatus: ServiceStatusPayload | null;
}
interface SplashActions {}

export interface SplashViewModel extends SplashData, SplashActions {}

const useSplashViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): SplashViewModel => {
  const [allMediaLoaded, setAllMediaLoaded] = useState(false);
  const [allCollectionsLoaded, setAllCollectionsLoaded] = useState(false);
  const [allPrismsLoaded, setAllPrismsLoaded] = useState(false);
  const [allTagsLoaded, setAllTagsLoaded] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatusPayload | null>(null);

  // Service status listener
  useEffect(() => {
    // Get initial status
    window.electron.getServiceStatus().then(setServiceStatus);
    
    // Listen for status changes
    window.electron.onServiceStatusChanged(setServiceStatus);
  }, []);

  useEffect(() => {
    // TODO: Fetch all media instead of timeout
    const timer = setTimeout(
      () => {
        setAllMediaLoaded(true);
      },
      Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // TODO: Fetch all collections instead of timeout
    const timer = setTimeout(
      () => {
        setAllCollectionsLoaded(true);
      },
      Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // TODO: Fetch all prisms instead of timeout
    const timer = setTimeout(
      () => {
        setAllPrismsLoaded(true);
      },
      Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // TODO: Fetch all tags instead of timeout
    const timer = setTimeout(
      () => {
        setAllTagsLoaded(true);
      },
      Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      allMediaLoaded &&
      allCollectionsLoaded &&
      allPrismsLoaded &&
      allTagsLoaded
    ) {
      const timer = setTimeout(() => {
        navigate('/home');
      }, 1500); // Delay navigation by 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [
    navigate,
    allMediaLoaded,
    allCollectionsLoaded,
    allPrismsLoaded,
    allTagsLoaded,
  ]);

  return {
    allMediaLoaded,
    allCollectionsLoaded,
    allPrismsLoaded,
    allTagsLoaded,
    serviceStatus,
  };
};

export default useSplashViewModel;
