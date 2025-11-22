import { FC, useEffect, useState } from "react";
import styles from "./TagChip.module.css";

interface TagChipProps {
  item: Tag;
  onRemove: (item: Tag) => void;
}

const TagChip: FC<TagChipProps> = ({ item, onRemove }) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleUndo = () => {
    setShowRemoveConfirm(false);
  };

  return (
    <div className={styles.tagItem}>
      <div className={styles.removeRow}>
        {showRemoveConfirm ? (
          <div className={styles.undoRemove} onClick={() => handleUndo()}>
            <span className="material-symbols-rounded">undo</span>
          </div>
        ) : (
          <div
            className={styles.closeRow}
            onClick={() => setShowRemoveConfirm(true)}
          >
            <span className="material-symbols-rounded">close</span>
          </div>
        )}
        {showRemoveConfirm && (
          <div className={styles.confirmRemove} onClick={() => onRemove(item)}>
            <span className="material-symbols-rounded">close</span>
          </div>
        )}
      </div>
      <div className={styles.itemContent}>{item.name}</div>
    </div>
  );
};

export default TagChip;
