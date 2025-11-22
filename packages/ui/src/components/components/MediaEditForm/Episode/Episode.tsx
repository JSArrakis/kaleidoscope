import { FC, use, useEffect, useRef, useState } from "react";
import styles from "./Episode.module.css";
import { getFileName } from "../../../common/helpers";

interface EpisodeProps {
  episode: PrismEpisodeItem;
  onEdit: (item: PrismEpisodeItem) => void;
  onRemoveEpisode: (item: PrismEpisodeItem) => void;
  onUpdateSequence: (item: PrismEpisodeItem, sequence: number | null) => void;
}

const Episode: FC<EpisodeProps> = ({
  episode,
  onUpdateSequence,
  onRemoveEpisode,
  onEdit,
}) => {
  const episodeSequenceRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState<string>();

  useEffect(() => {
    setTitle(episode.title || "");
  }, [episode.title]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.add(styles.hidePlaceholder);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.classList.remove(styles.hidePlaceholder);
  };

  return (
    <div className={styles.episode}>
      <div className={styles.closeRow} onClick={() => onRemoveEpisode(episode)}>
        <span
          style={{
            fontVariationSettings: "'opsz' 20",
          }}
          className="material-symbols-rounded"
        >
          close
        </span>
      </div>
      <div className={styles.dataContainer}>
        {title !== "" && (
          <div className={styles.titleContainer}>
            <div className={styles.title}>{title}</div>
          </div>
        )}
        <div className={styles.itemPathContainer}>
          <div className={styles.itemPath}>{getFileName(episode.path)}</div>
        </div>
      </div>
      {(!!episode.season || !!episode.episode) && (
        <div className={styles.orderContainer}>
          <div className={styles.orderLabel}>S:</div>
          <div className={styles.seasonNumber}>
            {episode.season ? episode.season : "--"}
          </div>
          <div className={styles.seperator} />
          <div className={styles.orderLabel}>E:</div>
          <div className={styles.episodeNumber}>
            {episode.episode ? episode.episode : "---"}
          </div>
        </div>
      )}
      <div className={styles.sequenceContainer}>
        <div className={styles.sequenceLabel}> SEQ #</div>
        <input
          className={styles.sequenceInput}
          type="text"
          placeholder="---"
          value={
            episode.episodeNumber !== null &&
            episode.episodeNumber !== undefined
              ? episode.episodeNumber
              : ""
          }
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
              onUpdateSequence(episode, value === "" ? null : Number(value));
            }
          }}
          ref={episodeSequenceRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <div className={styles.editRow} onClick={() => onEdit(episode)}>
        <span
          style={{
            fontVariationSettings: "'opsz' 20",
          }}
          className="material-symbols-rounded"
        >
          edit_square
        </span>
      </div>
    </div>
  );
};

export default Episode;
