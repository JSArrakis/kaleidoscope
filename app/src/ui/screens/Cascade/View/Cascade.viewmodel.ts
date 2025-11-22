import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface CascadeData {}
interface CascadeActions {}

export interface CascadeViewModel extends CascadeData, CascadeActions {}

const useCascadeViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): CascadeViewModel => {
  return {};
};

export default useCascadeViewModel;
