import { FC } from "react";
import { FacetsViewModel } from "./Facets.viewmodel";
import styles from "./Facets.module.css";

interface FacetsViewProps {
  viewModel: FacetsViewModel;
}

const FacetsView: FC<FacetsViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Facets</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
        </div>
      </div>
    </div>
  );
};

export default FacetsView;
