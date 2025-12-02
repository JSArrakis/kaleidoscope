import { randomUUID } from "crypto";
import { createCollectionItems } from "./collectionItem.factory.js";

/**
 * Factory function to create a Collection with constructor-style parameters
 */
export function createCollection(
  title?: string,
  collectionId?: string,
  itemCount?: number,
  description?: string,
  items?: CollectionItem[]
): Collection {
  const id = collectionId ?? randomUUID();
  const count = itemCount ?? 3;
  return {
    collectionId: id,
    title: title ?? `Test Collection ${id.substring(0, 8)}`,
    description: description ?? `Test collection description`,
    itemCount: count,
    items: items ?? createCollectionItems(count, undefined, id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}