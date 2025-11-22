import { FC, useState, useRef, useEffect, use } from "react";
import styles from "./BufferEditForm.module.css";
import { getFileName, normalizeItem } from "../../common/helpers";
import {
  EPISODE_SEARCH_CATEGORIES,
  TAG_CATEGORIES,
} from "../../common/constants";
import { useGetAllAestheticTags } from "../../services/tags/useAestheticTags";
import { useGetAllEraTags } from "../../services/tags/useEraTags";
import { useGetAllGenreTags } from "../../services/tags/useGenreTags";
import { useGetAllSpecialtyTags } from "../../services/tags/useSpecialtyTags";
import { useGetAllAgeGroups } from "../../services/tags/useAgeGroups";
import { useGetAllHolidays } from "../../services/tags/useHolidays";

interface BufferEditFormProps {
  item: PrismMediaItem;
  itemType: string;
  incomingTitle: string;
  hasOriginalTitle: boolean;
  onSave: (item: PrismMediaItem) => void;
  onCancel: (item: PrismMediaItem) => void;
}

const BufferEditForm: FC<BufferEditFormProps> = ({
  item,
  itemType,
  incomingTitle,
  hasOriginalTitle,
  onSave,
  onCancel,
}) => {
  // +++++++++++++++++++++++++++++++++++++++++++
  //               Media Labels
  // +++++++++++++++++++++++++++++++++++++++++++

  const [title, setTitle] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(incomingTitle);
  }, [incomingTitle]);

  // +++++++++++++++++++++++++++++++++++++++++++
  //                 Media Tags
  // +++++++++++++++++++++++++++++++++++++++++++

  // =============== Tag Select ================

  const $getAllAestheticTags = useGetAllAestheticTags();
  const $getAllAgeGroupTags = useGetAllAgeGroups();
  const $getAllEraTags = useGetAllEraTags();
  const $getAllGenreTags = useGetAllGenreTags();
  const $getAllHolidayTags = useGetAllHolidays();
  const $getAllSpecialtyTags = useGetAllSpecialtyTags();

  const [aestheticTags, setAestheticTags] = useState<Tag[]>([]);
  const [ageGroupTags, setAgeGroupTags] = useState<Tag[]>([]);
  const [eraTags, setEraTags] = useState<Tag[]>([]);
  const [genreTags, setGenreTags] = useState<Tag[]>([]);
  const [holidayTags, setHolidayTags] = useState<Tag[]>([]);
  const [specialtyTags, setSpecialtyTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    if ($getAllAestheticTags.data) {
      setAestheticTags($getAllAestheticTags.data);
    }
  }, [$getAllAestheticTags.data]);

  useEffect(() => {
    if ($getAllAgeGroupTags.data) {
      setAgeGroupTags($getAllAgeGroupTags.data);
    }
  }, [$getAllAgeGroupTags.data]);

  useEffect(() => {
    if ($getAllEraTags.data) {
      setEraTags($getAllEraTags.data);
    }
  }, [$getAllEraTags.data]);

  useEffect(() => {
    if ($getAllGenreTags.data) {
      setGenreTags($getAllGenreTags.data);
    }
  }, [$getAllGenreTags.data]);

  useEffect(() => {
    if ($getAllHolidayTags.data) {
      setHolidayTags($getAllHolidayTags.data);
    }
  }, [$getAllHolidayTags.data]);

  useEffect(() => {
    if ($getAllSpecialtyTags.data) {
      setSpecialtyTags($getAllSpecialtyTags.data);
    }
  }, [$getAllSpecialtyTags.data]);

  useEffect(() => {
    setAllTags([
      ...genreTags,
      ...aestheticTags,
      ...specialtyTags,
      ...ageGroupTags,
      ...eraTags,
      ...holidayTags,
    ]);
  }, [
    aestheticTags,
    ageGroupTags,
    eraTags,
    genreTags,
    holidayTags,
    specialtyTags,
  ]);

  const [currentSelectedCategory, setCurrentSelectedCategory] =
    useState<string>(TAG_CATEGORIES.ALL);
  const [tagChipList, setTagChipList] = useState<string[]>(item.tags);
  const [selectedTagList, setSelectedTagList] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    TAG_CATEGORIES.ALL
  );
  const [currentSelectedTagList, setCurrentSelectedTagList] = useState<
    string[]
  >([]);
  const tagListRef = useRef<HTMLSelectElement>(null);

  // =============== Tag Search ================

  const [tagListSearchTerm, setTagListSearchTerm] = useState("");
  const searchTagsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tagListSearchTerm.trim() === "") {
      setSelectedTagList(currentSelectedTagList);
      setSelectedCategory(currentSelectedCategory);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      setSelectedCategory(TAG_CATEGORIES.ALL);
      const searchTerm = tagListSearchTerm.toLowerCase();
      console.log("searchTerm", searchTerm);
      const filteredList = allTags
        .filter(
          (item) => item.name && item.name.toLowerCase().includes(searchTerm)
        )
        .map((tag) => tag.name);
      setSelectedTagList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [tagListSearchTerm, allTags]);

  useEffect(() => {
    if (tagListSearchTerm.trim() === "") {
      switch (selectedCategory) {
        case TAG_CATEGORIES.AGE_GROUP:
          setSelectedTagList(ageGroupTags.map((tag) => tag.name));
          setCurrentSelectedTagList(ageGroupTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.AGE_GROUP);
          break;
        case TAG_CATEGORIES.GENRE:
          setSelectedTagList(genreTags.map((tag) => tag.name));
          setCurrentSelectedTagList(genreTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.GENRE);
          break;
        case TAG_CATEGORIES.AESTHETIC:
          setSelectedTagList(aestheticTags.map((tag) => tag.name));
          setCurrentSelectedTagList(aestheticTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.AESTHETIC);
          break;
        case TAG_CATEGORIES.SPECIALTY:
          setSelectedTagList(specialtyTags.map((tag) => tag.name));
          setCurrentSelectedTagList(specialtyTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.SPECIALTY);
          break;
        case TAG_CATEGORIES.ERA:
          setSelectedTagList(eraTags.map((tag) => tag.name));
          setCurrentSelectedTagList(eraTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.ERA);
          break;
        case TAG_CATEGORIES.HOLIDAY:
          setSelectedTagList(holidayTags.map((tag) => tag.name));
          setCurrentSelectedTagList(holidayTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.HOLIDAY);
          break;
        default:
          setSelectedTagList(allTags.map((tag) => tag.name));
          setCurrentSelectedTagList(allTags.map((tag) => tag.name));
          setCurrentSelectedCategory(TAG_CATEGORIES.ALL);
          break;
      }
    }
  }, [
    selectedCategory,
    tagListSearchTerm,
    allTags,
    ageGroupTags,
    genreTags,
    aestheticTags,
    specialtyTags,
    eraTags,
    holidayTags,
  ]);

  // ============== Tag Controls ===============

  const handleAddChip = () => {
    const selectedTag = tagListRef.current?.value;

    if (selectedTag && !tagChipList.includes(selectedTag)) {
      setTagChipList([...tagChipList, selectedTag]);
    }
    setTagListSearchTerm("");
  };

  const handleRemoveChip = (chip: string) => {
    setTagChipList(tagChipList.filter((item) => item !== chip));
  };

  // +++++++++++++++++++++++++++++++++++++++++++
  //                 Episodes
  // +++++++++++++++++++++++++++++++++++++++++++

  const [displayEpisodes, setDisplayEpisodes] = useState(false);
  const [savedEpisodes, setSavedEpisodes] = useState<PrismEpisodeItem[]>([]);
  const [newEpisodes, setNewEpisodes] = useState<PrismEpisodeItem[]>([]);
  const [episodeList, setEpisodeList] = useState<PrismEpisodeItem[]>([]);
  const [selectedEpisode, setSelectedEpisode] =
    useState<PrismEpisodeItem | null>(null);
  const [showEditEpisodeModal, setShowEditEpisodeModal] = useState(false);

  useEffect(() => {
    if (item.episodes) {
      setSavedEpisodes(item.episodes);
    }
  }, [item.episodes]);

  useEffect(() => {
    let currentEpisodes: PrismEpisodeItem[] = [];
    const sequencedEpisodes = savedEpisodes.filter(
      (episode) => episode.episodeNumber !== undefined
    );
    const sortedEpisodes = sequencedEpisodes.sort(
      (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
    );
    currentEpisodes = [...newEpisodes, ...sortedEpisodes];
    setEpisodeList(currentEpisodes);
  }, [newEpisodes, savedEpisodes]);

  const [episodeSearchTerm, setEpisodeSearchTerm] = useState("");
  const [filteredEpisodeList, setFilteredEpisodeList] = useState<
    PrismEpisodeItem[]
  >([]);
  const [episodeSearchCategory, setEpisodeSearchCategory] = useState<string>(
    EPISODE_SEARCH_CATEGORIES.PATH
  );

  useEffect(() => {
    setFilteredEpisodeList(episodeList);
    setEpisodeSearchTerm("");
  }, [episodeList]);

  useEffect(() => {
    if (episodeSearchTerm.trim() === "") {
      setFilteredEpisodeList(episodeList);
      return;
    }

    const debouncedSearch = setTimeout(() => {
      const searchTerm = episodeSearchTerm.toLowerCase();
      const filteredList = episodeList.filter((item) => {
        switch (episodeSearchCategory) {
          case EPISODE_SEARCH_CATEGORIES.PATH:
            return item.path?.toLowerCase().includes(searchTerm);
          case EPISODE_SEARCH_CATEGORIES.TITLE:
            return item.title?.toLowerCase().includes(searchTerm);
          case EPISODE_SEARCH_CATEGORIES.TAGS:
            return item.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm)
            );
          case EPISODE_SEARCH_CATEGORIES.SEASON:
            return item.season?.toString().includes(searchTerm);
          case EPISODE_SEARCH_CATEGORIES.EPISODE:
            return item.episode?.toString().includes(searchTerm);
          default:
            return false;
        }
      });
      setFilteredEpisodeList(filteredList);
    }, 600);

    return () => clearTimeout(debouncedSearch);
  }, [episodeSearchTerm, episodeSearchCategory, episodeList]);

  const searchEpisodesRef = useRef<HTMLInputElement>(null);

  const onRemoveEpisode = (item: PrismEpisodeItem) => {
    const newEpisodeList: PrismEpisodeItem[] = episodeList.filter(
      (ep) => ep.mediaItemId !== item.mediaItemId
    );

    setEpisodeList(newEpisodeList);
  };

  const onUpdateEpisodeSequence = (
    item: PrismEpisodeItem,
    sequence: number | null
  ) => {
    const newEpisodeList: PrismEpisodeItem[] = episodeList.map((originalItem) =>
      originalItem.mediaItemId === item.mediaItemId
        ? { ...originalItem, episodeNumber: sequence ?? undefined }
        : originalItem
    );

    setEpisodeList(newEpisodeList);
  };

  const onAddEpisode = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newEpisodes = filePaths.map((episodePath: string) => ({
        mediaItemId: normalizeItem(episodePath),
        title: "",
        path: episodePath,
        tags: [],
      }));

      setNewEpisodes((prev) => [...prev, ...newEpisodes]);
    }
  };

  const onEditEpisode = (item: PrismEpisodeItem) => {
    setSelectedEpisode(item);
    setShowEditEpisodeModal(true);
  };

  const closeEditEpisode = () => {
    setShowEditEpisodeModal(false);
    setSelectedEpisode(null);
  };

  const onUpdateEpisode = (item: PrismEpisodeItem) => {
    console.log("ON UPDATE EPISODE", item);
    // Remove incoming episode from episdodeList
    const updatedEpisodeList = episodeList.filter(
      (episode) => episode.mediaItemId !== item.mediaItemId
    );
    // Add updated episode to episodeList
    const newEpisodeList = [...updatedEpisodeList, item];
    // Sort episodeList by episodeNumber, and put undefined at the beginning
    // Filter out undefined episodeNumbers
    const sequencedEpisodes = newEpisodeList.filter(
      (episode) => episode.episodeNumber !== undefined
    );
    // Sort by episodeNumber
    const sortedEpisodes = sequencedEpisodes.sort(
      (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0)
    );
    // Add back episodes with undefined episodeNumbers
    const unsortedEpisodes = newEpisodeList.filter(
      (episode) => episode.episodeNumber === undefined
    );
    // Concatenate sorted and unsorted episodes
    const finalEpisodes = [...unsortedEpisodes, ...sortedEpisodes];

    // Set episodeList
    setEpisodeList(finalEpisodes);
    // Close edit episode modal
    setShowEditEpisodeModal(false);
    setSelectedEpisode(null);
  };

  // +++++++++++++++++++++++++++++++++++++++++++
  //                  General
  // +++++++++++++++++++++++++++++++++++++++++++

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const curationListRef = useRef<HTMLDivElement>(null);

  const handleSectionToggle = () => {
    if (item.episodes) {
      setDisplayEpisodes(!displayEpisodes);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 1000);
      return;
    }

    const itemsWithoutSequence = episodeList.filter(
      (item) =>
        Number.isNaN(item.episodeNumber) ||
        item.episodeNumber === null ||
        item.episodeNumber === undefined
    );

    const duplicateNumbers = episodeList
      .map((item) => item.episodeNumber)
      .filter(
        (num, index, self) => num !== undefined && self.indexOf(num) !== index
      );

    const uniqueDuplicateNumbers = [...new Set(duplicateNumbers)];

    if (itemsWithoutSequence.length > 0) {
      setWarningModalMessage(
        "Some items are missing a sequence. Please add sequences before saving."
      );
      setDisplayEpisodes(true);
      setEpisodeSearchTerm("");
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    }

    if (uniqueDuplicateNumbers.length > 0) {
      const displayedDuplicates = uniqueDuplicateNumbers.slice(0, 5);
      setWarningModalMessage(
        `Some items have duplicate sequences: ${displayedDuplicates.join(
          ", "
        )}${
          uniqueDuplicateNumbers.length > 5 ? ", ..." : ""
        }. Please update sequences before saving.`
      );
      setDisplayEpisodes(true);
      setEpisodeSearchTerm("");
      setShowWarningModal(true);
      setTimeout(() => setShowWarningModal(false), 2000);
      return;
    }

    const newTags = tagChipList.length > 0 ? tagChipList : ["Default"];

    let updatedItem: PrismMediaItem = {
      ...item,
      title,
      tags: newTags,
    };

    if (item.episodes) {
      updatedItem.episodes = episodeList;
    }

    onSave(updatedItem);
  };

  // +++++++++++++++++++++++++++++++++++++++++++
  //                   Render
  // +++++++++++++++++++++++++++++++++++++++++++

  return (
    <div className={styles.simpleItemEditContainer}>
      <div className={styles.editModalHeader}>
        <div></div>
        <div className={styles.editModalCardTitle}>
          EDIT {itemType.toUpperCase()}
        </div>
        <div className={styles.closeEdit} onClick={() => onCancel(item)}>
          <span className="material-symbols-rounded">close</span>
        </div>
      </div>
      {item.path && (
        <div className={styles.fileContainer}>
          <div className={styles.fileLabel}>FILE:</div>
          <div className={styles.fileNameContainer}>
            <div className={styles.fileName}>{getFileName(item.path)}</div>
          </div>
        </div>
      )}
      <div className={styles.topContainer}>
        <div className={styles.mediaLabels}>
          <div className={styles.editModalTitle}>
            <div className={styles.fileLabel}>TITLE:</div>
            {!hasOriginalTitle ? (
              <input
                className={`${styles.editInputField} ${
                  isFlashing ? styles.flashRed : ""
                }`}
                type="text"
                placeholder="MEDIA TITLE"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                ref={titleRef}
              />
            ) : (
              <div className={styles.titleContainer}>
                <div className={styles.idValue}>{title}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.bottomContainer}>
        <div className={styles.tagListHeader}>
          <div
            className={
              item.episodes ? styles.toggleButton : styles.disabledButton
            }
            onClick={() => handleSectionToggle()}
          >
            TAGS
          </div>
          <select
            className={styles.dropdown}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {Object.values(TAG_CATEGORIES).map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            className={styles.tagListSearchInput}
            type="text"
            placeholder="TAG SEARCH"
            value={tagListSearchTerm}
            onChange={(e) => setTagListSearchTerm(e.target.value)}
            ref={searchTagsRef}
          />
        </div>
        <div className={styles.tagListContainer}>
          <select multiple className={styles.tagList} ref={tagListRef}>
            {selectedTagList.map((tag, index) => (
              <option key={index} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <div className={styles.addChipButton} onClick={handleAddChip}>
            <span className="material-symbols-rounded">add</span>
          </div>
          <div className={styles.tagChipList}>
            {tagChipList.map((chip, index) => (
              <div key={index} className={styles.tagChip}>
                {chip}
                <button
                  className={styles.closeButton}
                  onClick={() => handleRemoveChip(chip)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.editModalId}>
        <div className={styles.mediaIdContainer}>
          <div className={styles.idLabel}>id:</div>
          <div className={styles.idValueContainer}>
            <div className={styles.idValue}>{item.mediaItemId}</div>
          </div>
        </div>
        <div className={styles.saveButton} onClick={() => handleSave()}>
          SAVE
        </div>
      </div>
    </div>
  );
};

export default BufferEditForm;
