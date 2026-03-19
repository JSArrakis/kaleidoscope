import { FC } from "react";
import { SpecialtiesViewModel } from "./Specialties.viewmodel";
import styles from "./Specialties.module.css";
import TagChipList from "../../../components/TagChipList/TagChipList";

interface SpecialtiesViewProps {
  viewModel: SpecialtiesViewModel;
}

const SpecialtiesView: FC<SpecialtiesViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Specialties</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <TagChipList
              items={viewModel.items}
              item={viewModel.item}
              type="tag"
              setItem={viewModel.setItem}
              onAdd={viewModel.addTag}
              onRemove={viewModel.removeTag}
              onSearch={viewModel.searchTags}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialtiesView;
