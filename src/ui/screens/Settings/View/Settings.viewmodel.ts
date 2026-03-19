import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface SettingsData {}
interface SettingsActions {}

export interface SettingsViewModel extends SettingsData, SettingsActions {}

const useSettingsViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): SettingsViewModel => {
  return {};
};

export default useSettingsViewModel;
