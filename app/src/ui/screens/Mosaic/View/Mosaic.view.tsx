import { FC } from 'react';
import { MosaicViewModel } from './Mosaic.viewmodel';
import styles from './Mosaic.module.css';

interface MosaicViewProps {
  viewModel: MosaicViewModel;
}

const MosaicView: FC<MosaicViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Mosaic</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default MosaicView;
