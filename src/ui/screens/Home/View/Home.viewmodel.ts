import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface HomeData {}
interface HomeActions {}

export interface HomeViewModel extends HomeData, HomeActions {}

const useHomeViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): HomeViewModel => {
  return {};
};

export default useHomeViewModel;
