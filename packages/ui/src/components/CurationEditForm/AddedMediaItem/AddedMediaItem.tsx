import { FC, useRef } from "react";
import styles from "./AddedMediaItem.module.css";

interface AddedMediaItemProps {
  item: PrismCurationItem;
  onRemove: (item: PrismCurationItem) => void;
  onUpdateSequence: (item: PrismCurationItem, sequence: number | null) => void;
}

const AddedMediaItem: FC<AddedMediaItemProps> = ({
  item,
  onRemove,
  onUpdateSequence,
}) => {
  const itemSequenceRef = useRef<HTMLInputElement>(null);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(styles.hidePlaceholder);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.remove(styles.hidePlaceholder);
  };

  return (
    <div className={styles.mediaItem}>
      <div className={styles.undoRemove} onClick={() => onRemove(item)}>
        <span className="material-symbols-rounded">close</span>
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{item.mediaItemTitle}</div>
      </div>
      <div className={styles.sequenceContainer}>
        <div className={styles.sequenceLabel}> SEQ #</div>
        <input
          className={styles.sequenceInput}
          type="text"
          placeholder="---"
          value={
            item.sequence !== null && item.sequence !== undefined
              ? item.sequence
              : ""
          }
          onKeyDown={(e) => {
            if (
              !/[0-9]/.test(e.key) &&
              ![
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
              ].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const value = e.target.value;
            // Ensure the value is at most 3 digits
            if (/^\d{0,3}$/.test(value)) {
              onUpdateSequence(item, value === "" ? null : Number(value));
            }
          }}
          ref={itemSequenceRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
};

export default AddedMediaItem;
