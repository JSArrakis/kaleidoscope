import { FC } from "react";
import { AgeGroupsViewModel } from "./AgeGroups.viewmodel";
import styles from "./AgeGroups.module.css";
import TagList from "../../../components/TagList/TagList";
import _ from "lodash";

interface AgeGroupsViewProps {
  viewModel: AgeGroupsViewModel;
}

const AgeGroupsView: FC<AgeGroupsViewProps> = ({ viewModel }) => {

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Age Groups</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <TagList
              tags={viewModel.ageGroups}
              type="age group"
              onSave={viewModel.onSave}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addAgeGroup}
              onEdit={() => {}}
              selectedItem={{ tagId: "", name: "", sequence: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeGroupsView;
