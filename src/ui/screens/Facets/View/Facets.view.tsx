import { FC, useMemo, useState } from "react";
import { Button, Modal } from "../../../components";
import { FacetsViewModel } from "./Facets.viewmodel";
import styles from "./Facets.module.css";

interface FacetsViewProps {
  viewModel: FacetsViewModel;
}

const FacetsView: FC<FacetsViewProps> = ({ viewModel }) => {
  const [facetSearchTerm, setFacetSearchTerm] = useState("");

  const filteredFacets = useMemo(() => {
    const searchValue = facetSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return viewModel.facets;
    }

    return viewModel.facets.filter(({ facet, label }) => {
      return (
        label.toLowerCase().includes(searchValue) ||
        facet.facetId.toLowerCase().includes(searchValue)
      );
    });
  }, [facetSearchTerm, viewModel.facets]);

  const editingFacet =
    viewModel.editingFacetId == null
      ? null
      : (viewModel.facets.find(
          ({ facet }) => facet.facetId === viewModel.editingFacetId,
        ) ?? null);

  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Facets</div>
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
                    placeholder="SEARCH FACETS"
                    value={facetSearchTerm}
                    onChange={(event) => setFacetSearchTerm(event.target.value)}
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
              {filteredFacets.map(({ facet, label }) => (
                <article key={facet.facetId} className={styles.listItem}>
                  <div className={styles.listItemMain}>
                    <div className={styles.listItemTitle}>{label}</div>
                    <div className={styles.meta}>ID: {facet.facetId}</div>
                    <div className={styles.meta}>
                      Relationships: {facet.facetRelationships.length}
                    </div>
                  </div>
                  <div className={styles.inlineActions}>
                    <Button
                      onClick={() => viewModel.openEditModal(facet.facetId)}
                      className={styles.linkButton}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => viewModel.deleteFacet(facet.facetId)}
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
                    {!editingFacet ? "CREATE FACET" : "EDIT FACET"}
                  </div>
                  <div
                    className={styles.closeModalBtn}
                    onClick={viewModel.closeModal}
                  >
                    <span className="material-symbols-rounded">close</span>
                  </div>
                </div>

                {!editingFacet && (
                  <>
                    <p className={styles.panelHint}>
                      A facet is Genre + Aesthetic. Use Default when a side is
                      intentionally unset.
                    </p>
                    <label className={styles.label}>GENRE</label>
                    <select
                      className={styles.select}
                      value={viewModel.selectedGenreId}
                      onChange={(event) =>
                        viewModel.setSelectedGenreId(event.target.value)
                      }
                    >
                      <option value="">Default</option>
                      {viewModel.genres.map((tag) => (
                        <option key={tag.tagId} value={tag.tagId}>
                          {tag.name}
                        </option>
                      ))}
                    </select>

                    <label className={styles.label}>AESTHETIC</label>
                    <select
                      className={styles.select}
                      value={viewModel.selectedAestheticId}
                      onChange={(event) =>
                        viewModel.setSelectedAestheticId(event.target.value)
                      }
                    >
                      <option value="">Default</option>
                      {viewModel.aesthetics.map((tag) => (
                        <option key={tag.tagId} value={tag.tagId}>
                          {tag.name}
                        </option>
                      ))}
                    </select>

                    <div
                      className={`${styles.buttonRow} ${styles.createButtonRow}`}
                    >
                      <Button
                        onClick={viewModel.saveFacet}
                        className={styles.actionButton}
                      >
                        CREATE FACET
                      </Button>
                    </div>
                  </>
                )}

                {editingFacet && (
                  <>
                    <p className={styles.facetSubLabel}>
                      {viewModel.facetLabelById(editingFacet.facet.facetId)}
                    </p>

                    {/* Linked facets (top scrollable) */}
                    <div className={styles.linkedFacets}>
                      {viewModel.localRelationships.map((rel) => (
                        <div
                          key={rel.targetFacetId}
                          className={styles.linkedFacetItem}
                        >
                          <div
                            className={styles.removeFacetBtn}
                            onClick={() =>
                              viewModel.removeLocalRelationship(
                                rel.targetFacetId,
                              )
                            }
                          >
                            <span className="material-symbols-rounded">
                              close
                            </span>
                          </div>
                          <div className={styles.linkedFacetLabel}>
                            {rel.label}
                          </div>
                          <div className={styles.distanceContainer}>
                            <div className={styles.distanceLabel}>DIST</div>
                            <input
                              className={styles.distanceInput}
                              type="number"
                              min={0}
                              max={1}
                              step={0.05}
                              value={rel.distance}
                              onChange={(e) =>
                                viewModel.updateLocalRelationshipDistance(
                                  rel.targetFacetId,
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Controls row: search + save */}
                    <div className={styles.relControlsRow}>
                      <input
                        className={styles.relSearch}
                        type="text"
                        placeholder="SEARCH FACETS"
                        value={viewModel.pendingRelationshipSearch}
                        onChange={(e) =>
                          viewModel.setPendingRelationshipSearch(e.target.value)
                        }
                      />
                      <div
                        className={styles.saveRelBtn}
                        onClick={viewModel.saveRelationships}
                      >
                        SAVE
                      </div>
                    </div>

                    {/* Candidate facets (bottom scrollable) */}
                    <div className={styles.candidateFacets}>
                      {viewModel.candidateFacets.map(({ facet, label }) => (
                        <div
                          key={facet.facetId}
                          className={styles.candidateFacetItem}
                        >
                          <div
                            className={styles.addFacetBtn}
                            onClick={() =>
                              viewModel.addLocalRelationship(facet.facetId)
                            }
                          >
                            <span className="material-symbols-rounded">
                              add
                            </span>
                          </div>
                          <div className={styles.candidateFacetLabel}>
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacetsView;
