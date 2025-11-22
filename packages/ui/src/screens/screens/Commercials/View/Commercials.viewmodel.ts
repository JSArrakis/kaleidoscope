import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useGetAllCommercials,
  useCreateCommercial,
  useDeleteCommercial,
  useUpdateCommercial,
} from "../../../services/media/useCommercials";

interface CommercialsData {
  commercials: PrismMediaItem[];
  selectedCommercial: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface CommercialsActions {
  editCommercial: (commercial: PrismMediaItem) => void;
  saveCommercial: (commercial: PrismMediaItem) => void;
  onRemove: (commercial: PrismMediaItem) => void;
  addCommercials: () => void;
}

export interface CommercialsViewModel
  extends CommercialsData,
    CommercialsActions {}

const useCommercialsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): CommercialsViewModel => {
  const $getCommercials = useGetAllCommercials();
  const $createCommercial = useCreateCommercial();
  const $deleteCommercial = useDeleteCommercial();
  const $updateCommercial = useUpdateCommercial();

  const [savedCommercials, setSavedCommercials] = useState<PrismMediaItem[]>(
    []
  );

  const [newCommercials, setNewCommercials] = useState<PrismMediaItem[]>([]);

  const [commercials, setCommercials] = useState<PrismMediaItem[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedCommercial, setSelectedCommercial] =
    useState<PrismMediaItem | null>(null);

  useEffect(() => {
    if ($getCommercials.data) {
      setSavedCommercials($getCommercials.data);
    }
  }, [$getCommercials.data]);

  useEffect(() => {
    let currentCommercials: PrismMediaItem[] = [];
    currentCommercials = [...newCommercials, ...savedCommercials];
    setCommercials(currentCommercials);
  }, [newCommercials, savedCommercials]);

  const addCommercials = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newCommercials = filePaths.map((commercialPath: string) => ({
        mediaItemId: normalizeItem(commercialPath),
        path: commercialPath,
        tags: ["Default"],
      }));

      for (const commercial of newCommercials) {
        const existingCommercial = savedCommercials.find(
          (m) => m.mediaItemId === commercial.mediaItemId
        );
        if (!existingCommercial) {
          $createCommercial.mutate(commercial);
        }
      }
    }
  };

  const editCommercial = (commercial: PrismMediaItem) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const commercialToEdit = commercials.find(
      (m) => m.mediaItemId === commercial.mediaItemId
    );
    if (!commercialToEdit) {
      console.error("Commercial not found:", commercial);
      return;
    }
    setSelectedCommercial(commercialToEdit);
    setEditModalState(true);
  };

  const saveCommercial = (commercial: PrismMediaItem) => {
    const deepCopiedCommercial = JSON.parse(JSON.stringify(commercial));
    const existingCommercial = savedCommercials.find(
      (m) => m.mediaItemId === deepCopiedCommercial.mediaItemId
    );

    if (existingCommercial) {
      $updateCommercial.mutate(deepCopiedCommercial);
      setSelectedCommercial(null);
      setEditModalState(false);
      setNewCommercials((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedCommercial.mediaItemId)
      );
      return;
    }
    setSelectedCommercial(null);
    setEditModalState(false);
    setNewCommercials((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedCommercial.mediaItemId)
    );
    $createCommercial.mutate(deepCopiedCommercial);
  };

  const onRemove = (item: PrismMediaItem) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedCommercial?.mediaItemId) {
      setSelectedCommercial(null);
    }

    if (newCommercials.includes(item)) {
      setNewCommercials((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      return;
    } else {
      setSavedCommercials((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      $deleteCommercial.mutate(item);
    }
  };

  return {
    commercials,
    selectedCommercial,
    isEditModalOpen,
    editCommercial,
    saveCommercial,
    onRemove,
    addCommercials,
  };
};

export default useCommercialsViewModel;
