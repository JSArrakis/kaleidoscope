import { FC, use, useEffect, useRef, useState } from "react";
import styles from "./EpisodeEditForm.module.css";
import { getFileName } from "../../../common/helpers";
import { useGetAllAestheticTags } from "../../../services/tags/useAestheticTags";
import { useGetAllEraTags } from "../../../services/tags/useEraTags";
import { useGetAllGenreTags } from "../../../services/tags/useGenreTags";
import { useGetAllSpecialtyTags } from "../../../services/tags/useSpecialtyTags";
import { TAG_CATEGORIES } from "../../../common/constants";

interface EpisodeEditFormProps {
  episode: PrismEpisodeItem;
  onUpdateEpisode: (item: PrismEpisodeItem) => void;
  onClose: () => void;
}

const EpisodeEditForm: FC<EpisodeEditFormProps> = ({
  episode,
  onClose,
  onUpdateEpisode,
}) => {
  // +++++++++++++++++++++++++++++++++++++++++++
  //                  General
  // +++++++++++++++++++++++++++++++++++++++++++

  const [title, setTitle] = useState(episode.title);
  const [season, setSeason] = useState<string | undefined>(episode.season);
  const [episodeCount, setEpisodeCount] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number | undefined>(
    undefined
  );
  const [episodeNumberTwo, setEpisodeNumberTwo] = useState<number | undefined>(
    undefined
  );
  const [episodeNumberThree, setEpisodeNumberThree] = useState<
    number | undefined
  >(undefined);
  const [episodeNumberFour, setEpisodeNumberFour] = useState<
    number | undefined
  >(undefined);
  const [sequence, setSequence] = useState<number | undefined>(
    episode.episodeNumber
  );
  const titleRef = useRef<HTMLInputElement>(null);
  const seasonRef = useRef<HTMLInputElement>(null);
  const episodeRef = useRef<HTMLInputElement>(null);
  const episodeRefTwo = useRef<HTMLInputElement>(null);
  const episodeRefThree = useRef<HTMLInputElement>(null);
  const episodeRefFour = useRef<HTMLInputElement>(null);
  const sequenceRef = useRef<HTMLInputElement>(null);

  const handleAddEpisode = () => {
    if (episodeCount >= 4) return;
    setEpisodeCount(episodeCount + 1);
  };

  const handleRemoveEpisode = () => {
    if (episodeCount <= 1) return;
    setEpisodeCount(episodeCount - 1);
  };

  useEffect(() => {
    if (typeof episode.episode === "string") {
      const episodeNumbers = episode.episode
        .split(",")
        .map((num) => parseInt(num.trim(), 10));
      setEpisodeCount(episodeNumbers.length);
      setEpisodeNumber(episodeNumbers[0]);
      setEpisodeNumberTwo(episodeNumbers[1]);
      setEpisodeNumberThree(episodeNumbers[2]);
      setEpisodeNumberFour(episodeNumbers[3]);
    } else {
      setEpisodeNumber(undefined);
      setEpisodeNumberTwo(undefined);
      setEpisodeNumberThree(undefined);
      setEpisodeNumberFour(undefined);
    }
  }, [episode.episode]);

  // +++++++++++++++++++++++++++++++++++++++++++
  //                 Media Tags
  // +++++++++++++++++++++++++++++++++++++++++++

  // =============== Tag Select ================

  const $getAllAestheticTags = useGetAllAestheticTags();
  const $getAllEraTags = useGetAllEraTags();
  const $getAllGenreTags = useGetAllGenreTags();
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
  const [tagChipList, setTagChipList] = useState<string[]>(episode.tags);
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
  //                   Render
  // +++++++++++++++++++++++++++++++++++++++++++

  // ============== Form Handlers ==============

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(styles.hidePlaceholder);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.remove(styles.hidePlaceholder);
  };

  const handleUpdateEpisode = () => {
    console.log("HANDLE ON SAVE");
    const episodeNumbers = [
      episodeNumber,
      episodeNumberTwo,
      episodeNumberThree,
      episodeNumberFour,
    ]
      .filter((num) => num !== undefined)
      .map((num) => num?.toString())
      .join(",");

    const updatedEpisode: PrismEpisodeItem = {
      ...episode,
      title: title,
      season: season,
      episode: episodeNumbers,
      episodeNumber: sequence,
      tags: tagChipList,
    };

    onUpdateEpisode(updatedEpisode);
  };

  // =================== JSX ===================

  return (
    <div className={styles.editEpisodeModal}>
      <div className={styles.editModalHeader}>
        <div></div>
        <div className={styles.editModalCardTitle}>EDIT EPISODE</div>
        <div className={styles.closeEdit} onClick={() => onClose()}>
          <span className="material-symbols-rounded">close</span>
        </div>
      </div>
      {episode.path && (
        <div className={styles.fileContainer}>
          <div className={styles.fileLabel}>FILE:</div>
          <div className={styles.fileNameContainer}>
            <div className={styles.fileName}>{getFileName(episode.path)}</div>
          </div>
        </div>
      )}
      <div className={styles.editModalTitle}>
        <div className={styles.fileLabel}>TITLE:</div>
        <input
          className={styles.editInputField}
          type="text"
          placeholder="MEDIA TITLE"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          ref={titleRef}
        />
      </div>
      <div className={styles.orderContainer}>
        <div className={styles.seasonContainer}>
          <div className={styles.seasonLabel}>SEASON:</div>
          <input
            className={styles.seasonInput}
            type="text"
            placeholder="--"
            value={season !== undefined ? season : ""}
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
              if (/^\d{0,2}$/.test(value)) {
                setSeason(value === "" ? undefined : value);
              }
            }}
            ref={seasonRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div className={styles.episodeContainer}>
          <div className={styles.episodeLabel}> EPISODE:</div>
          <input
            className={styles.episodeInput}
            type="text"
            placeholder="---"
            value={episodeNumber !== undefined ? episodeNumber : ""}
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
              if (/^\d{0,3}$/.test(value)) {
                setEpisodeNumber(value === "" ? undefined : Number(value));
              }
            }}
            ref={episodeRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {episodeCount > 1 && (
            <input
              className={styles.episodeInput}
              type="text"
              placeholder="---"
              value={episodeNumberTwo !== undefined ? episodeNumberTwo : ""}
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
                if (/^\d{0,3}$/.test(value)) {
                  setEpisodeNumberTwo(value === "" ? undefined : Number(value));
                }
              }}
              ref={episodeRefTwo}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
          {episodeCount > 2 && (
            <input
              className={styles.episodeInput}
              type="text"
              placeholder="---"
              value={episodeNumberThree !== undefined ? episodeNumberThree : ""}
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
                if (/^\d{0,3}$/.test(value)) {
                  setEpisodeNumberThree(
                    value === "" ? undefined : Number(value)
                  );
                }
              }}
              ref={episodeRefThree}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
          {episodeCount > 3 && (
            <input
              className={styles.episodeInput}
              type="text"
              placeholder="---"
              value={episodeNumberFour !== undefined ? episodeNumberFour : ""}
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
                if (/^\d{0,3}$/.test(value)) {
                  setEpisodeNumberFour(
                    value === "" ? undefined : Number(value)
                  );
                }
              }}
              ref={episodeRefFour}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
          {episodeCount > 1 ? (
            episodeCount < 4 ? (
              <>
                <div
                  className={styles.addEpisode}
                  onClick={() => handleAddEpisode()}
                >
                  <span className="material-symbols-rounded">add</span>
                </div>
                <div
                  className={styles.removeEpisode}
                  onClick={() => handleRemoveEpisode()}
                  style={{
                    marginLeft: "5px",
                  }}
                >
                  <span className="material-symbols-rounded">close</span>
                </div>
              </>
            ) : (
              <div
                className={styles.removeEpisode}
                onClick={() => handleRemoveEpisode()}
              >
                <span className="material-symbols-rounded">close</span>
              </div>
            )
          ) : (
            <div
              className={styles.addEpisode}
              onClick={() => handleAddEpisode()}
            >
              <span className="material-symbols-rounded">add</span>
            </div>
          )}
        </div>
        <div className={styles.sequenceContainer}>
          <div className={styles.sequenceLabel}> SEQ #:</div>
          <input
            className={styles.sequenceInput}
            type="text"
            placeholder="---"
            value={sequence !== undefined ? sequence : ""}
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
              if (/^\d{0,5}$/.test(value)) {
                setSequence(value === "" ? undefined : Number(value));
              }
            }}
            ref={sequenceRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>
      <div className={styles.tagListHeader}>
        <div className={styles.fileLabel}>TAGS</div>
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
      <div className={styles.footer}>
        <div className={styles.mediaIdContainer}>
          <div className={styles.idLabel}>id:</div>
          <div className={styles.idValueContainer}>
            <div className={styles.idValue}>{episode?.mediaItemId}</div>
          </div>
        </div>
        <div
          className={styles.saveButton}
          onClick={() => handleUpdateEpisode()}
        >
          CONFIRM
        </div>
      </div>
    </div>
  );
};

export default EpisodeEditForm;
