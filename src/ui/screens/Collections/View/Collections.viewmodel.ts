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
  selectedCollection: Collection | null;
  collections: Collection[];
  movies: Movie[];
  addCollection: () => void;
  onEdit: (item: Collection) => void;
  onSave: (item: Collection) => void;
  onSaveNew: (item: Collection) => void;
  onRemove: (item: Collection) => void;
}

export interface CollectionsViewModel
  extends CollectionsData, CollectionsActions {}

const useCollectionsViewModel = (
  navigate: ReturnType<typeof useRootStack>,
): CollectionsViewModel => {
  const $getCollections = useGetAllCollections();
  const $createCollection = useCreateCollection();
  const $deleteCollection = useDeleteCollection();
  const $updateCollection = useUpdateCollection();
  const $movies = useGetAllMovies();

  const [isEditModalOpen, setEditModalState] = useState(false);
  const [savedCollections, setSavedCollections] = useState<Collection[]>([]);
  const [newCollection, setNewCollection] = useState<Collection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);

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
    let currentCollections: Collection[] = [];
    currentCollections = newCollection
      ? [newCollection, ...savedCollections]
      : [...savedCollections];
    setCollections(currentCollections);
  }, [newCollection, savedCollections]);

  const onEdit = (collection: Collection) => {
    if (isEditModalOpen) {
      setSelectedCollection(null);
      setEditModalState(false);
      return;
    }

    const collectionToEdit = collections.find(
      (m) => m.collectionId === collection.collectionId,
    );
    if (!collectionToEdit) {
      console.error("Collection not found:", collection);
      return;
    }

    const deepCopiedCollection = JSON.parse(JSON.stringify(collectionToEdit));
    setSelectedCollection(deepCopiedCollection);
    setEditModalState(true);
  };

  const onSaveNew = (item: Collection) => {
    $createCollection.mutate(item);
    setNewCollection(null);
    setEditModalState(false);
  };

  const onSave = (item: Collection) => {
    const deepCopiedSelectedCollection = JSON.parse(JSON.stringify(item));
    const existingCollection = collections.find(
      (c) => c.collectionId === deepCopiedSelectedCollection.collectionId,
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

  const onRemove = (item: Collection) => {
    if (item.collectionId === newCollection?.collectionId) {
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
    const tempCollection: Collection = {
      collectionId: uuidv4(),
      title: "",
      description: "",
      items: [],
      itemCount: 0,
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
