import { FC } from 'react';
import assets from '../../../assets';
import classNames from 'classnames';
import { ActivityBar } from '../../../components';
import styles from './Splash.module.css';
import 'material-symbols';
import { SplashViewModel } from './Splash.viewmodel';

// Define the prop types
interface SplashViewProps {
  viewModel: SplashViewModel;
}

const SplashView: FC<SplashViewProps> = ({ viewModel }) => {
  const {
    allMediaLoaded,
    allCollectionsLoaded,
    allPrismsLoaded,
    allTagsLoaded,
  } = viewModel;

  return (
    <div className={styles.screen}>
      <img src={assets.PNG.klogo} alt="Logo" className={styles.logo} />
      <ActivityBar barStyle={{ marginTop: '20px', width: '256px' }} />
      <div className={styles.loaderIconContainer}>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: allMediaLoaded,
          })}
        >
          <span className="material-symbols-rounded">movie</span>
        </div>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: allCollectionsLoaded,
          })}
        >
          <span className="material-symbols-rounded">calendar_month</span>
        </div>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: allTagsLoaded,
          })}
        >
          <span className="material-symbols-rounded">bookmarks</span>
        </div>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: allPrismsLoaded,
          })}
        >
          <span className="material-symbols-rounded">diamond</span>
        </div>
      </div>
    </div>
  );
};

export default SplashView;
