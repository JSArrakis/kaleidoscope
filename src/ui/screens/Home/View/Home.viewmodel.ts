import useRootStack from "../../../navigation/useRootStack";

interface HomeData {}
interface HomeActions {
  openPlayer: () => void;
}

export interface HomeViewModel extends HomeData, HomeActions {}

const useHomeViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): HomeViewModel => {
  return {
    openPlayer: () => navigate("/player"),
  };
};

export default useHomeViewModel;
