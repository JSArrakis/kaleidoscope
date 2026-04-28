import { useState } from "react";
import useRootStack from "../../../navigation/useRootStack";

interface BlocksData {
  isEditModalOpen: boolean;
}
interface BlocksActions {
  blocks: Collection[];
  addBlock: () => void;
  searchBlocks: (searchTerm: string) => void;
  onEdit: (item: Collection) => void;
  onSave: (item: Collection) => void;
  onRemove: (item: Collection) => void;
}

export interface BlocksViewModel extends BlocksData, BlocksActions {}

const useBlocksViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): BlocksViewModel => {
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [blocks, setBlocks] = useState<Collection[]>([]);

  const searchBlocks = (searchTerm: string) => {
    //TODO: Implement search movies
    console.log("Searching movies:", searchTerm);
  };

  const addBlock = () => {
    console.log("Adding block");
  };
  const onEdit = (item: Collection) => {
    console.log("Editing item:", item);
  };
  const onSave = (item: Collection) => {
    console.log("Saving item:", item);
  };
  const onRemove = (item: Collection) => {
    console.log("Removing item:", item);
  };

  return {
    blocks,
    isEditModalOpen,
    addBlock,
    searchBlocks,
    onEdit,
    onSave,
    onRemove,
  };
};

export default useBlocksViewModel;
