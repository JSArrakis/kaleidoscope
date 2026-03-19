import * as shortController from "../controllers/shortController.js";

export async function getShortsHandler(): Promise<Short[]> {
  console.log("[shortHandler] IPC: getShorts");
  return shortController.getAllShorts();
}

export async function createShortHandler(
  short: Short
): Promise<{ message: string; status: number }> {
  console.log("[shortHandler] IPC: createShort -", short.mediaItemId);
  // Type-safe call with proper Short type matching backend repository
  return shortController.createShort(short);
}

export async function deleteShortHandler(
  short: Short
): Promise<{ message: string; status: number }> {
  console.log("[shortHandler] IPC: deleteShort -", short.mediaItemId);
  return shortController.deleteShort(short.mediaItemId);
}

export async function updateShortHandler(
  short: Short
): Promise<{ message: string; status: number }> {
  console.log("[shortHandler] IPC: updateShort -", short.mediaItemId);
  // Type-safe call with Partial<Short> since controller expects updates
  return shortController.updateShort(short.mediaItemId, short);
}
