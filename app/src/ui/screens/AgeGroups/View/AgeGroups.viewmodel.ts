import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateAgeGroup,
  useDeleteAgeGroup,
  useGetAllAgeGroups,
  useUpdateAgeGroup,
} from "../../../services/tags/useAgeGroups";

interface AgeGroupsData {
  isEditModalOpen: boolean;
  selectedAgeGroup: Tag | null;
  ageGroups: Tag[];
}
interface AgeGroupsActions {
  addAgeGroup: () => void;
  onEdit: (item: Tag) => void;
  onSave: (item: Tag) => void;
  onRemove: (item: Tag) => void;
}

export interface AgeGroupsViewModel extends AgeGroupsData, AgeGroupsActions {}

const useAgeGroupsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): AgeGroupsViewModel => {
  const $getAgeGroups = useGetAllAgeGroups();
  const $createAgeGroup = useCreateAgeGroup();
  const $deleteAgeGroup = useDeleteAgeGroup();
  const $updateAgeGroup = useUpdateAgeGroup();

  const [isEditModalOpen, setEditModalState] = useState(false);
  const [savedAgeGroups, setSavedAgeGroups] = useState<Tag[]>([]);
  const [newAgeGroup, setNewAgeGroup] = useState<Tag | null>(null);
  const [ageGroups, setAgeGroups] = useState<Tag[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<Tag | null>(null);

  useEffect(() => {
    if ($getAgeGroups.data) {
      setSavedAgeGroups($getAgeGroups.data);
    }
  }, [$getAgeGroups.data]);

  useEffect(() => {
    let currentAgeGroups: Tag[] = [];
    currentAgeGroups = newAgeGroup
      ? [newAgeGroup, ...savedAgeGroups]
      : [...savedAgeGroups];
    setAgeGroups(currentAgeGroups);
  }, [newAgeGroup, savedAgeGroups]);

  const onEdit = (ageGroup: Tag) => {
    if (isEditModalOpen) {
      setSelectedAgeGroup(null);
      setEditModalState(false);
      return;
    }

    const ageGroupToEdit = ageGroups.find((m) => m.tagId === ageGroup.tagId);
    if (!ageGroupToEdit) {
      console.error("AgeGroup not found:", ageGroup);
      return;
    }

    const deepCopiedAgeGroup = JSON.parse(JSON.stringify(ageGroupToEdit));
    setSelectedAgeGroup(deepCopiedAgeGroup);
    setEditModalState(true);
  };

  const onSave = (item: Tag) => {
    const deepCopiedSelectedAgeGroup = JSON.parse(JSON.stringify(item));
    if (item.tagId === newAgeGroup?.tagId) {
      console.error("AGE GROUP BEING CREATED", deepCopiedSelectedAgeGroup);
      $createAgeGroup.mutate(deepCopiedSelectedAgeGroup);
      setSelectedAgeGroup(null);
      setNewAgeGroup(null);
      setEditModalState(false);
      return;
    }
    console.error("AGE GROUP BEING UPDATED:", deepCopiedSelectedAgeGroup);
    $updateAgeGroup.mutate(deepCopiedSelectedAgeGroup);
    setSelectedAgeGroup(null);
    setNewAgeGroup(null);
    setEditModalState(false);
  };

  const onRemove = (item: Tag) => {
    if (item.tagId === newAgeGroup?.tagId) {
      setNewAgeGroup(null);
      return;
    } else {
      $deleteAgeGroup.mutate(item);
    }
  };

  const addAgeGroup = () => {
    if (newAgeGroup) {
      return;
    }
    const tempAgeGroup: Tag = {
      tagId: uuidv4(),
      name: "",
    };
    setNewAgeGroup(tempAgeGroup);
  };

  return {
    selectedAgeGroup,
    isEditModalOpen,
    ageGroups,
    addAgeGroup,
    onEdit,
    onSave,
    onRemove,
  };
};

export default useAgeGroupsViewModel;
