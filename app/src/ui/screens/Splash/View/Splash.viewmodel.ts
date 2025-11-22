import { useEffect, useState } from 'react';
import useRootStack from '../../../navigation/useRootStack';

interface SplashData {
  allMediaLoaded: boolean;
  allCollectionsLoaded: boolean;
  allPrismsLoaded: boolean;
  allTagsLoaded: boolean;
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
  const [serviceReady, setServiceReady] = useState(false);

  // Service status listener - wait for service to be running before starting loads
  useEffect(() => {
    const checkAndSetService = (status: ServiceStatusPayload) => {
      if (status.status === 'running') {
        setServiceReady(true);
      }
    };

    // Get initial status
    window.electron.getServiceStatus().then(checkAndSetService);

    // Listen for status changes
    window.electron.onServiceStatusChanged(checkAndSetService);
  }, []);

  useEffect(() => {
    if (!serviceReady) return;

    // TODO: Fetch all media instead of timeout
    const timer = setTimeout(
      () => {
        setAllMediaLoaded(true);
      },
      Math.floor(Math.random() * (3750 - 1250 + 1)) + 1250,
    );
    return () => clearTimeout(timer);
  }, [serviceReady]);

  useEffect(() => {
    if (!serviceReady) return;

    // TODO: Fetch all collections instead of timeout
    const timer = setTimeout(
      () => {
        setAllCollectionsLoaded(true);
      },
      Math.floor(Math.random() * (3750 - 1250 + 1)) + 1250,
    );
    return () => clearTimeout(timer);
  }, [serviceReady]);

  useEffect(() => {
    if (!serviceReady) return;

    // TODO: Fetch all prisms instead of timeout
    const timer = setTimeout(
      () => {
        setAllPrismsLoaded(true);
      },
      Math.floor(Math.random() * (3750 - 1250 + 1)) + 1250,
    );
    return () => clearTimeout(timer);
  }, [serviceReady]);

  useEffect(() => {
    if (!serviceReady) return;

    // TODO: Fetch all tags instead of timeout
    const timer = setTimeout(
      () => {
        setAllTagsLoaded(true);
      },
      Math.floor(Math.random() * (3750 - 1250 + 1)) + 1250,
    );
    return () => clearTimeout(timer);
  }, [serviceReady]);

  useEffect(() => {
    if (
      allMediaLoaded &&
      allCollectionsLoaded &&
      allPrismsLoaded &&
      allTagsLoaded
    ) {
      const timer = setTimeout(() => {
        navigate('/home');
      }, 500); // Wait 500ms after all icons load before navigating

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
  };
};

export default useSplashViewModel;
