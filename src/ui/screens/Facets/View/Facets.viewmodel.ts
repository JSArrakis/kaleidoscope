import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface FacetsData {}
interface FacetsActions {}

export interface FacetsViewModel extends FacetsData, FacetsActions {}

const useFacetsViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): FacetsViewModel => {
  return {};
};

export default useFacetsViewModel;