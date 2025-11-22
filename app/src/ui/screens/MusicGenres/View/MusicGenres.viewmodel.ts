import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateMusicGenre,
  useDeleteMusicGenre,
  useGetAllMusicGenres,
} from "../../../services/tags/useMusicGenres";

interface MusicGenresData {
  items: Tag[];
  item: string;
}
interface MusicGenresActions {
  setItem(item: string): void;
  addTag(): void;
  removeTag(item: Tag): void;
  searchTags(searchString: string): void;
}

export interface MusicGenresViewModel
  extends MusicGenresData,
    MusicGenresActions {}

const useMusicGenresViewModel = (
  navigate: ReturnType<typeof useRootStack>
): MusicGenresViewModel => {
  const $useGetAllMusicGenres = useGetAllMusicGenres();
  const $useCreateMusicGenre = useCreateMusicGenre();
  const $useDeleteMusicGenre = useDeleteMusicGenre();

  const [items, setItems] = useState<Tag[]>([]);
  const [item, setItem] = useState("");

  useEffect(() => {
    if ($useGetAllMusicGenres.data) {
      setItems($useGetAllMusicGenres.data);
    }
  }, [$useGetAllMusicGenres.data]);

  const addTag = () => {
    if (!item.trim()) {
      setItem("");
      return;
    }

    const tag: Tag = {
      tagId: item.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      name: item,
    };
    console.log("TAG", tag);
    $useCreateMusicGenre.mutate(tag);
    setItem("");
  };
  const removeTag = (item: Tag) => {
    $useDeleteMusicGenre.mutate(item);
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

export default useMusicGenresViewModel;
