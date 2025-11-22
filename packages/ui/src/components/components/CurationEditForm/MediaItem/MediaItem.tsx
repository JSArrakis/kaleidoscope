import { FC } from "react";
import styles from "./MediaItem.module.css";

interface MediaItemProps {
  item: PrismMediaItem;
  onAdd: (item: PrismMediaItem) => void;
}

const MediaItem: FC<MediaItemProps> = ({ item, onAdd }) => {
  return (
    <div className={styles.mediaItem}>
      <div className={styles.undoRemove} onClick={() => onAdd(item)}>
        <span className="material-symbols-rounded">add</span>
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{item.title}</div>
      </div>
    </div>
  );
};

export default MediaItem;
