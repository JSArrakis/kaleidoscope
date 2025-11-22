import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface MosaicData {}
interface MosaicActions {}

export interface MosaicViewModel extends MosaicData, MosaicActions {}

const useMosaicViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): MosaicViewModel => {
  return {};
};

export default useMosaicViewModel;
