import { FC } from "react";
import { HolidaysViewModel } from "./Holidays.viewmodel";
import styles from "./Holidays.module.css";
import TagList from "../../../components/TagList/TagList";

interface HolidaysViewProps {
  viewModel: HolidaysViewModel;
}

const HolidaysView: FC<HolidaysViewProps> = ({ viewModel }) => {
  const selectedHoliday = viewModel.selectedHoliday
    ? viewModel.selectedHoliday
    : {
        tagId: "",
        name: "",
      };

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Holidays</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <TagList
              tags={viewModel.holidays}
              type="holiday"
              selectedItem={selectedHoliday}
              onSave={viewModel.onSave}
              onRemove={viewModel.onRemove}
              onAddItem={viewModel.addHoliday}
              onEdit={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidaysView;
