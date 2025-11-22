import { FC, useRef, useState, useEffect } from "react";
import styles from "./DatePicker.module.css";

interface DatePickerProps {}

const DatePicker: FC<DatePickerProps> = () => {
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

  const [visibleMonths, setVisibleMonths] = useState([
    months[10],
    months[11],
    months[0],
    months[1],
    months[2],
  ]);
 

  const handleScrollup = () => {
    // if index 0 is at the top, add index 11 to the front of the array and remove the last element
    if (visibleMonths[0] === months[0]) {
      setVisibleMonths((prev) => [
        months[11],
        ...prev.slice(0, prev.length - 1),
      ]);
    } else {
      setVisibleMonths((prev) => [
        months[months.indexOf(prev[0]) - 1],
        ...prev.slice(0, prev.length - 1),
      ]);
    }
  };

  const handleScrollDown = () => {
    // if index 11 is at the bottom, add index 0 to the end of the array and remove the first element
    if (visibleMonths[visibleMonths.length - 1] === months[11]) {
      setVisibleMonths((prev) => [
        ...prev.slice(1),
        months[0],
      ]);
    } else {
      setVisibleMonths((prev) => [
        ...prev.slice(1),
        months[months.indexOf(prev[visibleMonths.length - 1]) + 1],
      ]);
    }
  };

  return (
    <div className={styles.datePickerContainer}>
      <button className={styles.arrowButton} onClick={handleScrollup}>
        ▲
      </button>
      <div className={styles.monthCarousel}>
        {visibleMonths.map((month, index) => (
          <div key={index} className={styles.monthItem}>
            {month}
          </div>
        ))}
      </div>
      <button className={styles.arrowButton} onClick={handleScrollDown}>
        ▼
      </button>
    </div>
  );
};

export default DatePicker;
