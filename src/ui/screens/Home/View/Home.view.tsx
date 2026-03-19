import { FC } from "react";
import { HomeViewModel } from "./Home.viewmodel";
import styles from "./Home.module.css";

interface HomeViewProps {
  viewModel: HomeViewModel;
}

const HomeView: FC<HomeViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Home</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
