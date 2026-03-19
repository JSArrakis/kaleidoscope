import { FC } from "react";
import { GenresViewModel } from "./Genres.viewmodel";
import styles from "./Genres.module.css";
import TagChipList from "../../../components/TagChipList/TagChipList";

interface GenresViewProps {
  viewModel: GenresViewModel;
}

const GenresView: FC<GenresViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Genres</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}></div>
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
  );
};

export default GenresView;
