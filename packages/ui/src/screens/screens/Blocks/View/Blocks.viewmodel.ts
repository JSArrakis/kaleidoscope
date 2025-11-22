import { useState } from 'react';
import useRootStack from "../../../navigation/useRootStack";

interface BlocksData {
  isEditModalOpen: boolean;
}
interface BlocksActions {
  blocks: PrismCurationObj[];
  addBlock: () => void;
  searchBlocks: (searchTerm: string) => void;
  onEdit: (item: PrismCurationObj) => void;
  onSave: (item: PrismCurationObj) => void;
  onRemove: (item: PrismCurationObj) => void;
}

export interface BlocksViewModel extends BlocksData, BlocksActions {}

const useBlocksViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): BlocksViewModel => {
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [blocks, setBlocks] = useState<PrismCurationObj[]>([]);

  const searchBlocks = (searchTerm: string) => {
    //TODO: Implement search movies
    console.log('Searching movies:', searchTerm);
  };

  const addBlock = () => {
    console.log('Adding block');
  };
  const onEdit = (item: PrismCurationObj) => {
    console.log("Editing item:", item);
  };
  const onSave = (item: PrismCurationObj) => {
    console.log("Saving item:", item);
  };
  const onRemove = (item: PrismCurationObj) => {
    console.log("Removing item:", item);
  };

  return { blocks, isEditModalOpen, addBlock, searchBlocks, onEdit, onSave, onRemove };
};

export default useBlocksViewModel;
