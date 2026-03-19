import * as collectionController from "../controllers/collectionController.js";
export async function getCollectionsHandler() {
    return collectionController.getAllCollections();
}
export async function createCollectionHandler(collection) {
    return collectionController.createCollection(collection);
}
export async function deleteCollectionHandler(collection) {
    return collectionController.deleteCollection(collection.collectionId);
}
export async function updateCollectionHandler(collection) {
    return collectionController.updateCollection(collection.collectionId, collection);
}
