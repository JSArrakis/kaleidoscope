import { FC, useEffect, useRef, useState } from "react";
import styles from "./MediaItemList.module.css";
import MediaListItem from "./MediaListItem/MediaListItem";
import MediaEditForm from "../MediaEditForm/MediaEditForm";
import Modal from "../Modal/Modal";

type MediaType = Show | Movie;

interface MediaItemListPropsMovie {
  mediaList: Movie[];
  type: string;
  isEditModalOpen: boolean;
  selectedItem: Movie;
  onEdit: (item: Movie) => void;
  onSave: (item: Movie) => void;
  onRemove: (item: Movie) => void;
  onAddItem: () => void;
}

interface MediaItemListPropsShow {
  mediaList: Show[];
  type: string;
  isEditModalOpen: boolean;
  selectedItem: Show;
  onEdit: (item: Show) => void;
  onSave: (item: Show) => void;
  onRemove: (item: Show) => void;
  onAddItem: () => void;
}

type MediaItemListProps = MediaItemListPropsMovie | MediaItemListPropsShow;

const MediaItemList: FC<MediaItemListProps> = ({
  mediaList,
  type,
  isEditModalOpen,
  selectedItem,
  onEdit,
  onSave,
  onRemove,
  onAddItem,
}) => {
  const [mediaListSearchTerm, setMediaListSearchTerm] = useState("");
  const searchMediaItemsRef = useRef<HTMLInputElement>(null);
  const [filteredMediaList, setFilteredMediaList] = useState<MediaType[]>(
    mediaList as MediaType[]
  );
  const [newTitle, setNewTitle] = useState("");
  const [hasOriginalTitle, setHasOriginalTitle] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      // find the item in the mediaList
      const item = mediaList.find(
        (item) => item.mediaItemId === selectedItem.mediaItemId
      );
      if (item) {
        // If item.title is not empty, set hasOriginalTitle to true
        if (item.title && item.title.trim() !== "") {
          setHasOriginalTitle(true);
        }
      }
    }
  }, [selectedItem, mediaList]);

  useEffect(() => {
    setFilteredMediaList(mediaList);
    setMediaListSearchTerm("");
  }, [mediaList]);

  useEffect(() => {
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(mediaList);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = mediaList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm)
      );
      setFilteredMediaList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [mediaListSearchTerm, mediaList]);

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
        {filteredMediaList.map((item) => (
          <MediaListItem
            key={item.mediaItemId}
            item={item as any}
            setNewTitle={setNewTitle}
            onEdit={onEdit as any}
            onSave={onSave as any}
            onRemove={onRemove as any}
          />
        ))}
        <Modal
          isOpen={isEditModalOpen}
          fullScreen={false}
          style={{
            padding: "0px",
            maxWidth: "calc(100% - 170px)",
          }}
        >
          <MediaEditForm
            item={selectedItem as any}
            itemType={type}
            incomingTitle={selectedItem.title ? selectedItem.title : newTitle}
            hasOriginalTitle={hasOriginalTitle}
            onSave={onSave as any}
            onCancel={onEdit as any}
          />
        </Modal>
      </div>
    </div>
  );
};

export default MediaItemList;
