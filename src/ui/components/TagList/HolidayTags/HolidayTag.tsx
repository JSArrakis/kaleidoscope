import { FC, useEffect, useRef, useState } from "react";
import styles from "./HolidayTag.module.css";
import DatePicker from "../../DatePicker/DatePicker";
import SeasonDatePicker from "../../DatePicker/SeasonDatePicker";

interface HolidayProps {
  item: Tag;
  onSave: (item: Tag) => void;
  onRemove: (item: Tag) => void;
  onEdit: (item: Tag) => void;
}

const Holiday: FC<HolidayProps> = ({ item, onSave, onRemove, onEdit }) => {
  const [name, setName] = useState(item.name || "");
  const [date, setDate] = useState(item.holidayDates?.[0] || "");
  const [seasonStartDate, setSeasonStartDate] = useState(
    item.seasonStartDate || "",
  );
  const [seasonEndDate, setSeasonEndDate] = useState(item.seasonEndDate || "");
  const [hasIncomingTitle, setHasIncomingTitle] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isTitleFlashing, setIsTitleFlashing] = useState(false);
  const [isDateFlashing, setIsDateFlashing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);

  useEffect(() => {
    if (item.name) {
      setName(item.name);
      setHasIncomingTitle(true);
    }
  }, [item.name]);

  useEffect(() => {
    if (item.holidayDates?.[0]) {
      setDate(item.holidayDates[0]);
    }
  }, [item.holidayDates]);

  useEffect(() => {
    if (item.seasonStartDate) {
      setSeasonStartDate(item.seasonStartDate);
    }
  }, [item.seasonStartDate]);

  useEffect(() => {
    if (item.seasonEndDate) {
      setSeasonEndDate(item.seasonEndDate);
    }
  }, [item.seasonEndDate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleTitleSave = () => {
    if (!name.trim() || !date.trim()) {
      if (!name.trim()) {
        setIsTitleFlashing(true);
        setTimeout(() => setIsTitleFlashing(false), 1000);
      }
      if (!date.trim()) {
        setIsDateFlashing(true);
        setTimeout(() => setIsDateFlashing(false), 1000);
      }
      return;
    }
    onSave({
      ...item,
      name,
      holidayDates: [date],
      seasonStartDate,
      seasonEndDate,
    });
  };

  const handleUndo = () => {
    setShowRemoveConfirm(false);
  };

  const handleDateSelect = (selectedDate: string) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleSeasonDatesSelect = (startDate: string, endDate: string) => {
    setSeasonStartDate(startDate);
    setSeasonEndDate(endDate);
    setShowSeasonPicker(false);

    // Auto-save the holiday with the new season dates
    setTimeout(() => {
      onSave({
        ...item,
        name,
        holidayDates: [date],
        seasonStartDate: startDate,
        seasonEndDate: endDate,
      });
    }, 0);
  };

  return (
    <div className={styles.mediaItem}>
      {showDatePicker && (
        <div className={styles.editModalOverlay}>
          <DatePicker
            onDateSelect={handleDateSelect}
            onClose={() => setShowDatePicker(false)}
            initialDate={date}
          />
        </div>
      )}
      {showSeasonPicker && (
        <div className={styles.editModalOverlay}>
          <SeasonDatePicker
            onConfirm={handleSeasonDatesSelect}
            onClose={() => setShowSeasonPicker(false)}
            initialStartDate={seasonStartDate}
            initialEndDate={seasonEndDate}
          />
        </div>
      )}
      <div className={styles.mainContainer}>
        <div className={styles.removeRow}>
          {showRemoveConfirm ? (
            <div className={styles.undoRemove} onClick={() => handleUndo()}>
              <span className="material-symbols-rounded">undo</span>
            </div>
          ) : (
            <div
              className={styles.closeRow}
              onClick={() =>
                hasIncomingTitle ? setShowRemoveConfirm(true) : onRemove(item)
              }
            >
              <span className="material-symbols-rounded">close</span>
            </div>
          )}
          {showRemoveConfirm && (
            <div
              className={styles.confirmRemove}
              onClick={() => onRemove(item)}
            >
              <span className="material-symbols-rounded">close</span>
            </div>
          )}
        </div>
        <div className={styles.itemContent}>
          {hasIncomingTitle ? (
            <div className={styles.itemTitleContainer}>
              <div className={styles.itemTitle}>{name}</div>
            </div>
          ) : (
            <div className={styles.titleInputContainer}>
              <input
                type="text"
                value={name}
                onChange={handleTitleChange}
                placeholder="ENTER TITLE"
                className={`${styles.titleInput} ${
                  isTitleFlashing ? styles.flashRed : ""
                }`}
              />
            </div>
          )}
        </div>
      </div>
      <div className={styles.secondaryContainer}>
        <div className={styles.dateLabel}>DATE</div>
        <div
          className={`${styles.date} ${isDateFlashing ? styles.flashRed : ""}`}
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          {date ? date : "MM/DD"}
        </div>
      </div>
      <div className={styles.actionsRow}>
        {!hasIncomingTitle && (
          <div className={styles.saveRow} onClick={handleTitleSave}>
            <span className="material-symbols-rounded">save</span>
          </div>
        )}
        <div
          className={styles.editRow}
          onClick={() => setShowSeasonPicker(true)}
        >
          <span className="material-symbols-rounded">edit_square</span>
        </div>
      </div>
    </div>
  );
};

export default Holiday;
