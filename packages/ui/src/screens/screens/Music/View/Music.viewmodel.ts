import { useEffect, useState } from "react";
import useRootStack from "../../../navigation/useRootStack";
import { normalizeItem } from "../../../common/helpers";
import {
  useGetAllMusicVideos,
  useCreateMusicVideo,
  useDeleteMusicVideo,
  useUpdateMusicVideo,
} from "../../../services/media/useMusicVideos";

interface MusicVideosData {
  musicVideos: PrismMediaItem[];
  selectedMusicVideo: PrismMediaItem | null;
  isEditModalOpen: boolean;
}
interface MusicVideosActions {
  editMusicVideo: (musicVideo: PrismMediaItem) => void;
  saveMusicVideo: (musicVideo: PrismMediaItem) => void;
  onRemove: (musicVideo: PrismMediaItem) => void;
  addMusicVideos: () => void;
}

export interface MusicVideosViewModel extends MusicVideosData, MusicVideosActions {}

const useMusicVideosViewModel = (
  navigate: ReturnType<typeof useRootStack>
): MusicVideosViewModel => {
  const $getMusicVideos = useGetAllMusicVideos();
  const $createMusicVideo = useCreateMusicVideo();
  const $deleteMusicVideo = useDeleteMusicVideo();
  const $updateMusicVideo = useUpdateMusicVideo();

  const [savedMusicVideos, setSavedMusicVideos] = useState<PrismMediaItem[]>([]);

  const [newMusicVideos, setNewMusicVideos] = useState<PrismMediaItem[]>([]);

  const [musicVideos, setMusicVideos] = useState<PrismMediaItem[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedMusicVideo, setSelectedMusicVideo] = useState<PrismMediaItem | null>(
    null
  );

  useEffect(() => {
    if ($getMusicVideos.data) {
      setSavedMusicVideos($getMusicVideos.data);
    }
  }, [$getMusicVideos.data]);

  useEffect(() => {
    let currentMusicVideos: PrismMediaItem[] = [];
    currentMusicVideos = [...newMusicVideos, ...savedMusicVideos];
    setMusicVideos(currentMusicVideos);
  }, [newMusicVideos, savedMusicVideos]);

  const addMusicVideos = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newMusicVideos = filePaths.map((musicVideoPath: string) => ({
        mediaItemId: normalizeItem(musicVideoPath),
        path: musicVideoPath,
        tags: [],
      }));

      setNewMusicVideos((prev) => [...prev, ...newMusicVideos]);
    }
  };

  const editMusicVideo = (musicVideo: PrismMediaItem) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const musicVideoToEdit = musicVideos.find((m) => m.mediaItemId === musicVideo.mediaItemId);
    if (!musicVideoToEdit) {
      console.error("MusicVideo not found:", musicVideo);
      return;
    }
    setSelectedMusicVideo(musicVideoToEdit);
    setEditModalState(true);
  };

  const saveMusicVideo = (musicVideo: PrismMediaItem) => {
    const deepCopiedMusicVideo = JSON.parse(JSON.stringify(musicVideo));
    const existingMusicVideo = savedMusicVideos.find(
      (m) => m.mediaItemId === deepCopiedMusicVideo.mediaItemId
    );

    if (existingMusicVideo) {
      $updateMusicVideo.mutate(deepCopiedMusicVideo);
      setSelectedMusicVideo(null);
      setEditModalState(false);
      setNewMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedMusicVideo.mediaItemId)
      );
      return;
    }
    setSelectedMusicVideo(null);
    setEditModalState(false);
    setNewMusicVideos((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedMusicVideo.mediaItemId)
    );
    $createMusicVideo.mutate(deepCopiedMusicVideo);
  };

  const onRemove = (item: PrismMediaItem) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedMusicVideo?.mediaItemId) {
      setSelectedMusicVideo(null);
    }

    if (newMusicVideos.includes(item)) {
      setNewMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      return;
    } else {
      setSavedMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId)
      );
      $deleteMusicVideo.mutate(item);
    }
  };

  return {
    musicVideos,
    selectedMusicVideo,
    isEditModalOpen,
    editMusicVideo,
    saveMusicVideo,
    onRemove,
    addMusicVideos,
  };
};

export default useMusicVideosViewModel;
