import { showRepository } from "../repositories/showRepository.js";

export async function createShow(
  show: Show
): Promise<{ message: string; status: number }> {
  try {
    if (!show.mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = showRepository.findByMediaItemId(show.mediaItemId);
    if (existing) {
      return {
        message: `The Media Item ID '${show.mediaItemId}' already exists.`,
        status: 400,
      };
    }

    showRepository.create(show);
    return { message: `Show ${show.title} Created`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function getAllShows(): Show[] {
  return showRepository.findAll();
}

export function getShow(mediaItemId: string): Show | null {
  if (!mediaItemId) {
    throw new Error("Media Item ID is required");
  }

  const show = showRepository.findByMediaItemId(mediaItemId);
  if (!show) {
    throw new Error("Show does not exist");
  }

  return show;
}

export function updateShow(
  mediaItemId: string,
  updates: Partial<Show>
): { message: string; status: number } {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const existing = showRepository.findByMediaItemId(mediaItemId);
    if (!existing) {
      return { message: "Show does not exist", status: 400 };
    }

    const updated = {
      ...existing,
      ...updates,
      mediaItemId,
    };

    showRepository.update(mediaItemId, updated);
    return { message: "Show Updated", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteShow(mediaItemId: string): {
  message: string;
  status: number;
} {
  try {
    if (!mediaItemId) {
      return { message: "Media Item ID is required", status: 400 };
    }

    const show = showRepository.findByMediaItemId(mediaItemId);
    if (!show) {
      return { message: "Show does not exist", status: 400 };
    }

    showRepository.delete(mediaItemId);
    return { message: `Show ${show.title} Deleted`, status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
