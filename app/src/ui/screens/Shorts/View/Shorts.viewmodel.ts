import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useGetAllShorts,
  useCreateShort,
  useDeleteShort,
  useUpdateShort,
} from "../../../services/media/useShorts";

interface ShortsData {
  shorts: PrismMediaItem[];
  selectedShort: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface ShortsActions {
  editShort: (short: PrismMediaItem) => void;
  saveShort: (short: PrismMediaItem) => void;
  onRemove: (short: PrismMediaItem) => void;
  addShorts: () => void;
}

export interface ShortsViewModel extends ShortsData, ShortsActions {}

const useShortsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): ShortsViewModel => {
  const $getShorts = useGetAllShorts();
  const $createShort = useCreateShort();
  const $deleteShort = useDeleteShort();
  const $updateShort = useUpdateShort();

  const [savedShorts, setSavedShorts] = useState<PrismMediaItem[]>([]);

  const [newShorts, setNewShorts] = useState<PrismMediaItem[]>([]);

  const [shorts, setShorts] = useState<PrismMediaItem[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedShort, setSelectedShort] = useState<PrismMediaItem | null>(
    null
  );

  useEffect(() => {
    if ($getShorts.data) {
      setSavedShorts($getShorts.data);
    }
  }, [$getShorts.data]);

  useEffect(() => {
    let currentShorts: PrismMediaItem[] = [];
    currentShorts = [...newShorts, ...savedShorts];
    setShorts(currentShorts);
  }, [newShorts, savedShorts]);

  const addShorts = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newShorts = filePaths.map((shortPath: string) => ({
        mediaItemId: normalizeItem(shortPath),
        path: shortPath,
        tags: [],
      }));

      setNewShorts((prev) => [...prev, ...newShorts]);
    }
  };

  const editShort = (short: PrismMediaItem) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const shortToEdit = shorts.find((m) => m.mediaItemId === short.mediaItemId);
    if (!shortToEdit) {
      console.error("Short not found:", short);
      return;
    }
    setSelectedShort(shortToEdit);
    setEditModalState(true);
  };

  const saveShort = (short: PrismMediaItem) => {
    const deepCopiedShort = JSON.parse(JSON.stringify(short));
    const existingShort = savedShorts.find(
      (m) => m.mediaItemId === deepCopiedShort.mediaItemId
    );

    if (existingShort) {
      $updateShort.mutate(deepCopiedShort);
      setSelectedShort(null);
      setEditModalState(false);
      setNewShorts((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedShort.mediaItemId)
      );
      return;
    }
    setSelectedShort(null);
    setEditModalState(false);
    setNewShorts((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedShort.mediaItemId)
    );
    $createShort.mutate(deepCopiedShort);
  };

  const onRemove = (item: PrismMediaItem) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedShort?.mediaItemId) {
      setSelectedShort(null);
    }

    if (newShorts.includes(item)) {
      setNewShorts((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      return;
    } else {
      setSavedShorts((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      $deleteShort.mutate(item);
    }
  };

  return {
    shorts,
    selectedShort,
    isEditModalOpen,
    editShort,
    saveShort,
    onRemove,
    addShorts,
  };
};

export default useShortsViewModel;
