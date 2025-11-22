import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateGenreTag,
  useDeleteGenreTag,
  useGetAllGenreTags,
} from "../../../services/tags/useGenreTags";

interface GenresData {
  items: Tag[];
  item: string;
}
interface GenresActions {
  setItem(item: string): void;
  addTag(): void;
  removeTag(item: Tag): void;
  searchTags(searchString: string): void;
}

export interface GenresViewModel extends GenresData, GenresActions {}

const useGenresViewModel = (
  navigate: ReturnType<typeof useRootStack>
): GenresViewModel => {
  const $useGetAllGenreTags = useGetAllGenreTags();
  const $useCreateGenreTag = useCreateGenreTag();
  const $useDeleteGenreTag = useDeleteGenreTag();

  const [items, setItems] = useState<Tag[]>([]);
  const [item, setItem] = useState("");

  useEffect(() => {
    if ($useGetAllGenreTags.data) {
      setItems($useGetAllGenreTags.data);
    }
  }, [$useGetAllGenreTags.data]);

  const addTag = () => {
    if (!item.trim()) {
      setItem("");
      return;
    }

    const tag: Tag = {
      tagId: item.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: item,
    };
    $useCreateGenreTag.mutate(tag);
    setItem("");
  };
  const removeTag = (item: Tag) => {
    $useDeleteGenreTag.mutate(item);
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

export default useGenresViewModel;
