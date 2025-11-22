import { FC } from "react";
import { MusicVideosViewModel } from "./Music.viewmodel";
import styles from "./Music.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface MusicVideosViewProps {
  viewModel: MusicVideosViewModel;
}

const MusicVideosView: FC<MusicVideosViewProps> = ({ viewModel }) => {
  const selectedMusicVideo: PrismMediaItem = viewModel.selectedMusicVideo
    ? viewModel.selectedMusicVideo
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
      <div className={styles.screenTitle}>MusicVideos</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <BufferItemList
              isEditModalOpen={viewModel.isEditModalOpen}
              mediaList={viewModel.musicVideos}
              type="music"
              selectedItem={selectedMusicVideo}
              onEdit={viewModel.editMusicVideo}
              onSave={viewModel.saveMusicVideo}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addMusicVideos}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicVideosView;
