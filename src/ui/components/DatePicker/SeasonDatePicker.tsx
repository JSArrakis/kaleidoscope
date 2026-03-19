import { FC, useState, useEffect } from "react";
import styles from "./SeasonDatePicker.module.css";

interface SeasonDatePickerProps {
  onConfirm?: (startDate: string, endDate: string) => void;
  onClose?: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

const SeasonDatePicker: FC<SeasonDatePickerProps> = ({
  onConfirm,
  onClose,
  initialStartDate,
  initialEndDate,
}) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [startMonth, setStartMonth] = useState(months[0]);
  const [startDay, setStartDay] = useState(1);
  const [endMonth, setEndMonth] = useState(months[0]);
  const [endDay, setEndDay] = useState(1);

  // Initialize with provided dates if available
  useEffect(() => {
    if (initialStartDate) {
      const [month, day] = initialStartDate.split("/");
      if (month && day) {
        setStartMonth(months[parseInt(month) - 1]);
        setStartDay(parseInt(day));
      }
    }
    if (initialEndDate) {
      const [month, day] = initialEndDate.split("/");
      if (month && day) {
        setEndMonth(months[parseInt(month) - 1]);
        setEndDay(parseInt(day));
      }
    }
  }, [initialStartDate, initialEndDate]);

  const handleStartPreviousMonth = () => {
    const currentIndex = months.indexOf(startMonth);
    const previousIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setStartMonth(months[previousIndex]);
  };

  const handleStartNextMonth = () => {
    const currentIndex = months.indexOf(startMonth);
    const nextIndex = currentIndex === 11 ? 0 : currentIndex + 1;
    setStartMonth(months[nextIndex]);
  };

  const handleEndPreviousMonth = () => {
    const currentIndex = months.indexOf(endMonth);
    const previousIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setEndMonth(months[previousIndex]);
  };

  const handleEndNextMonth = () => {
    const currentIndex = months.indexOf(endMonth);
    const nextIndex = currentIndex === 11 ? 0 : currentIndex + 1;
    setEndMonth(months[nextIndex]);
  };

  const getDaysInMonth = (month: string): number => {
    const monthIndex = months.indexOf(month);
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysPerMonth[monthIndex];
  };

  const isValidRange = (): boolean => {
    return true;
  };

  const handleConfirm = () => {
    if (!isValidRange()) {
      return;
    }

    const startMonthIndex = months.indexOf(startMonth) + 1;
    const endMonthIndex = months.indexOf(endMonth) + 1;
    const formattedStart = `${String(startMonthIndex).padStart(2, "0")}/${String(startDay).padStart(2, "0")}`;
    const formattedEnd = `${String(endMonthIndex).padStart(2, "0")}/${String(endDay).padStart(2, "0")}`;

    if (onConfirm) {
      onConfirm(formattedStart, formattedEnd);
    }
    if (onClose) {
      onClose();
    }
  };

  const startDaysInMonth = getDaysInMonth(startMonth);
  const endDaysInMonth = getDaysInMonth(endMonth);
  const startDays = Array.from({ length: startDaysInMonth }, (_, i) => i + 1);
  const endDays = Array.from({ length: endDaysInMonth }, (_, i) => i + 1);

  return (
    <div className={styles.seasonDatePickerWrapper}>
      <div className={styles.seasonDatePickerContainer}>
        <div className={styles.pickerSection}>
          <div className={styles.sectionLabel}>START DATE</div>

          <div className={styles.pickerSubsection}>
            <div className={styles.pickerLabel}>MONTH</div>
            <div className={styles.monthSelector}>
              <button
                className={styles.arrowButton}
                onClick={handleStartPreviousMonth}
              >
                ◀
              </button>
              <div className={styles.monthDisplay}>{startMonth}</div>
              <button
                className={styles.arrowButton}
                onClick={handleStartNextMonth}
              >
                ▶
              </button>
            </div>
          </div>

          <div className={styles.pickerSubsection}>
            <div className={styles.pickerLabel}>DAY</div>
            <div className={styles.dayGrid}>
              {startDays.map((day) => (
                <div
                  key={day}
                  className={`${styles.dayItem} ${
                    day === startDay ? styles.selected : ""
                  }`}
                  onClick={() => setStartDay(day)}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.divider}>→</div>

        <div className={styles.pickerSection}>
          <div className={styles.sectionLabel}>END DATE</div>

          <div className={styles.pickerSubsection}>
            <div className={styles.pickerLabel}>MONTH</div>
            <div className={styles.monthSelector}>
              <button
                className={styles.arrowButton}
                onClick={handleEndPreviousMonth}
              >
                ◀
              </button>
              <div className={styles.monthDisplay}>{endMonth}</div>
              <button
                className={styles.arrowButton}
                onClick={handleEndNextMonth}
              >
                ▶
              </button>
            </div>
          </div>

          <div className={styles.pickerSubsection}>
            <div className={styles.pickerLabel}>DAY</div>
            <div className={styles.dayGrid}>
              {endDays.map((day) => (
                <div
                  key={day}
                  className={`${styles.dayItem} ${
                    day === endDay ? styles.selected : ""
                  }`}
                  onClick={() => setEndDay(day)}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewAndActions}>
        <div className={styles.dateRangePreview}>
          <span>
            {String(months.indexOf(startMonth) + 1).padStart(2, "0")}/
            {String(startDay).padStart(2, "0")}
          </span>
          <span className={styles.arrow}>→</span>
          <span>
            {String(months.indexOf(endMonth) + 1).padStart(2, "0")}/
            {String(endDay).padStart(2, "0")}
          </span>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.cancelButton} onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
          <button className={styles.confirmButton} onClick={handleConfirm}>
            <span className="material-symbols-rounded">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonDatePicker;
