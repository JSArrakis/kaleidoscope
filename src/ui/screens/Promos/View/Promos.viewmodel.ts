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
  promos: Promo[];
  selectedPromo: Promo | null;
  isEditModalOpen: boolean;
}
interface PromosActions {
  editPromo: (promo: Promo) => void;
  savePromo: (promo: Promo) => void;
  onRemove: (promo: Promo) => void;
  addPromos: () => void;
}

export interface PromosViewModel extends PromosData, PromosActions {}

const usePromosViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): PromosViewModel => {
  const $getPromos = useGetAllPromos();
  const $createPromo = useCreatePromo();
  const $deletePromo = useDeletePromo();
  const $updatePromo = useUpdatePromo();

  const [savedPromos, setSavedPromos] = useState<Promo[]>([]);

  const [newPromos, setNewPromos] = useState<Promo[]>([]);

  const [promos, setPromos] = useState<Promo[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  useEffect(() => {
    if ($getPromos.data) {
      console.log("Promos data:", $getPromos.data);
      setSavedPromos($getPromos.data);
    }
  }, [$getPromos.data]);

  useEffect(() => {
    let currentPromos: Promo[] = [];
    currentPromos = [...newPromos, ...savedPromos];
    setPromos(currentPromos);
  }, [newPromos, savedPromos]);

  const addPromos = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newPromosList: Promo[] = filePaths.map((promoPath: string) => ({
        mediaItemId: normalizeItem(promoPath),
        title: "",
        path: promoPath,
        duration: 0,
        type: MediaType.Promo,
        tags: [] as Tag[],
      }));

      for (const promo of newPromosList) {
        const existingPromo = savedPromos.find(
          (m) => m.mediaItemId === promo.mediaItemId,
        );
        if (!existingPromo) {
          $createPromo.mutate(promo);
        }
      }
    }
  };

  const editPromo = (promo: Promo) => {
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

  const savePromo = (promo: Promo) => {
    const deepCopiedPromo = JSON.parse(JSON.stringify(promo));
    const existingPromo = savedPromos.find(
      (m) => m.mediaItemId === deepCopiedPromo.mediaItemId,
    );

    if (existingPromo) {
      $updatePromo.mutate(deepCopiedPromo);
      setSelectedPromo(null);
      setEditModalState(false);
      setNewPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedPromo.mediaItemId),
      );
      return;
    }
    setSelectedPromo(null);
    setEditModalState(false);
    setNewPromos((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedPromo.mediaItemId),
    );
    $createPromo.mutate(deepCopiedPromo);
  };

  const onRemove = (item: Promo) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedPromo?.mediaItemId) {
      setSelectedPromo(null);
    }

    if (newPromos.includes(item)) {
      setNewPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
      );
      return;
    } else {
      setSavedPromos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
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
