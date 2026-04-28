import * as collectionController from "../controllers/collectionController.js";

export async function getCollectionsHandler(): Promise<Collection[]> {
  return collectionController.getAllCollections();
}

export async function createCollectionHandler(
  collection: Collection,
): Promise<{ message: string; status: number }> {
  return collectionController.createCollection(collection);
}

export async function deleteCollectionHandler(
  collection: Collection,
): Promise<{ message: string; status: number }> {
  return collectionController.deleteCollection(collection.collectionId);
}

export async function updateCollectionHandler(
  collection: Collection,
): Promise<{ message: string; status: number }> {
  return collectionController.updateCollection(
    collection.collectionId,
    collection,
  );
}
