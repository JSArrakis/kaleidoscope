import * as promoController from "../controllers/promoController.js";

export async function getPromosHandler(): Promise<Promo[]> {
  console.log("[promoHandler] IPC: getPromos");
  return promoController.getAllPromos();
}

export async function createPromoHandler(
  promo: Promo
): Promise<{ message: string; status: number }> {
  console.log("[promoHandler] IPC: createPromo -", promo.mediaItemId);
  // Type-safe call with proper Promo type matching backend repository
  return promoController.createPromo(promo);
}

export async function deletePromoHandler(
  promo: Promo
): Promise<{ message: string; status: number }> {
  console.log("[promoHandler] IPC: deletePromo -", promo.mediaItemId);
  return promoController.deletePromo(promo.mediaItemId);
}

export async function updatePromoHandler(
  promo: Promo
): Promise<{ message: string; status: number }> {
  console.log("[promoHandler] IPC: updatePromo -", promo.mediaItemId);
  // Type-safe call with Partial<Promo> since controller expects updates
  return promoController.updatePromo(promo.mediaItemId, promo);
}
