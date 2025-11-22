import { FC } from "react";
import { ErasViewModel } from "./Eras.viewmodel";
import styles from "./Eras.module.css";
import TagChipList from "../../../components/TagChipList/TagChipList";

interface ErasViewProps {
  viewModel: ErasViewModel;
}

const ErasView: FC<ErasViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Eras</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <TagChipList
              items={viewModel.items}
              item={viewModel.item}
              type="tag"
              setItem={viewModel.setItem}
              onAdd={viewModel.addTag}
              onRemove={viewModel.removeTag}
              onSearch={viewModel.searchTags}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErasView;
