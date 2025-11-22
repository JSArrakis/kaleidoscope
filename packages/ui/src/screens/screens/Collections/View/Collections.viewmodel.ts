import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useRootStack from "../../../navigation/useRootStack";
import {
  useCreateCollection,
  useDeleteCollection,
  useGetAllCollections,
  useUpdateCollection,
} from "../../../services/curations/useCollections";
import { useGetAllMovies } from "../../../services/media/useMovies";

interface CollectionsData {
  isEditModalOpen: boolean;
}
interface CollectionsActions {
  selectedCollection: PrismCurationObj | null;
  collections: PrismCurationObj[];
  movies: PrismMediaItem[];
  addCollection: () => void;
  onEdit: (item: PrismCurationObj) => void;
  onSave: (item: PrismCurationObj) => void;
  onSaveNew: (item: PrismCurationObj) => void;
  onRemove: (item: PrismCurationObj) => void;
}

export interface CollectionsViewModel
  extends CollectionsData,
    CollectionsActions {}

const useCollectionsViewModel = (
  navigate: ReturnType<typeof useRootStack>
): CollectionsViewModel => {
  const $getCollections = useGetAllCollections();
  const $createCollection = useCreateCollection();
  const $deleteCollection = useDeleteCollection();
  const $updateCollection = useUpdateCollection();
  const $movies = useGetAllMovies();

  const [isEditModalOpen, setEditModalState] = useState(false);
  const [savedCollections, setSavedCollections] = useState<PrismCurationObj[]>(
    []
  );
  const [newCollection, setNewCollection] = useState<PrismCurationObj | null>(
    null
  );
  const [collections, setCollections] = useState<PrismCurationObj[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<PrismCurationObj | null>(null);
  const [movies, setMovies] = useState<PrismMediaItem[]>([]);

  useEffect(() => {
    if ($getCollections.data) {
      setSavedCollections($getCollections.data);
    }
  }, [$getCollections.data]);

  useEffect(() => {
    if ($movies.data) {
      setMovies($movies.data);
    }
  }, [$movies.data]);

  useEffect(() => {
    let currentCollections: PrismCurationObj[] = [];
    currentCollections = newCollection
      ? [newCollection, ...savedCollections]
      : [...savedCollections];
    setCollections(currentCollections);
  }, [newCollection, savedCollections]);

  const onEdit = (collection: PrismCurationObj) => {
    if (isEditModalOpen) {
      setSelectedCollection(null);
      setEditModalState(false);
      return;
    }

    const collectionToEdit = collections.find(
      (m) => m.mediaItemId === collection.mediaItemId
    );
    if (!collectionToEdit) {
      console.error("Collection not found:", collection);
      return;
    }

    const deepCopiedCollection = JSON.parse(JSON.stringify(collectionToEdit));
    setSelectedCollection(deepCopiedCollection);
    setEditModalState(true);
  };

  const onSaveNew = (item: PrismCurationObj) => {
    $createCollection.mutate(item);
    setNewCollection(null);
    setEditModalState(false);
  };

  const onSave = (item: PrismCurationObj) => {
    const deepCopiedSelectedCollection = JSON.parse(JSON.stringify(item));
    const existingCollection = collections.find(
      (c) => c.mediaItemId === deepCopiedSelectedCollection.mediaItemId
    );
    if (existingCollection) {
      $updateCollection.mutate(deepCopiedSelectedCollection);
      setSelectedCollection(null);
      setNewCollection(null);
      setEditModalState(false);
      return;
    }
    $createCollection.mutate(deepCopiedSelectedCollection);
    setSelectedCollection(null);
    setNewCollection(null);
    setEditModalState(false);
  };

  const onRemove = (item: PrismCurationObj) => {
    if (item.mediaItemId === newCollection?.mediaItemId) {
      setNewCollection(null);
      return;
    } else {
      $deleteCollection.mutate(item);
    }
  };

  const addCollection = () => {
    if (newCollection) {
      return;
    }
    const tempCollection: PrismCurationObj = {
      mediaItemId: uuidv4(),
      title: "",
      description: "",
      items: [],
    };
    setNewCollection(tempCollection);
  };

  return {
    selectedCollection,
    isEditModalOpen,
    collections,
    movies,
    addCollection,
    onEdit,
    onSave,
    onSaveNew,
    onRemove,
  };
};

export default useCollectionsViewModel;
