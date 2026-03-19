import { FC } from "react";
import { ShowsViewModel } from "./Shows.viewmodel";
import styles from "./Shows.module.css";
import MediaItemList from "../../../components/MediaItemList/MediaItemList";

interface ShowsViewProps {
  viewModel: ShowsViewModel;
}

const ShowsView: FC<ShowsViewProps> = ({ viewModel }) => {
  const selectedShow: Show = viewModel.selectedShow
    ? viewModel.selectedShow
    : {
        mediaItemId: "",
        title: "",
        durationLimit: 0,
        firstEpisodeOverDuration: false,
        episodeCount: 0,
        type: MediaType.Show,
        tags: [],
        secondaryTags: [],
        episodes: [],
      };
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Shows</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <MediaItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.shows}
              type="show"
              selectedItem={selectedShow}
              onEdit={viewModel.editShow}
              onSave={viewModel.saveShow}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addShow}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowsView;
