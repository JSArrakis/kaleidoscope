import { FC } from "react";
import { ShortsViewModel } from "./Shorts.viewmodel";
import styles from "./Shorts.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface ShortsViewProps {
  viewModel: ShortsViewModel;
}

const ShortsView: FC<ShortsViewProps> = ({ viewModel }) => {
  const selectedShort: PrismMediaItem = viewModel.selectedShort
    ? viewModel.selectedShort
    : {
        mediaItemId: "",
        title: "",
        alias: "",
        imdb: "",
        tags: [],
        blocks: [],
        episodeCount: 0,
        episodes: [],
      };
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Shorts</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <BufferItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.shorts}
              type="short"
              selectedItem={selectedShort}
              onEdit={viewModel.editShort}
              onSave={viewModel.saveShort}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addShorts}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortsView;
