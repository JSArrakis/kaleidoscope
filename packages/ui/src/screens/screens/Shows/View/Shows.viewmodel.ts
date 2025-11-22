import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateShow,
  useDeleteShow,
  useGetAllShows,
  useUpdateShow,
} from "../../../services/media/useShows";
import { v4 as uuidv4 } from "uuid";

interface ShowsData {
  shows: PrismMediaItem[];
  selectedShow: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface ShowsActions {
  editShow: (movie: PrismMediaItem) => void;
  saveShow: (movie: PrismMediaItem) => void;
  onRemove: (movie: PrismMediaItem) => void;
  addShow: () => void;
}

export interface ShowsViewModel extends ShowsData, ShowsActions {}

const useShowsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): ShowsViewModel => {
  const $getShows = useGetAllShows();
  const $createShow = useCreateShow();
  const $deleteShow = useDeleteShow();
  const $updateShow = useUpdateShow();

  const [isEditModalOpen, setEditModalState] = useState(false);
  const [savedShows, setSavedShows] = useState<PrismMediaItem[]>([]);
  const [newShow, setNewShow] = useState<PrismMediaItem | null>(null);
  const [shows, setShows] = useState<PrismMediaItem[]>([]);
  const [selectedShow, setSelectedShow] = useState<PrismMediaItem | null>(null);

  useEffect(() => {
    if ($getShows.data) {
      console.log("getShows", $getShows.data);
      setSavedShows($getShows.data);
    }
  }, [$getShows.data]);

  useEffect(() => {
    let currentShows: PrismMediaItem[] = [];
    currentShows = newShow ? [newShow, ...savedShows] : [...savedShows];
    setShows(currentShows);
  }, [newShow, savedShows]);

  const editShow = (show: PrismMediaItem) => {
    if (isEditModalOpen) {
      setSelectedShow(null);
      setEditModalState(false);
      return;
    }

    const showToEdit = shows.find((m) => m.mediaItemId === show.mediaItemId);
    if (!showToEdit) {
      console.error("Show not found:", show);
      return;
    }

    const deepCopiedShow = JSON.parse(JSON.stringify(showToEdit));
    setSelectedShow(deepCopiedShow);
    setEditModalState(true);
  };

  const saveShow = (show: PrismMediaItem) => {
    if (show.mediaItemId === newShow?.mediaItemId) {
      if (!show.title) {
        console.error("Show title is required");
        return;
      }
      show.mediaItemId = show.title?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      $createShow.mutate(show, {
        onSuccess: () => {
          setNewShow(null);
          setEditModalState(false);
        },
      });
      return;
    }
    $updateShow.mutate(show);
    setSelectedShow(null);
    setEditModalState(false);
  };

  const onRemove = (show: PrismMediaItem) => {
    if (show.mediaItemId === newShow?.mediaItemId) {
      setNewShow(null);
      setEditModalState(false);
      return;
    } else {
      $deleteShow.mutate(show);
    }
  };

  const addShow = () => {
    if (newShow) {
      return;
    }
    const tempShow: PrismMediaItem = {
      mediaItemId: uuidv4(),
      title: "",
      episodes: [],
      tags: [],
    };
    setNewShow(tempShow);
  };

  return {
    shows,
    selectedShow,
    isEditModalOpen,
    editShow,
    saveShow,
    onRemove,
    addShow,
  };
};

export default useShowsViewModel;
