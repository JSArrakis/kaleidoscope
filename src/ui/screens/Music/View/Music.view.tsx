import { FC } from "react";
import { MusicVideosViewModel } from "./Music.viewmodel";
import styles from "./Music.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface MusicVideosViewProps {
  viewModel: MusicVideosViewModel;
}

const MusicVideosView: FC<MusicVideosViewProps> = ({ viewModel }) => {
  const selectedMusicVideo: Music = viewModel.selectedMusicVideo
    ? viewModel.selectedMusicVideo
    : {
        mediaItemId: "",
        title: "",
        path: "",
        duration: 0,
        isHolidayExclusive: false,
        type: MediaType.Music,
        tags: [],
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
              onEdit={viewModel.editMusicVideo as (item: any) => void}
              onSave={viewModel.saveMusicVideo as (item: any) => void}
              onRemove={viewModel.onRemove as (item: any) => void}
              onAddItem={viewModel.addMusicVideos}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicVideosView;
