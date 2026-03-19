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
  musicVideos: Music[];
  selectedMusicVideo: Music | null;
  isEditModalOpen: boolean;
}
interface MusicVideosActions {
  editMusicVideo: (musicVideo: Music) => void;
  saveMusicVideo: (musicVideo: Music) => void;
  onRemove: (musicVideo: Music) => void;
  addMusicVideos: () => void;
}

export interface MusicVideosViewModel
  extends MusicVideosData, MusicVideosActions {}

const useMusicVideosViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): MusicVideosViewModel => {
  const $getMusicVideos = useGetAllMusicVideos();
  const $createMusicVideo = useCreateMusicVideo();
  const $deleteMusicVideo = useDeleteMusicVideo();
  const $updateMusicVideo = useUpdateMusicVideo();

  const [savedMusicVideos, setSavedMusicVideos] = useState<Music[]>([]);

  const [newMusicVideos, setNewMusicVideos] = useState<Music[]>([]);

  const [musicVideos, setMusicVideos] = useState<Music[]>([]);
  const [isEditModalOpen, setEditModalState] = useState(false);
  const [selectedMusicVideo, setSelectedMusicVideo] = useState<Music | null>(
    null,
  );

  useEffect(() => {
    if ($getMusicVideos.data) {
      setSavedMusicVideos($getMusicVideos.data);
    }
  }, [$getMusicVideos.data]);

  useEffect(() => {
    let currentMusicVideos: Music[] = [];
    currentMusicVideos = [...newMusicVideos, ...savedMusicVideos];
    setMusicVideos(currentMusicVideos);
  }, [newMusicVideos, savedMusicVideos]);

  const addMusicVideos = async () => {
    const filePaths = await window.electron.openFileDialogHandler();
    if (filePaths.length > 0) {
      const newMusicVideosList: Music[] = filePaths.map(
        (musicVideoPath: string) => ({
          mediaItemId: normalizeItem(musicVideoPath),
          title: "",
          artist: "",
          path: musicVideoPath,
          duration: 0,
          isHolidayExclusive: false,
          type: MediaType.Music,
          tags: [] as Tag[],
        }),
      );

      for (const musicVideo of newMusicVideosList) {
        const existingMusicVideo = savedMusicVideos.find(
          (m) => m.mediaItemId === musicVideo.mediaItemId,
        );
        if (!existingMusicVideo) {
          $createMusicVideo.mutate(musicVideo);
        }
      }
    }
  };

  const editMusicVideo = (musicVideo: Music) => {
    if (isEditModalOpen) {
      setEditModalState(false);
      return;
    }

    const musicVideoToEdit = musicVideos.find(
      (m) => m.mediaItemId === musicVideo.mediaItemId,
    );
    if (!musicVideoToEdit) {
      console.error("MusicVideo not found:", musicVideo);
      return;
    }
    setSelectedMusicVideo(musicVideoToEdit);
    setEditModalState(true);
  };

  const saveMusicVideo = (musicVideo: Music) => {
    const deepCopiedMusicVideo = JSON.parse(JSON.stringify(musicVideo));
    const existingMusicVideo = savedMusicVideos.find(
      (m) => m.mediaItemId === deepCopiedMusicVideo.mediaItemId,
    );

    if (existingMusicVideo) {
      $updateMusicVideo.mutate(deepCopiedMusicVideo);
      setSelectedMusicVideo(null);
      setEditModalState(false);
      setNewMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== deepCopiedMusicVideo.mediaItemId),
      );
      return;
    }
    setSelectedMusicVideo(null);
    setEditModalState(false);
    setNewMusicVideos((prev) =>
      prev.filter((m) => m.mediaItemId !== deepCopiedMusicVideo.mediaItemId),
    );
    $createMusicVideo.mutate(deepCopiedMusicVideo);
  };

  const onRemove = (item: Music) => {
    setEditModalState(false);
    if (item.mediaItemId === selectedMusicVideo?.mediaItemId) {
      setSelectedMusicVideo(null);
    }

    if (newMusicVideos.includes(item)) {
      setNewMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
      );
      return;
    } else {
      setSavedMusicVideos((prev) =>
        prev.filter((m) => m.mediaItemId !== item.mediaItemId),
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
