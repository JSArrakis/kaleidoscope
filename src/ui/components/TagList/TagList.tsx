import { FC, useEffect, useRef, useState } from "react";
import styles from "./TagList.module.css";
import HolidayTag from "./HolidayTags/HolidayTag";
import AgeGroup from "./AgeGroup/AgeGroup";

interface TagListProps {
  tags: Tag[];
  type: string;
  selectedItem: Tag;
  onSave: (item: Tag) => void;
  onRemove: (item: Tag) => void;
  onAddItem: () => void;
  onEdit: (item: Tag) => void;
}

const TagList: FC<TagListProps> = ({
  tags,
  type,
  selectedItem,
  onSave,
  onRemove,
  onEdit,
  onAddItem,
}) => {
  const [mediaListSearchTerm, setMediaListSearchTerm] = useState("");
  const searchMediaItemsRef = useRef<HTMLInputElement>(null);
  const [filteredMediaList, setFilteredMediaList] = useState<Tag[]>(tags);



  useEffect(() => {
    setFilteredMediaList(tags);
    setMediaListSearchTerm("");
  }, [tags]);

  useEffect(() => {
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(tags);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = tags.filter(
        (item) => item.name && item.name.toLowerCase().includes(searchTerm)
      );
      setFilteredMediaList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [mediaListSearchTerm, tags]);

  return (
    <div className={styles.itemContainer}>
      <div className={styles.itemHeader}>
        <div className={styles.addItem} onClick={onAddItem}>
          <span className="material-symbols-rounded">add</span>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchField}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="SEARCH TITLE"
              value={mediaListSearchTerm}
              onChange={(e) => setMediaListSearchTerm(e.target.value)}
              ref={searchMediaItemsRef}
            />
          </div>
        </div>
      </div>
      <div className={styles.mediaList}>
        {filteredMediaList.map((item) => {
          if (type === "holiday") {
            return (
              <HolidayTag
                key={item.tagId}
                item={item}
                onSave={onSave}
                onRemove={onRemove}
                onEdit={onEdit}
              />
            );
          } else if (type === "age group") {
            return (
              <AgeGroup
                key={item.tagId}
                item={item}
                onSave={onSave}
                onRemove={onRemove}
              />
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
};

export default TagList;
