import { FC } from 'react';
import { CascadeViewModel } from './Cascade.viewmodel';
import styles from './Cascade.module.css';

interface CascadeViewProps {
  viewModel: CascadeViewModel;
}

const CascadeView: FC<CascadeViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Cascade</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default CascadeView;
