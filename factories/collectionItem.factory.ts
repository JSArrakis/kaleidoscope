import { randomUUID } from "crypto";

/**
 * Factory function to create a CollectionItem with constructor-style parameters
 */
export function createCollectionItem(
  collectionItemId?: string,
  collectionId?: string,
  mediaItemId?: string,
  sequence?: number,
  title?: string,
  path?: string,
  duration?: number,
  tags?: any[]
): CollectionItem {
  const id = collectionItemId ?? randomUUID();
  const colId = collectionId ?? randomUUID();
  return {
    collectionItemId: id,
    collectionId: colId,
    mediaItemId: mediaItemId ?? randomUUID(),
    sequence: sequence ?? 0,
    title,
    path,
    duration,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}