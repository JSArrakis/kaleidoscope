import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface HelpData {}
interface HelpActions {}

export interface HelpViewModel extends HelpData, HelpActions {}

const useHelpViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): HelpViewModel => {
  return {};
};

export default useHelpViewModel;
