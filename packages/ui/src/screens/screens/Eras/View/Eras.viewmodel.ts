import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateEraTag,
  useDeleteEraTag,
  useGetAllEraTags,
} from "../../../services/tags/useEraTags";

interface ErasData {
  items: Tag[];
  item: string;
}
interface ErasActions {
  setItem(item: string): void;
  addTag(): void;
  removeTag(item: Tag): void;
  searchTags(searchString: string): void;
}

export interface ErasViewModel extends ErasData, ErasActions {}

const useErasViewModel = (
  navigate: ReturnType<typeof useRootStack>
): ErasViewModel => {
  const $useGetAllEraTags = useGetAllEraTags();
  const $useCreateEraTag = useCreateEraTag();
  const $useDeleteEraTag = useDeleteEraTag();

  const [items, setItems] = useState<Tag[]>([]);
  const [item, setItem] = useState("");

  useEffect(() => {
    if ($useGetAllEraTags.data) {
      setItems($useGetAllEraTags.data);
    }
  }, [$useGetAllEraTags.data]);

  const addTag = () => {
    if (!item.trim()) {
      setItem("");
      return;
    }

    const tag: Tag = {
      tagId: item.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: item,
    };
    $useCreateEraTag.mutate(tag);
    setItem("");
  };
  const removeTag = (item: Tag) => {
    $useDeleteEraTag.mutate(item);
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

export default useErasViewModel;
