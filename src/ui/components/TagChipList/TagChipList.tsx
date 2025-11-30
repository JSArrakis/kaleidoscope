import { FC, useEffect, useState } from "react";
import styles from "./TagChipList.module.css";
import useDebounce from "../../hooks/useDebounce";
import TagChip from "./TagChip/TagChip";

interface TagChipListProps {
  items: Tag[];
  item: string;
  type: string;
  setItem(item: string): void;
  onRemove: (item: Tag) => void;
  onAdd: () => void;
  onSearch: (searchString: string) => void;
}

const TagChipList: FC<TagChipListProps> = ({
  items,
  item,
  type,
  setItem,
  onRemove,
  onAdd,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [flashRed, setFlashRed] = useState(false);
  const debouncedSearch = useDebounce(onSearch, 1000);

  useEffect(() => {
    if (!searchTerm) {
      return;
    }
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleAdd = () => {
    if (!item.trim()) {
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 1000);
      return;
    }
    onAdd();
  };

  return (
    <div className={styles.itemListContainer}>
      <div className={styles.itemListHeader}>
        <div className={styles.titleContainer}>
          <div className={styles.titleField}>
            <input
              className={`${styles.titleInput} ${
                flashRed ? styles.flashRed : ""
              }`}
              type="text"
              placeholder={`TAG TITLE`}
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>
          <div className={styles.addItem} onClick={handleAdd}>
            <span className="material-symbols-rounded">add</span>
          </div>
        </div>
        <div className={styles.searchContainer}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="SEARCH TAGS"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.chipField}>
        <div className={styles.itemList}>
          {items.map((chip) => (
            <TagChip key={chip.tagId} item={chip} onRemove={onRemove} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagChipList;
