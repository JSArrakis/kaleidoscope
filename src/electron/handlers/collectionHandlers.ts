import * as collectionController from "../controllers/collectionController.js";

export async function getCollectionsHandler(): Promise<any[]> {
  return collectionController.getAllCollections();
}

export async function createCollectionHandler(
  collection: any
): Promise<{ message: string; status: number }> {
  return collectionController.createCollection(collection);
}

export async function deleteCollectionHandler(
  collection: any
): Promise<{ message: string; status: number }> {
  return collectionController.deleteCollection(collection.collectionId);
}

export async function updateCollectionHandler(
  collection: any
): Promise<{ message: string; status: number }> {
  return collectionController.updateCollection(
    collection.collectionId,
    collection
  );
}
