import { FC, useEffect, useRef, useState } from "react";
import styles from "./AgeGroup.module.css";

interface AgeGroupProps {
  item: Tag;
  onSave: (item: Tag) => void;
  onRemove: (item: Tag) => void;
}

const AgeGroup: FC<AgeGroupProps> = ({ item, onSave, onRemove }) => {
  const [name, setName] = useState(item.name || "");
  const [hasIncomingTitle, setHasIncomingTitle] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isTitleFlashing, setIsTitleFlashing] = useState(false);
  const [itemSequence, setItemSequence] = useState<number | null>(
    item.sequence || null
  );
  const [isSequenceFlashing, setIsSequenceFlashing] = useState(false);
  const itemSequenceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item.name) {
      setName(item.name);
      setHasIncomingTitle(true);
    }
  }, [item.name]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleTitleSave = () => {
    if (!name.trim() || !itemSequence) {
      if (!name.trim()) {
        setIsTitleFlashing(true);
        setTimeout(() => setIsTitleFlashing(false), 1000);
      }
      if (!itemSequence) {
        setIsSequenceFlashing(true);
        setTimeout(() => setIsSequenceFlashing(false), 1000);
      }
      return;
    }
    onSave({ ...item, name, sequence: itemSequence });
  };

  const handleUndo = () => {
    setShowRemoveConfirm(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(styles.hidePlaceholder);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.remove(styles.hidePlaceholder);
  };

  return (
    <div className={styles.mediaItem}>
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
        <div className={styles.sequenceContainer}>
          <div className={styles.sequenceLabel}>SEQ #</div>
          <input
            className={`${styles.sequenceInput} ${
              isSequenceFlashing ? styles.flashRed : ""
            }`}
            type="text"
            placeholder="---"
            value={
              itemSequence !== null && itemSequence !== undefined
                ? itemSequence
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
                setItemSequence(value === "" ? null : Number(value));
              }
            }}
            ref={itemSequenceRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        {(!hasIncomingTitle || item.sequence !== itemSequence) && (
          <div className={styles.saveRow} onClick={handleTitleSave}>
            <span className="material-symbols-rounded">save</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgeGroup;
