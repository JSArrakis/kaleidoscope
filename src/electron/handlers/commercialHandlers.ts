import * as commercialController from "../controllers/commercialController.js";

export async function getCommercialsHandler(): Promise<Commercial[]> {
  console.log("[commercialHandler] IPC: getCommercials");
  return commercialController.getAllCommercials();
}

export async function createCommercialHandler(
  commercial: Commercial
): Promise<{ message: string; status: number }> {
  console.log(
    "[commercialHandler] IPC: createCommercial -",
    commercial.mediaItemId
  );
  // Type-safe call with proper Commercial type matching backend repository
  return commercialController.createCommercial(commercial);
}

export async function deleteCommercialHandler(
  commercial: Commercial
): Promise<{ message: string; status: number }> {
  console.log(
    "[commercialHandler] IPC: deleteCommercial -",
    commercial.mediaItemId
  );
  return commercialController.deleteCommercial(commercial.mediaItemId);
}

export async function updateCommercialHandler(
  commercial: Commercial
): Promise<{ message: string; status: number }> {
  console.log(
    "[commercialHandler] IPC: updateCommercial -",
    commercial.mediaItemId
  );
  // Type-safe call with Partial<Commercial> since controller expects updates
  return commercialController.updateCommercial(
    commercial.mediaItemId,
    commercial
  );
}
