import { Promo, promoRepository } from "../repositories/promoRepository.js";

export async function createPromo(
  promo: Promo
): Promise<{ message: string; status: number }> {
  try {
    if (!promo.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = promoRepository.findByMediaItemId(promo.mediaItemId);
    if (existing) {
      return {
        message: `The Media Item ID '${promo.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    promoRepository.create(promo);
    return { message: `Promo ${promo.title} Created`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function getAllPromos(): Promo[] {
  return promoRepository.findAll();
}

export function getPromo(mediaItemId: string): Promo | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const promo = promoRepository.findByMediaItemId(mediaItemId);
  if (!promo) {
    throw new Error("Promo does not exist");
  }

  return promo;
}

export function updatePromo(
  mediaItemId: string,
  updates: Partial<Promo>
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = promoRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Promo does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId,
    };

    promoRepository.update(mediaItemId, updated);
    return { message: "Promo Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deletePromo(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const promo = promoRepository.findByMediaItemId(mediaItemId);
    if (!promo) {
      return { message: "Promo does not exist", status: 400 };
    }

    promoRepository.delete(mediaItemId);
    return { message: `Promo ${promo.title} Deleted`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
