import { FC } from "react";
import { CommercialsViewModel } from "./Commercials.viewmodel";
import styles from "./Commercials.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface CommercialsViewProps {
  viewModel: CommercialsViewModel;
}

const CommercialsView: FC<CommercialsViewProps> = ({ viewModel }) => {
  const selectedCommercial: PrismMediaItem = viewModel.selectedCommercial
    ? viewModel.selectedCommercial
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
      <div className={styles.screenTitle}>Commercials</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <BufferItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.commercials}
              type="commercial"
              selectedItem={selectedCommercial}
              onEdit={viewModel.editCommercial}
              onSave={viewModel.saveCommercial}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addCommercials}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialsView;
