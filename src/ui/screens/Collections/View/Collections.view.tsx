import { FC } from "react";
import { CollectionsViewModel } from "./Collections.viewmodel";
import styles from "./Collections.module.css";
import CurationItemList from "../../../components/CurationItemList/CurationItemList";

interface CollectionsViewProps {
  viewModel: CollectionsViewModel;
}

const CollectionsView: FC<CollectionsViewProps> = ({ viewModel }) => {
  const selectedCollection = viewModel.selectedCollection
    ? viewModel.selectedCollection
    : { mediaItemId: "", title: "", description: "", items: [] };

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Collections</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <CurationItemList
              curationItem={selectedCollection}
              formType="collection"
              itemType="movies"
              curationList={viewModel.collections}
              mediaList={viewModel.movies}
              onEdit={viewModel.onEdit}
              onSave={viewModel.onSave}
              onSaveNew={viewModel.onSaveNew}
              onRemove={viewModel.onRemove}
              isEditModalOpen={viewModel.isEditModalOpen}
              onAddItem={viewModel.addCollection}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsView;
