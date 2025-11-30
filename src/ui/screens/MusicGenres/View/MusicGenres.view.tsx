import { FC } from "react";
import { MusicGenresViewModel } from "./MusicGenres.viewmodel";
import styles from "./MusicGenres.module.css";
import TagChipList from "../../../components/TagChipList/TagChipList";

interface MusicGenresViewProps {
  viewModel: MusicGenresViewModel;
}

const MusicGenresView: FC<MusicGenresViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Music Genres</div>
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

export default MusicGenresView;
