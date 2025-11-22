import { FC } from 'react';
import { SettingsViewModel } from './Settings.viewmodel';
import styles from './Settings.module.css';

interface SettingsViewProps {
  viewModel: SettingsViewModel;
}

const SettingsView: FC<SettingsViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Settings</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
