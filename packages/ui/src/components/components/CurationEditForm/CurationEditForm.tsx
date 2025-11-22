import { FC, useState, useRef, useEffect } from "react";
import styles from "./CurationEditForm.module.css";
import MediaItem from "./MediaItem/MediaItem";
import AddedMediaItem from "./AddedMediaItem/AddedMediaItem";

interface CurationEditFormProps {
  curationItem: PrismCurationObj;
  mediaList: PrismMediaItem[];
  formType: string;
  itemType: string;
  onCancel: (item: PrismCurationObj) => void;
  onSave: (item: PrismCurationObj) => void;
}

const CurationEditForm: FC<CurationEditFormProps> = ({
  curationItem,
  formType,
  itemType,
  mediaList,
  onCancel,
  onSave,
}) => {
  // +++++++++++++++++++++++++++++++++++++++++++
  //               States and Refs
  // +++++++++++++++++++++++++++++++++++++++++++

  // ========== Item Lists and States ==========

  const [title, setTitle] = useState(curationItem.title);
  const [currentItemCurationList, setCurrentItemCurationList] = useState<
    PrismCurationItem[]
  >([]);
  const [filteredMediaList, setFilteredMediaList] = useState<PrismMediaItem[]>(
    []
  );
  const titleRef = useRef<HTMLInputElement>(null);

  // ============== Search States ==============

  const [mediaListSearchTerm, setMediaListSearchTerm] = useState("");
  const searchMediaRef = useRef<HTMLInputElement>(null);

  // =========== Warning Modal States ==========

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");

  // +++++++++++++++++++++++++++++++++++++++++++
  //            Effects and Callbacks
  // +++++++++++++++++++++++++++++++++++++++++++

  // ========== Initial State Setters ==========

  useEffect(() => {
    const incomingItems: PrismCurationItem[] = curationItem.items.map(
      (item) => {
        return {
          mediaItemId: item.mediaItemId,
          mediaItemTitle: item.mediaItemTitle,
          sequence: item.sequence,
        };
      }
    );

    const filteredMediaList = mediaList.filter(
      (media) =>
        !incomingItems.some((item) => item.mediaItemId === media.mediaItemId)
    );

    setCurrentItemCurationList(incomingItems);
    setFilteredMediaList(filteredMediaList);
  }, []);

  useEffect(() => {
    const filteredMediaList = mediaList.filter(
      (media) =>
        !currentItemCurationList.some(
          (item) => item.mediaItemId === media.mediaItemId
        )
    );
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(filteredMediaList);
      return;
    } else {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = filteredMediaList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm)
      );
      setFilteredMediaList(filteredList);
    }
  }, [currentItemCurationList]);

  // ============== List Controls ==============

  const onAdd = (item: PrismMediaItem) => {
    const newCurationItemList: PrismCurationItem[] = [
      ...currentItemCurationList,
      {
        mediaItemId: item.mediaItemId,
        mediaItemTitle: item.title || "",
      },
    ];

    const newFilteredMediaList: PrismMediaItem[] = filteredMediaList.filter(
      (media) => media.mediaItemId !== item.mediaItemId
    );

    setCurrentItemCurationList(newCurationItemList);
    setFilteredMediaList(newFilteredMediaList);
  };

  const onRemove = (item: PrismCurationItem) => {
    const newCurationItemList: PrismCurationItem[] =
      currentItemCurationList.filter(
        (media) => media.mediaItemId !== item.mediaItemId
      );

    const mediaItemToAddBack = mediaList.find(
      (media) => media.mediaItemId === item.mediaItemId
    );

    if (!mediaItemToAddBack) {
      console.error("Media item not found in mediaList:", item.mediaItemId);
      return;
    }

    const newFilteredMediaList: PrismMediaItem[] = [
      ...filteredMediaList,
      mediaItemToAddBack,
    ];

    setCurrentItemCurationList(newCurationItemList);
    setFilteredMediaList(newFilteredMediaList);
  };

  const onUpdateSequence = (
    item: PrismCurationItem,
    sequence: number | null
  ) => {
    const newCurationItemList: PrismCurationItem[] =
      currentItemCurationList.map((originalItem) =>
        originalItem.mediaItemId === item.mediaItemId
          ? { ...originalItem, sequence: sequence ?? undefined }
          : originalItem
      );

    setCurrentItemCurationList(newCurationItemList);
  };

  // ============= Search Controls =============

  useEffect(() => {
    const currentFilteredMediaList = mediaList.filter(
      (media) =>
        !currentItemCurationList.some(
          (item) => item.mediaItemId === media.mediaItemId
        )
    );
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(currentFilteredMediaList);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = currentFilteredMediaList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm)
      );
      setFilteredMediaList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [mediaListSearchTerm, filteredMediaList]);

  // ============== Save Controls ==============

  const handleSave = () => {
    const itemsWithoutSequence = currentItemCurationList.filter(
      (item) =>
        Number.isNaN(item.sequence) ||
        item.sequence === null ||
        item.sequence === undefined
    );
    const itemsWithDuplicateSequence = currentItemCurationList.filter(
      (item, index, self) =>
        self.findIndex((t) => t.sequence === item.sequence) !== index
    );
    if (itemsWithoutSequence.length > 0) {
      setWarningModalMessage(
        "Some items are missing a sequence. Please add sequences before saving."
      );
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    } else if (itemsWithDuplicateSequence.length > 0) {
      setWarningModalMessage(
        "Some items have duplicate sequences. Please update sequences before saving."
      );
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    } else {
      const updatedItem: PrismCurationObj = {
        title: title,
        mediaItemId: title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        description: "",
        items: currentItemCurationList,
      };

      onSave(updatedItem);
    }
  };

  // +++++++++++++++++++++++++++++++++++++++++++
  //                   Render
  // +++++++++++++++++++++++++++++++++++++++++++

  // ============== Form Handlers ==============

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(styles.hidePlaceholder);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.remove(styles.hidePlaceholder);
  };

  // =================== JSX ===================

  return (
    <div className={styles.curationEditContainer}>
      {showWarningModal && (
        <div className={styles.warningModal}>{warningModalMessage}</div>
      )}
      <div className={styles.editModalHeader}>
        <div></div>
        <div className={styles.editModalCardTitle}>
          EDIT {formType.toUpperCase()} MEDIA
        </div>
        <div
          className={styles.closeEdit}
          onClick={() => onCancel(curationItem)}
        >
          <span className="material-symbols-rounded">close</span>
        </div>
      </div>
      {curationItem.title ? (
        <div className={styles.title}>{curationItem.title}</div>
      ) : (
        <input
          className={styles.titleInput}
          type="text"
          placeholder={"TITLE"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={titleRef}
        />
      )}
      <div className={styles.curationMedia}>
        {currentItemCurationList.map((mediaItem) => (
          <AddedMediaItem
            key={mediaItem.mediaItemId}
            item={mediaItem}
            onRemove={onRemove}
            onUpdateSequence={onUpdateSequence}
          />
        ))}
      </div>
      <div className={styles.controlsRow}>
        <input
          className={styles.itemSearch}
          type="text"
          placeholder={`SEARCH ${itemType.toUpperCase()}`}
          value={mediaListSearchTerm}
          onChange={(e) => setMediaListSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={searchMediaRef}
        />
        <div className={styles.saveButton} onClick={() => handleSave()}>
          SAVE
        </div>
      </div>
      <div className={styles.candidateMedia}>
        {filteredMediaList.map((mediaItem) => (
          <MediaItem
            key={mediaItem.mediaItemId}
            item={mediaItem}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
};

export default CurationEditForm;
