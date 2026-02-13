import { FC, useRef, useState, useEffect } from "react";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
  onDateSelect?: (date: string) => void;
  onClose?: () => void;
  initialDate?: string;
}

const DatePicker: FC<DatePickerProps> = ({
  onDateSelect,
  onClose,
  initialDate,
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

  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Initialize with provided date if available
  useEffect(() => {
    if (initialDate) {
      const [month, day] = initialDate.split("/");
      if (month && day) {
        setSelectedMonth(months[parseInt(month) - 1]);
        setSelectedDay(parseInt(day));
      }
    }
  }, [initialDate]);

  const handlePreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    const previousIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setSelectedMonth(months[previousIndex]);
  };

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    const nextIndex = currentIndex === 11 ? 0 : currentIndex + 1;
    setSelectedMonth(months[nextIndex]);
  };

  const getDaysInMonth = (month: string): number => {
    const monthIndex = months.indexOf(month);
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysPerMonth[monthIndex];
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    const monthIndex = months.indexOf(selectedMonth) + 1;
    const formattedDate = `${String(monthIndex).padStart(2, "0")}/${String(selectedDay).padStart(2, "0")}`;

    if (onDateSelect) {
      onDateSelect(formattedDate);
    }
    if (onClose) {
      onClose();
    }
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={styles.datePickerWrapper}>
      <div className={styles.datePickerContainer}>
        <div className={styles.pickerSection}>
          <div className={styles.pickerLabel}>MONTH</div>
          <div className={styles.monthSelector}>
            <button
              className={styles.arrowButton}
              onClick={handlePreviousMonth}
            >
              ◀
            </button>
            <div className={styles.monthDisplay}>{selectedMonth}</div>
            <button className={styles.arrowButton} onClick={handleNextMonth}>
              ▶
            </button>
          </div>
        </div>

        <div className={styles.pickerSection}>
          <div className={styles.pickerLabel}>DAY</div>
          <div className={styles.dayGrid}>
            {days.map((day) => (
              <div
                key={day}
                className={`${styles.dayItem} ${
                  day === selectedDay ? styles.selected : ""
                }`}
                onClick={() => handleDaySelect(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.previewAndActions}>
        <div className={styles.datePreview}>
          {String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}/
          {String(selectedDay).padStart(2, "0")}
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

export default DatePicker;
