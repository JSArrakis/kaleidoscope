import { FC } from "react";
import { BumpersViewModel } from "./Bumpers.viewmodel";
import styles from "./Bumpers.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface BumpersViewProps {
  viewModel: BumpersViewModel;
}

const BumpersView: FC<BumpersViewProps> = ({ viewModel }) => {
  const selectedBumper: PrismMediaItem = viewModel.selectedBumper
    ? viewModel.selectedBumper
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
      <div className={styles.screenTitle}>Bumpers</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <BufferItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.bumpers}
              type="bumper"
              selectedItem={selectedBumper}
              onEdit={viewModel.editBumper}
              onSave={viewModel.saveBumper}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addBumpers}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BumpersView;
