import { FC } from "react";
import { AestheticsViewModel } from "./Aesthetics.viewmodel";
import styles from "./Aesthetics.module.css";
import TagChipList from "../../../components/TagChipList/TagChipList";

interface AestheticsViewProps {
  viewModel: AestheticsViewModel;
}

const AestheticsView: FC<AestheticsViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Aesthetics</div>
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

export default AestheticsView;
