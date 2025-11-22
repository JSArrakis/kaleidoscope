import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateSpecialtyTag,
  useDeleteSpecialtyTag,
  useGetAllSpecialtyTags,
} from "../../../services/tags/useSpecialtyTags";

interface SpecialtiesData {
  items: Tag[];
  item: string;
}
interface SpecialtiesActions {
  setItem(item: string): void;
  addTag(): void;
  removeTag(item: Tag): void;
  searchTags(searchString: string): void;
}

export interface SpecialtiesViewModel
  extends SpecialtiesData,
    SpecialtiesActions {}

const useSpecialtiesViewModel = (
  navigate: ReturnType<typeof useRootStack>
): SpecialtiesViewModel => {
  const $useGetAllSpecialtyTags = useGetAllSpecialtyTags();
  const $useCreateSpecialtyTag = useCreateSpecialtyTag();
  const $useDeleteSpecialtyTag = useDeleteSpecialtyTag();

  const [items, setItems] = useState<Tag[]>([]);
  const [item, setItem] = useState("");

  useEffect(() => {
    if ($useGetAllSpecialtyTags.data) {
      setItems($useGetAllSpecialtyTags.data);
    }
  }, [$useGetAllSpecialtyTags.data]);

  const addTag = () => {
    if (!item.trim()) {
      setItem("");
      return;
    }

    const tag: Tag = {
      tagId: item.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: item,
    };
    $useCreateSpecialtyTag.mutate(tag);
    setItem("");
  };
  const removeTag = (item: Tag) => {
    $useDeleteSpecialtyTag.mutate(item);
  };
  const searchTags = (searchString: string) => {};

  return {
    items,
    item,
    setItem,
    addTag,
    removeTag,
    searchTags,
  };
};

export default useSpecialtiesViewModel;
