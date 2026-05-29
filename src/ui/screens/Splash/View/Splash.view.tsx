import { FC } from "react";
import assets from "../../../assets";
import classNames from "classnames";
import { ActivityBar } from "../../../components";
import styles from "./Splash.module.css";
import "material-symbols";
import { SplashViewModel } from "./Splash.viewmodel";

// Define the prop types
interface SplashViewProps {
  viewModel: SplashViewModel;
}

const SplashView: FC<SplashViewProps> = ({ viewModel }) => {
  const { anchorContentLoaded, facetWalkabilityLoaded, cadenceBufferLoaded } =
    viewModel;

  return (
    <div className={styles.screen}>
      <img src={assets.PNG.klogo} alt="Logo" className={styles.logo} />
      <ActivityBar barStyle={{ marginTop: "20px", width: "256px" }} />
      <div className={styles.loaderIconContainer}>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: anchorContentLoaded,
          })}
        >
          <span className="material-symbols-rounded">video_library</span>
        </div>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: facetWalkabilityLoaded,
          })}
        >
          <span className="material-symbols-rounded">hub</span>
        </div>
        <div
          className={classNames(styles.iconContainer, {
            [styles.loadedIconContainer]: cadenceBufferLoaded,
          })}
        >
          <span className="material-symbols-rounded">hourglass_top</span>
        </div>
      </div>
    </div>
  );
};

export default SplashView;
