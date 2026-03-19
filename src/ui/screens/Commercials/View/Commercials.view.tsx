import { FC } from "react";
import { CommercialsViewModel } from "./Commercials.viewmodel";
import styles from "./Commercials.module.css";
import BufferItemList from "../../../components/BufferItemList/BufferItemList";

interface CommercialsViewProps {
  viewModel: CommercialsViewModel;
}

const CommercialsView: FC<CommercialsViewProps> = ({ viewModel }) => {
  const selectedCommercial: Commercial = viewModel.selectedCommercial
    ? viewModel.selectedCommercial
    : {
        mediaItemId: "",
        title: "",
        path: "",
        duration: 0,
        isHolidayExclusive: false,
        type: MediaType.Commercial,
        tags: [],
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
              onEdit={viewModel.editCommercial as (item: any) => void}
              onSave={viewModel.saveCommercial as (item: any) => void}
              onRemove={viewModel.onRemove as (item: any) => void}
              onAddItem={viewModel.addCommercials}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialsView;
