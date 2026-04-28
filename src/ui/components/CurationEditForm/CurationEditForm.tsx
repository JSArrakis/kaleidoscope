import { FC, useState, useRef, useEffect } from "react";
import styles from "./CurationEditForm.module.css";
import MediaItem from "./MediaItem/MediaItem";
import AddedMediaItem from "./AddedMediaItem/AddedMediaItem";

type EditableCollectionItem = Omit<CollectionItem, "sequence"> & {
  sequence?: number;
};

interface CurationEditFormProps {
  curationItem: Collection;
  mediaList: Movie[];
  formType: string;
  itemType: string;
  onCancel: (item: Collection) => void;
  onSave: (item: Collection) => void;
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
    EditableCollectionItem[]
  >([]);
  const [filteredMediaList, setFilteredMediaList] = useState<Movie[]>([]);
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
    const incomingItems: EditableCollectionItem[] = curationItem.items.map(
      (item) => ({
        ...item,
        title: item.title ?? "",
      }),
    );

    const filteredMediaList = mediaList.filter(
      (media) =>
        !incomingItems.some((item) => item.mediaItemId === media.mediaItemId),
    );

    setCurrentItemCurationList(incomingItems);
    setFilteredMediaList(filteredMediaList);
  }, []);

  useEffect(() => {
    const filteredMediaList = mediaList.filter(
      (media) =>
        !currentItemCurationList.some(
          (item) => item.mediaItemId === media.mediaItemId,
        ),
    );
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(filteredMediaList);
      return;
    } else {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = filteredMediaList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm),
      );
      setFilteredMediaList(filteredList);
    }
  }, [currentItemCurationList]);

  // ============== List Controls ==============

  const onAdd = (item: Movie) => {
    const newCurationItemList: EditableCollectionItem[] = [
      ...currentItemCurationList,
      {
        collectionItemId: `${curationItem.collectionId}:${item.mediaItemId}`,
        collectionId: curationItem.collectionId,
        mediaItemId: item.mediaItemId,
        title: item.title || "",
        sequence: currentItemCurationList.length + 1,
      },
    ];

    const newFilteredMediaList: Movie[] = filteredMediaList.filter(
      (media) => media.mediaItemId !== item.mediaItemId,
    );

    setCurrentItemCurationList(newCurationItemList);
    setFilteredMediaList(newFilteredMediaList);
  };

  const onRemove = (item: EditableCollectionItem) => {
    const newCurationItemList: EditableCollectionItem[] =
      currentItemCurationList.filter(
        (media) => media.mediaItemId !== item.mediaItemId,
      );

    const mediaItemToAddBack = mediaList.find(
      (media) => media.mediaItemId === item.mediaItemId,
    );

    if (!mediaItemToAddBack) {
      console.error("Media item not found in mediaList:", item.mediaItemId);
      return;
    }

    const newFilteredMediaList: Movie[] = [
      ...filteredMediaList,
      mediaItemToAddBack as Movie,
    ];

    setCurrentItemCurationList(newCurationItemList);
    setFilteredMediaList(newFilteredMediaList);
  };

  const onUpdateSequence = (
    item: EditableCollectionItem,
    sequence: number | null,
  ) => {
    const newCurationItemList: EditableCollectionItem[] =
      currentItemCurationList.map((originalItem) =>
        originalItem.mediaItemId === item.mediaItemId
          ? { ...originalItem, sequence: sequence ?? undefined }
          : originalItem,
      );

    setCurrentItemCurationList(newCurationItemList);
  };

  // ============= Search Controls =============

  useEffect(() => {
    const currentFilteredMediaList = mediaList.filter(
      (media) =>
        !currentItemCurationList.some(
          (item) => item.mediaItemId === media.mediaItemId,
        ),
    );
    if (mediaListSearchTerm.trim() === "") {
      setFilteredMediaList(currentFilteredMediaList);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = mediaListSearchTerm.toLowerCase();
      const filteredList = currentFilteredMediaList.filter(
        (item) => item.title && item.title.toLowerCase().includes(searchTerm),
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
        item.sequence === undefined,
    );
    const itemsWithDuplicateSequence = currentItemCurationList.filter(
      (item, index, self) =>
        self.findIndex((t) => t.sequence === item.sequence) !== index,
    );
    if (itemsWithoutSequence.length > 0) {
      setWarningModalMessage(
        "Some items are missing a sequence. Please add sequences before saving.",
      );
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    } else if (itemsWithDuplicateSequence.length > 0) {
      setWarningModalMessage(
        "Some items have duplicate sequences. Please update sequences before saving.",
      );
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    } else {
      const updatedItem: Collection = {
        collectionId: curationItem.collectionId,
        title: title,
        description: curationItem.description,
        itemCount: currentItemCurationList.length,
        items: currentItemCurationList.map((item, index) => ({
          ...item,
          collectionItemId:
            item.collectionItemId ||
            `${curationItem.collectionId}:${item.mediaItemId}:${item.sequence ?? index + 1}`,
          collectionId: curationItem.collectionId,
          sequence: item.sequence ?? index + 1,
        })),
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
