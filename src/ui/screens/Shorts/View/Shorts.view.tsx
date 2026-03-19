import { FC } from "react";
import { ShortsViewModel } from "./Shorts.viewmodel";
import styles from "./Shorts.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface ShortsViewProps {
  viewModel: ShortsViewModel;
}

const ShortsView: FC<ShortsViewProps> = ({ viewModel }) => {
  const selectedShort: Short = viewModel.selectedShort
    ? viewModel.selectedShort
    : {
        mediaItemId: "",
        title: "",
        path: "",
        duration: 0,
        isHolidayExclusive: false,
        type: MediaType.Short,
        tags: [],
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
              onEdit={viewModel.editShort as (item: any) => void}
              onSave={viewModel.saveShort as (item: any) => void}
              onRemove={viewModel.onRemove as (item: any) => void}
              onAddItem={viewModel.addShorts}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortsView;
