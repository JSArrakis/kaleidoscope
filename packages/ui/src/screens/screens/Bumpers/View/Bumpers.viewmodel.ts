import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useGetAllBumpers,
  useCreateBumper,
  useDeleteBumper,
  useUpdateBumper,
} from "../../../services/media/useBumpers";

interface BumpersData {
  bumpers: PrismMediaItem[];
  selectedBumper: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface BumpersActions {
  editBumper: (bumper: PrismMediaItem) => void;
  saveBumper: (bumper: PrismMediaItem) => void;
  onRemove: (bumper: PrismMediaItem) => void;
  addBumpers: () => void;
}

export interface BumpersViewModel extends BumpersData, BumpersActions {}

const useBumpersViewModel = (
  navigate: ReturnType<typeof useRootStack>
): BumpersViewModel => {
  const $getBumpers = useGetAllBumpers();
  const $createBumper = useCreateBumper();
  const $deleteBumper = useDeleteBumper();
  const $updateBumper = useUpdateBumper();

  const [savedBumpers, setSavedBumpers] = useState<PrismMediaItem[]>([]);

  const [newBumpers, setNewBumpers] = useState<PrismMediaItem[]>([]);

  const [bumpers, setBumpers] = useState<PrismMediaItem[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedBumper, setSelectedBumper] = useState<PrismMediaItem | null>(
    null
  );

  useEffect(() => {
    if ($getBumpers.data) {
      console.log("Bumpers data:", $getBumpers.data);
      setSavedBumpers($getBumpers.data);
    }
  }, [$getBumpers.data]);

  useEffect(() => {
    let currentBumpers: PrismMediaItem[] = [];
    currentBumpers = [...newBumpers, ...savedBumpers];
    setBumpers(currentBumpers);
  }, [newBumpers, savedBumpers]);

  const addBumpers = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newBumpers = filePaths.map((bumperPath: string) => ({
        mediaItemId: normalizeItem(bumperPath),
        path: bumperPath,
        tags: [],
      }));

      setNewBumpers((prev) => [...prev, ...newBumpers]);
    }
  };

  const editBumper = (bumper: PrismMediaItem) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const bumperToEdit = bumpers.find((m) => m.mediaItemId === bumper.mediaItemId);
    if (!bumperToEdit) {
      console.error("Bumper not found:", bumper);
      return;
    }
    setSelectedBumper(bumperToEdit);
    setEditModalState(true);
  };

  const saveBumper = (bumper: PrismMediaItem) => {
    const deepCopiedBumper = JSON.parse(JSON.stringify(bumper));
    const existingBumper = savedBumpers.find(
      (m) => m.mediaItemId === deepCopiedBumper.mediaItemId
    );

    if (existingBumper) {
      $updateBumper.mutate(deepCopiedBumper);
      setSelectedBumper(null);
      setEditModalState(false);
      setNewBumpers((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedBumper.mediaItemId)
      );
      return;
    }
    setSelectedBumper(null);
    setEditModalState(false);
    setNewBumpers((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedBumper.mediaItemId)
    );
    $createBumper.mutate(deepCopiedBumper);
  };

  const onRemove = (item: PrismMediaItem) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedBumper?.mediaItemId) {
      setSelectedBumper(null);
    }

    if (newBumpers.includes(item)) {
      setNewBumpers((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      return;
    } else {
      setSavedBumpers((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      $deleteBumper.mutate(item);
    }
  };

  return {
    bumpers,
    selectedBumper,
    isEditModalOpen,
    editBumper,
    saveBumper,
    onRemove,
    addBumpers,
  };
};

export default useBumpersViewModel;
