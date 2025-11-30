import {
  Collection,
  collectionRepository,
} from "../repositories/collectionRepository.js";

/**
 * Create a new collection
 */
export async function createCollection(
  collection: Collection
): Promise<{ message: string; status: number }> {
  try {
    console.log(
      "[collectionController] Creating collection:",
      collection.collectionId,
      collection.title
    );
    if (!collection.collectionId) {
      return { message: "Collection ID is required", status: 400 };
    }

    const existing = collectionRepository.findByCollectionId(
      collection.collectionId
    );
    if (existing) {
      console.log(
        "[collectionController] Collection already exists:",
        collection.collectionId
      );
      return {
        message: `The Collection ID '${collection.collectionId}' already exists.`,
        status: 400,
      };
    }

    collectionRepository.create(collection);
    console.log(
      "[collectionController] Collection created successfully:",
      collection.collectionId
    );
    return {
      message: `Collection ${collection.title} Created`,
      status: 200,
    };
  } catch (error) {
    console.error("[collectionController] Error creating collection:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

/**
 * Get all collections
 */
export function getAllCollections(): Collection[] {
  console.log("[collectionController] Fetching all collections");
  const collections = collectionRepository.findAll();
  console.log(
    "[collectionController] Found",
    collections.length,
    "collections"
  );
  return collections;
}

/**
 * Get a single collection
 */
export function getCollection(collectionId: string): Collection | undefined {
  const collection = collectionRepository.findByCollectionId(collectionId);
  if (!collection) {
    throw new Error(`Collection with ID '${collectionId}' not found`);
  }
  return collection;
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  updates: Partial<Collection>
): Promise<{ message: string; status: number }> {
  try {
    const existing = collectionRepository.findByCollectionId(collectionId);
    if (!existing) {
      return {
        message: `Collection with ID '${collectionId}' not found`,
        status: 404,
      };
    }

    const updated = collectionRepository.updateCollection(collectionId, {
      ...existing,
      ...updates,
    } as Collection);
    if (!updated) {
      return { message: `Failed to update collection`, status: 500 };
    }
    return { message: `Collection updated successfully`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 500 };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  collectionId: string
): Promise<{ message: string; status: number }> {
  try {
    const existing = collectionRepository.findByCollectionId(collectionId);
    if (!existing) {
      return {
        message: `Collection with ID '${collectionId}' not found`,
        status: 404,
      };
    }

    collectionRepository.deleteCollection(collectionId);
    return { message: `Collection deleted successfully`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 500 };
  }
}
