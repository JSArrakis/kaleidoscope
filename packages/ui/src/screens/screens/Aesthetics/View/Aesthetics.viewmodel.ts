import { use, useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateAestheticTag,
  useDeleteAestheticTag,
  useGetAllAestheticTags,
} from "../../../services/tags/useAestheticTags";

interface AestheticsData {
  items: Tag[];
  item: string;
}
interface AestheticsActions {
  setItem(item: string): void;
  addTag(): void;
  removeTag(item: Tag): void;
  searchTags(searchString: string): void;
}

export interface AestheticsViewModel
  extends AestheticsData,
    AestheticsActions {}

const useAestheticsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): AestheticsViewModel => {
  const $useGetAllAestheticTags = useGetAllAestheticTags();
  const $useCreateAestheticTag = useCreateAestheticTag();
  const $useDeleteAestheticTag = useDeleteAestheticTag();

  const [items, setItems] = useState<Tag[]>([]);
  const [item, setItem] = useState("");

  useEffect(() => {
    if ($useGetAllAestheticTags.data) {
      setItems($useGetAllAestheticTags.data);
    }
  }, [$useGetAllAestheticTags.data]);

  const addTag = () => {
    if (!item.trim()) {
      setItem("");
      return;
    }

    const tag: Tag = {
      tagId: item.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: item,
    };
    $useCreateAestheticTag.mutate(tag);
    setItem("");
  };
  const removeTag = (item: Tag) => {
    $useDeleteAestheticTag.mutate(item);
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

export default useAestheticsViewModel;
