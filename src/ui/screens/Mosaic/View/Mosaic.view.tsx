import { FC, useMemo, useState } from "react";
import { Button, Modal } from "../../../components";
import { MosaicViewModel } from "./Mosaic.viewmodel";
import styles from "./Mosaic.module.css";

interface MosaicViewProps {
  viewModel: MosaicViewModel;
}

const MosaicView: FC<MosaicViewProps> = ({ viewModel }) => {
  const [mosaicSearchTerm, setMosaicSearchTerm] = useState("");
  const [genreSearchTerm, setGenreSearchTerm] = useState("");

  const filteredMosaics = useMemo(() => {
    const searchValue = mosaicSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return viewModel.mosaics;
    }

    return viewModel.mosaics.filter((mosaic) => {
      const name = (mosaic.name ?? "").toLowerCase();
      const description = (mosaic.description ?? "").toLowerCase();
      const facetLabel = viewModel.facetLabelById(mosaic.facetId).toLowerCase();
      return (
        name.includes(searchValue) ||
        description.includes(searchValue) ||
        facetLabel.includes(searchValue)
      );
    });
  }, [mosaicSearchTerm, viewModel]);

  const filteredMusicGenres = useMemo(() => {
    const searchValue = genreSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return viewModel.musicGenres;
    }

    return viewModel.musicGenres.filter((genre) =>
      genre.name.toLowerCase().includes(searchValue),
    );
  }, [genreSearchTerm, viewModel.musicGenres]);

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Mosaic</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            <div className={styles.itemHeader}>
              <div
                className={styles.addItem}
                onClick={viewModel.openCreateModal}
              >
                <span className="material-symbols-rounded">add</span>
              </div>
              <div className={styles.searchContainer}>
                <div className={styles.searchField}>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="SEARCH MOSAICS"
                    value={mosaicSearchTerm}
                    onChange={(event) =>
                      setMosaicSearchTerm(event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {viewModel.statusMessage && (
              <div className={styles.statusMessage}>
                {viewModel.statusMessage}
              </div>
            )}

            <div className={styles.listContainer}>
              {filteredMosaics.map((mosaic) => (
                <article key={mosaic.mosaicId} className={styles.listItem}>
                  <div className={styles.listItemMain}>
                    <div className={styles.listItemTitle}>
                      {mosaic.name ?? "Untitled Mosaic"}
                    </div>
                    <div className={styles.meta}>
                      {viewModel.facetLabelById(mosaic.facetId)}
                    </div>
                    {mosaic.description && (
                      <div className={styles.description}>
                        {mosaic.description}
                      </div>
                    )}

                    <div className={styles.tagWrap}>
                      {mosaic.musicalGenres.map((tagId) => (
                        <span key={tagId} className={styles.tagChip}>
                          {viewModel.genreLabelById(tagId)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.inlineActions}>
                    <Button
                      onClick={() => viewModel.editMosaic(mosaic)}
                      className={styles.linkButton}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => viewModel.deleteMosaic(mosaic.mosaicId)}
                      className={styles.dangerButton}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <Modal
              isOpen={viewModel.isEditModalOpen}
              fullScreen={false}
              style={{
                padding: "0px",
                width: "fit-content",
                height: "fit-content",
                maxWidth: "calc(100% - 170px)",
              }}
            >
              <div className={styles.modalBody}>
                <div className={styles.editModalHeader}>
                  <div />
                  <div className={styles.editModalCardTitle}>
                    {viewModel.editingMosaicId
                      ? "EDIT MOSAIC"
                      : "CREATE MOSAIC"}
                  </div>
                  <div
                    className={styles.closeModalBtn}
                    onClick={viewModel.closeModal}
                  >
                    <span className="material-symbols-rounded">close</span>
                  </div>
                </div>

                <label className={styles.label}>FACET</label>
                <select
                  className={styles.select}
                  value={viewModel.selectedFacetId}
                  onChange={(event) =>
                    viewModel.setSelectedFacetId(event.target.value)
                  }
                >
                  {viewModel.facets.map((facet) => (
                    <option key={facet.facetId} value={facet.facetId}>
                      {viewModel.facetLabelById(facet.facetId)}
                    </option>
                  ))}
                </select>

                <label className={styles.label}>NAME (OPTIONAL)</label>
                <input
                  className={styles.input}
                  type="text"
                  value={viewModel.mosaicName}
                  onChange={(event) =>
                    viewModel.setMosaicName(event.target.value)
                  }
                  placeholder="Late-Night Cyber Mood"
                />

                <div className={styles.genreHeader}>
                  <label className={styles.genreHeaderLabel}>
                    MUSICAL GENRES
                  </label>
                  <input
                    className={styles.genreSearchInput}
                    type="text"
                    placeholder="SEARCH GENRES"
                    value={genreSearchTerm}
                    onChange={(event) => setGenreSearchTerm(event.target.value)}
                  />
                </div>
                <div className={styles.genreGrid}>
                  {filteredMusicGenres.map((genre) => {
                    const checked = viewModel.selectedMusicGenreIds.includes(
                      genre.tagId,
                    );
                    return (
                      <label key={genre.tagId} className={styles.genreChip}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            viewModel.toggleMusicGenre(genre.tagId)
                          }
                        />
                        <span>{genre.name}</span>
                      </label>
                    );
                  })}
                </div>

                <div
                  className={`${styles.buttonRow} ${
                    !viewModel.editingMosaicId ? styles.createButtonRow : ""
                  }`}
                >
                  <Button
                    onClick={viewModel.saveMosaic}
                    className={styles.actionButton}
                  >
                    {viewModel.editingMosaicId
                      ? "UPDATE MOSAIC"
                      : "CREATE MOSAIC"}
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MosaicView;
