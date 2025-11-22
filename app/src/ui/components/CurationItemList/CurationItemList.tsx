import { FC, useEffect, useState, useCallback, useRef } from "react";
import styles from "./CurationItemList.module.css";
import Modal from "../Modal/Modal";
import CurationItem from "./CurationItem/CurationItem";
import CurationEditForm from "../CurationEditForm/CurationEditForm";
interface CurationItemListProps {
  curationItem: PrismCurationObj;
  curationList: PrismCurationObj[];
  formType: string;
  itemType: string;
  mediaList: PrismMediaItem[];
  isEditModalOpen: boolean;
  onAddItem: () => void;
  onEdit: (item: PrismCurationObj) => void;
  onSave: (item: PrismCurationObj) => void;
  onSaveNew: (item: PrismCurationObj) => void;
  onRemove: (item: PrismCurationObj) => void;
}

const CurationItemList: FC<CurationItemListProps> = ({
  curationItem,
  curationList,
  formType,
  itemType,
  mediaList,
  onEdit,
  onSave,
  onSaveNew,
  onRemove,
  isEditModalOpen,
  onAddItem,
}) => {
  const [curationListSearchTerm, setCurationListSearchTerm] = useState("");
  const searchCurationItemsRef = useRef<HTMLInputElement>(null);
  const [filteredCurationList, setFilterCurationList] =
    useState<PrismCurationObj[]>(curationList);

  useEffect(() => {
    setFilterCurationList(curationList);
    setCurationListSearchTerm("");
  }, [curationList]);

  useEffect(() => {
    if (curationListSearchTerm.trim() === "") {
      setFilterCurationList(curationList);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = curationListSearchTerm.toLowerCase();
      const filteredList = curationList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm)
      );
      setFilterCurationList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [curationListSearchTerm, curationList]);

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
              value={curationListSearchTerm}
              onChange={(e) => setCurationListSearchTerm(e.target.value)}
              ref={searchCurationItemsRef}
            />
          </div>
        </div>
      </div>
      <div className={styles.mediaList}>
        {filteredCurationList.map((item) => (
          <CurationItem
            key={item.mediaItemId}
            item={item}
            onEdit={onEdit}
            onSaveNew={onSaveNew}
            onRemove={onRemove}
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
          <CurationEditForm
            curationItem={curationItem}
            formType={formType}
            itemType={itemType}
            mediaList={mediaList}
            onCancel={onEdit}
            onSave={onSave}
          />
        </Modal>
      </div>
    </div>
  );
};

export default CurationItemList;
