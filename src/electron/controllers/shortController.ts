import { shortRepository } from "../repositories/shortRepository.js";

export async function createShort(
  short: Short
): Promise<{ message: string; status: number }> {
  try {
    if (!short.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = shortRepository.findByMediaItemId(short.mediaItemId);
    if (existing) {
      return {
        message: `The Media Item ID '${short.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    shortRepository.create(short);
    return { message: `Short ${short.title} Created`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function getAllShorts(): Short[] {
  return shortRepository.findAll();
}

export function getShort(mediaItemId: string): Short | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const short = shortRepository.findByMediaItemId(mediaItemId);
  if (!short) {
    throw new Error("Short does not exist");
  }

  return short;
}

export function updateShort(
  mediaItemId: string,
  updates: Partial<Short>
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = shortRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Short does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId,
    };

    shortRepository.update(mediaItemId, updated);
    return { message: "Short Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteShort(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const short = shortRepository.findByMediaItemId(mediaItemId);
    if (!short) {
      return { message: "Short does not exist", status: 400 };
    }

    shortRepository.delete(mediaItemId);
    return { message: `Short ${short.title} Deleted`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
