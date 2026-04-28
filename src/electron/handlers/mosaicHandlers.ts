import { mosaicRepository } from "../repositories/mosaicRepository.js";
import { randomUUID } from "crypto";

export function getMosaicsHandler(): Mosaic[] {
  return mosaicRepository.findAll();
}

export function createMosaicHandler(
  mosaic: Omit<Mosaic, "mosaicId" | "createdAt" | "updatedAt">,
): { message: string; status: number } {
  try {
    const newMosaic: Mosaic = {
      ...mosaic,
      mosaicId: randomUUID(),
    };
    mosaicRepository.create(newMosaic);
    return { message: "Mosaic created", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function updateMosaicHandler(mosaic: Mosaic): {
  message: string;
  status: number;
} {
  try {
    const updated = mosaicRepository.update(mosaic.mosaicId, mosaic);
    if (!updated) {
      return { message: "Mosaic not found", status: 404 };
    }
    return { message: "Mosaic updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteMosaicHandler(mosaicId: string): {
  message: string;
  status: number;
} {
  try {
    const deleted = mosaicRepository.delete(mosaicId);
    if (!deleted) {
      return { message: "Mosaic not found", status: 404 };
    }
    return { message: "Mosaic deleted", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
