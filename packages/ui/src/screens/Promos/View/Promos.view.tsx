import { FC } from "react";
import { PromosViewModel } from "./Promos.viewmodel";
import styles from "./Promos.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface PromosViewProps {
  viewModel: PromosViewModel;
}

const PromosView: FC<PromosViewProps> = ({ viewModel }) => {
  const selectedPromo: PrismMediaItem = viewModel.selectedPromo
    ? viewModel.selectedPromo
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
      <div className={styles.screenTitle}>Promos</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <BufferItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.promos}
              type="promo"
              selectedItem={selectedPromo}
              onEdit={viewModel.editPromo}
              onSave={viewModel.savePromo}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addPromos}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromosView;
