import { useEffect, useMemo, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { useGetAllFacets } from "../../../services/prisms/useFacets";
import {
  useCreateMosaic,
  useDeleteMosaic,
  useGetAllMosaics,
  useUpdateMosaic,
} from "../../../services/prisms/useMosaics";
import { useGetAllMusicGenres } from "../../../services/tags/useMusicGenres";

interface MosaicData {
  mosaics: Mosaic[];
  facets: Facet[];
  musicGenres: Tag[];
  isEditModalOpen: boolean;
  selectedFacetId: string;
  selectedMusicGenreIds: string[];
  mosaicName: string;
  mosaicDescription: string;
  editingMosaicId: string | null;
  statusMessage: string;
}

interface MosaicActions {
  setSelectedFacetId: (value: string) => void;
  setMosaicName: (value: string) => void;
  setMosaicDescription: (value: string) => void;
  openCreateModal: () => void;
  toggleMusicGenre: (tagId: string) => void;
  saveMosaic: () => void;
  editMosaic: (mosaic: Mosaic) => void;
  closeModal: () => void;
  deleteMosaic: (mosaicId: string) => void;
  facetLabelById: (facetId: string) => string;
  genreLabelById: (tagId: string) => string;
}

export interface MosaicViewModel extends MosaicData, MosaicActions {}

function buildFacetLabel(facet: Facet): string {
  const genreLabel = facet.genre?.name ?? "Default";
  const aestheticLabel = facet.aesthetic?.name ?? "Default";
  return `${genreLabel} + ${aestheticLabel}`;
}

const useMosaicViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): MosaicViewModel => {
  const $mosaics = useGetAllMosaics();
  const $facets = useGetAllFacets();
  const $musicGenres = useGetAllMusicGenres();
  const $createMosaic = useCreateMosaic();
  const $updateMosaic = useUpdateMosaic();
  const $deleteMosaic = useDeleteMosaic();

  const [selectedFacetId, setSelectedFacetId] = useState<string>("");
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedMusicGenreIds, setSelectedMusicGenreIds] = useState<string[]>(
    [],
  );
  const [mosaicName, setMosaicName] = useState<string>("");
  const [mosaicDescription, setMosaicDescription] = useState<string>("");
  const [editingMosaicId, setEditingMosaicId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const mosaics = useMemo(() => {
    return [...($mosaics.data ?? [])].sort((a, b) => {
      const left = a.name?.trim() || a.mosaicId;
      const right = b.name?.trim() || b.mosaicId;
      return left.localeCompare(right);
    });
  }, [$mosaics.data]);

  const facets = useMemo(() => {
    return [...($facets.data ?? [])].sort((a, b) => {
      return buildFacetLabel(a).localeCompare(buildFacetLabel(b));
    });
  }, [$facets.data]);

  const musicGenres = useMemo(() => {
    return [...($musicGenres.data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [$musicGenres.data]);

  useEffect(() => {
    if (!selectedFacetId && facets.length > 0) {
      setSelectedFacetId(facets[0].facetId);
    }
  }, [facets, selectedFacetId]);

  const toggleMusicGenre = (tagId: string) => {
    setSelectedMusicGenreIds((previous) => {
      if (previous.includes(tagId)) {
        return previous.filter((id) => id !== tagId);
      }
      return [...previous, tagId];
    });
  };

  const clearForm = () => {
    setEditingMosaicId(null);
    setMosaicName("");
    setMosaicDescription("");
    setSelectedMusicGenreIds([]);
  };

  const openCreateModal = () => {
    clearForm();
    if (facets.length > 0) {
      setSelectedFacetId(facets[0].facetId);
    }
    setStatusMessage("");
    setEditModalOpen(true);
  };

  const saveMosaic = () => {
    if (!selectedFacetId) {
      setStatusMessage("Pick a facet for this mosaic.");
      return;
    }

    if (selectedMusicGenreIds.length === 0) {
      setStatusMessage("Select at least one music genre.");
      return;
    }

    const duplicateFacet = mosaics.find(
      (mosaic) =>
        mosaic.facetId === selectedFacetId &&
        mosaic.mosaicId !== editingMosaicId,
    );

    if (duplicateFacet) {
      setStatusMessage(
        "This facet already has a mosaic. Edit it instead of creating a duplicate.",
      );
      return;
    }

    if (editingMosaicId) {
      const mosaicToUpdate = mosaics.find(
        (mosaic) => mosaic.mosaicId === editingMosaicId,
      );

      if (!mosaicToUpdate) {
        setStatusMessage("Mosaic not found for editing.");
        return;
      }

      $updateMosaic.mutate(
        {
          ...mosaicToUpdate,
          facetId: selectedFacetId,
          musicalGenres: selectedMusicGenreIds,
          name: mosaicName.trim() || undefined,
          description: mosaicDescription.trim() || undefined,
        },
        {
          onSuccess: (result) => {
            setStatusMessage(result.message);
            clearForm();
            setEditModalOpen(false);
          },
        },
      );
      return;
    }

    $createMosaic.mutate(
      {
        facetId: selectedFacetId,
        musicalGenres: selectedMusicGenreIds,
        name: mosaicName.trim() || undefined,
        description: mosaicDescription.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setStatusMessage(result.message);
          clearForm();
          setEditModalOpen(false);
        },
      },
    );
  };

  const editMosaic = (mosaic: Mosaic) => {
    setEditingMosaicId(mosaic.mosaicId);
    setSelectedFacetId(mosaic.facetId);
    setSelectedMusicGenreIds(mosaic.musicalGenres);
    setMosaicName(mosaic.name ?? "");
    setMosaicDescription(mosaic.description ?? "");
    setStatusMessage(`Editing mosaic ${mosaic.name ?? mosaic.mosaicId}`);
    setEditModalOpen(true);
  };

  const closeModal = () => {
    clearForm();
    setStatusMessage("");
    setEditModalOpen(false);
  };

  const deleteMosaic = (mosaicId: string) => {
    $deleteMosaic.mutate(mosaicId, {
      onSuccess: (result) => {
        setStatusMessage(result.message);
        if (editingMosaicId === mosaicId) {
          clearForm();
        }
      },
    });
  };

  const facetLabelById = (facetId: string) => {
    const facet = facets.find((item) => item.facetId === facetId);
    return facet ? buildFacetLabel(facet) : "Unknown facet";
  };

  const genreLabelById = (tagId: string) => {
    const genre = musicGenres.find((item) => item.tagId === tagId);
    return genre ? genre.name : tagId;
  };

  return {
    mosaics,
    facets,
    musicGenres,
    isEditModalOpen,
    selectedFacetId,
    selectedMusicGenreIds,
    mosaicName,
    mosaicDescription,
    editingMosaicId,
    statusMessage,
    setSelectedFacetId,
    setMosaicName,
    setMosaicDescription,
    openCreateModal,
    toggleMusicGenre,
    saveMosaic,
    editMosaic,
    closeModal,
    deleteMosaic,
    facetLabelById,
    genreLabelById,
  };
};

export default useMosaicViewModel;
