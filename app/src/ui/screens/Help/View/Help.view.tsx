import { FC } from 'react';
import { HelpViewModel } from './Help.viewmodel';
import styles from './Help.module.css';

interface HelpViewProps {
  viewModel: HelpViewModel;
}

const HelpView: FC<HelpViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Help</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default HelpView;
