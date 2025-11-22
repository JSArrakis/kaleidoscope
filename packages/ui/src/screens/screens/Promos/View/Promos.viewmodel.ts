import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useGetAllPromos,
  useCreatePromo,
  useDeletePromo,
  useUpdatePromo,
} from "../../../services/media/usePromos";

interface PromosData {
  promos: PrismMediaItem[];
  selectedPromo: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface PromosActions {
  editPromo: (promo: PrismMediaItem) => void;
  savePromo: (promo: PrismMediaItem) => void;
  onRemove: (promo: PrismMediaItem) => void;
  addPromos: () => void;
}

export interface PromosViewModel extends PromosData, PromosActions {}

const usePromosViewModel = (
  navigate: ReturnType<typeof useRootStack>
): PromosViewModel => {
  const $getPromos = useGetAllPromos();
  const $createPromo = useCreatePromo();
  const $deletePromo = useDeletePromo();
  const $updatePromo = useUpdatePromo();

  const [savedPromos, setSavedPromos] = useState<PrismMediaItem[]>([]);

  const [newPromos, setNewPromos] = useState<PrismMediaItem[]>([]);

  const [promos, setPromos] = useState<PrismMediaItem[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PrismMediaItem | null>(
    null
  );

  useEffect(() => {
    if ($getPromos.data) {
      console.log("Promos data:", $getPromos.data);
      setSavedPromos($getPromos.data);
    }
  }, [$getPromos.data]);

  useEffect(() => {
    let currentPromos: PrismMediaItem[] = [];
    currentPromos = [...newPromos, ...savedPromos];
    setPromos(currentPromos);
  }, [newPromos, savedPromos]);

  const addPromos = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newPromos = filePaths.map((promoPath: string) => ({
        mediaItemId: normalizeItem(promoPath),
        path: promoPath,
        tags: [],
      }));

      setNewPromos((prev) => [...prev, ...newPromos]);
    }
  };

  const editPromo = (promo: PrismMediaItem) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const promoToEdit = promos.find((m) => m.mediaItemId === promo.mediaItemId);
    if (!promoToEdit) {
      console.error("Promo not found:", promo);
      return;
    }
    setSelectedPromo(promoToEdit);
    setEditModalState(true);
  };

  const savePromo = (promo: PrismMediaItem) => {
    const deepCopiedPromo = JSON.parse(JSON.stringify(promo));
    const existingPromo = savedPromos.find(
      (m) => m.mediaItemId === deepCopiedPromo.mediaItemId
    );

    if (existingPromo) {
      $updatePromo.mutate(deepCopiedPromo);
      setSelectedPromo(null);
      setEditModalState(false);
      setNewPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedPromo.mediaItemId)
      );
      return;
    }
    setSelectedPromo(null);
    setEditModalState(false);
    setNewPromos((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedPromo.mediaItemId)
    );
    $createPromo.mutate(deepCopiedPromo);
  };

  const onRemove = (item: PrismMediaItem) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedPromo?.mediaItemId) {
      setSelectedPromo(null);
    }

    if (newPromos.includes(item)) {
      setNewPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      return;
    } else {
      setSavedPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      $deletePromo.mutate(item);
    }
  };

  return {
    promos,
    selectedPromo,
    isEditModalOpen,
    editPromo,
    savePromo,
    onRemove,
    addPromos,
  };
};

export default usePromosViewModel;
