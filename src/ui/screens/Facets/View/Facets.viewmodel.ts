import { useEffect, useMemo, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useAddFacetRelationship,
  useCreateFacet,
  useDeleteFacet,
  useDeleteFacetRelationship,
  useGetAllFacets,
} from "../../../services/prisms";
import { useGetAllAestheticTags } from "../../../services/tags/useAestheticTags";
import { useGetAllGenreTags } from "../../../services/tags/useGenreTags";

type FacetListItem = {
  facet: Facet;
  label: string;
};

type LocalRelationship = {
  targetFacetId: string;
  label: string;
  distance: string;
};

interface FacetsData {
  genres: Tag[];
  aesthetics: Tag[];
  facets: FacetListItem[];
  candidateFacets: FacetListItem[];
  isEditModalOpen: boolean;
  editingFacetId: string | null;
  selectedGenreId: string;
  selectedAestheticId: string;
  localRelationships: LocalRelationship[];
  pendingRelationshipSearch: string;
  statusMessage: string;
}

interface FacetsActions {
  setSelectedGenreId: (value: string) => void;
  setSelectedAestheticId: (value: string) => void;
  setPendingRelationshipSearch: (value: string) => void;
  addLocalRelationship: (targetFacetId: string) => void;
  removeLocalRelationship: (targetFacetId: string) => void;
  updateLocalRelationshipDistance: (
    targetFacetId: string,
    distance: string,
  ) => void;
  openCreateModal: () => void;
  openEditModal: (facetId: string) => void;
  closeModal: () => void;
  saveFacet: () => void;
  deleteFacet: (facetId: string) => void;
  saveRelationships: () => void;
  facetLabelById: (facetId: string) => string;
}

export interface FacetsViewModel extends FacetsData, FacetsActions {}

function buildFacetLabel(facet: Facet): string {
  const genreLabel = facet.genre?.name ?? "Default";
  const aestheticLabel = facet.aesthetic?.name ?? "Default";
  return `${genreLabel} + ${aestheticLabel}`;
}

const useFacetsViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): FacetsViewModel => {
  const $genres = useGetAllGenreTags();
  const $aesthetics = useGetAllAestheticTags();
  const $facets = useGetAllFacets();
  const $createFacet = useCreateFacet();
  const $deleteFacet = useDeleteFacet();
  const $addFacetRelationship = useAddFacetRelationship();
  const $deleteFacetRelationship = useDeleteFacetRelationship();

  const [selectedGenreId, setSelectedGenreId] = useState<string>("");
  const [selectedAestheticId, setSelectedAestheticId] = useState<string>("");
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingFacetId, setEditingFacetId] = useState<string | null>(null);
  const [localRelationships, setLocalRelationships] = useState<
    LocalRelationship[]
  >([]);
  const [pendingRelationshipSearch, setPendingRelationshipSearch] =
    useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const genres = $genres.data ?? [];
  const aesthetics = $aesthetics.data ?? [];
  const rawFacets = $facets.data ?? [];

  const facets = useMemo(() => {
    return rawFacets
      .map((facet) => ({
        facet,
        label: buildFacetLabel(facet),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rawFacets]);

  const candidateFacets = useMemo(() => {
    const linkedIds = new Set(localRelationships.map((r) => r.targetFacetId));
    const search = pendingRelationshipSearch.trim().toLowerCase();
    return facets.filter(({ facet, label }) => {
      if (facet.facetId === editingFacetId) return false;
      if (linkedIds.has(facet.facetId)) return false;
      if (search && !label.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [facets, localRelationships, editingFacetId, pendingRelationshipSearch]);

  const openCreateModal = () => {
    setEditingFacetId(null);
    setSelectedGenreId("");
    setSelectedAestheticId("");
    setLocalRelationships([]);
    setPendingRelationshipSearch("");
    setStatusMessage("");
    setEditModalOpen(true);
  };

  const openEditModal = (facetId: string) => {
    const found = rawFacets.find((f) => f.facetId === facetId);
    const initialRelationships: LocalRelationship[] = found
      ? found.facetRelationships.map((rel) => ({
          targetFacetId: rel.facetId,
          label: buildFacetLabel(
            rawFacets.find((f) => f.facetId === rel.facetId) ?? {
              facetId: rel.facetId,
              genre: null,
              aesthetic: null,
              facetRelationships: [],
            },
          ),
          distance: String(rel.distance),
        }))
      : [];
    setEditingFacetId(facetId);
    setLocalRelationships(initialRelationships);
    setPendingRelationshipSearch("");
    setStatusMessage("");
    setEditModalOpen(true);
  };

  const closeModal = () => {
    setEditModalOpen(false);
    setEditingFacetId(null);
    setLocalRelationships([]);
    setPendingRelationshipSearch("");
    setStatusMessage("");
  };

  const addLocalRelationship = (targetFacetId: string) => {
    const found = rawFacets.find((f) => f.facetId === targetFacetId);
    if (!found) return;
    setLocalRelationships((prev) => [
      ...prev,
      {
        targetFacetId,
        label: buildFacetLabel(found),
        distance: "0.5",
      },
    ]);
  };

  const removeLocalRelationship = (targetFacetId: string) => {
    setLocalRelationships((prev) =>
      prev.filter((r) => r.targetFacetId !== targetFacetId),
    );
  };

  const updateLocalRelationshipDistance = (
    targetFacetId: string,
    distance: string,
  ) => {
    setLocalRelationships((prev) =>
      prev.map((r) =>
        r.targetFacetId === targetFacetId ? { ...r, distance } : r,
      ),
    );
  };

  const saveFacet = () => {
    const genre = genres.find((tag) => tag.tagId === selectedGenreId) ?? null;
    const aesthetic =
      aesthetics.find((tag) => tag.tagId === selectedAestheticId) ?? null;

    const duplicate = rawFacets.some((facet) => {
      const existingGenreId = facet.genre?.tagId ?? "";
      const existingAestheticId = facet.aesthetic?.tagId ?? "";
      return (
        existingGenreId === (genre?.tagId ?? "") &&
        existingAestheticId === (aesthetic?.tagId ?? "")
      );
    });

    if (duplicate) {
      setStatusMessage("That facet already exists.");
      return;
    }

    $createFacet.mutate(
      { genre, aesthetic },
      {
        onSuccess: (result) => {
          setStatusMessage(result.message);
          setEditModalOpen(false);
        },
      },
    );
  };

  const deleteFacet = (facetId: string) => {
    $deleteFacet.mutate(facetId, {
      onSuccess: (result) => {
        setStatusMessage(result.message);
      },
    });
  };

  const saveRelationships = () => {
    if (!editingFacetId) return;

    const originalFacet = rawFacets.find((f) => f.facetId === editingFacetId);
    const localIds = new Set(localRelationships.map((r) => r.targetFacetId));

    // Delete relationships that were removed
    for (const rel of originalFacet?.facetRelationships ?? []) {
      if (!localIds.has(rel.facetId)) {
        $deleteFacetRelationship.mutate({
          sourceFacetId: editingFacetId,
          targetFacetId: rel.facetId,
        });
      }
    }

    // Add or upsert remaining local relationships
    for (const rel of localRelationships) {
      const distance = Math.max(0, Math.min(1, Number(rel.distance) || 0.5));
      $addFacetRelationship.mutate({
        sourceFacetId: editingFacetId,
        targetFacetId: rel.targetFacetId,
        distance,
      });
    }

    closeModal();
  };

  const facetLabelById = (facetId: string) => {
    const found = rawFacets.find((facet) => facet.facetId === facetId);
    return found ? buildFacetLabel(found) : "Unknown facet";
  };

  return {
    genres,
    aesthetics,
    facets,
    candidateFacets,
    isEditModalOpen,
    editingFacetId,
    selectedGenreId,
    selectedAestheticId,
    localRelationships,
    pendingRelationshipSearch,
    statusMessage,
    setSelectedGenreId,
    setSelectedAestheticId,
    setPendingRelationshipSearch,
    addLocalRelationship,
    removeLocalRelationship,
    updateLocalRelationshipDistance,
    openCreateModal,
    openEditModal,
    closeModal,
    saveFacet,
    deleteFacet,
    saveRelationships,
    facetLabelById,
  };
};

export default useFacetsViewModel;
