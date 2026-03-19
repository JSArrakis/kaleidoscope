import { musicRepository } from "../repositories/musicRepository.js";
export async function createMusic(music) {
    try {
        if (!music.mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const existing = musicRepository.findByMediaItemId(music.mediaItemId);
        if (existing) {
            return {
                message: `The Media Item ID '${music.mediaItemId}' already exists.`,
                status: 400,
            };
        }
        musicRepository.create(music);
        return { message: `Music ${music.title} Created`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function getAllMusic() {
    return musicRepository.findAll();
}
export function getMusic(mediaItemId) {
    if (!mediaItemId) {
        throw new Error("Media Item ID is required");
    }
    const music = musicRepository.findByMediaItemId(mediaItemId);
    if (!music) {
        throw new Error("Music does not exist");
    }
    return music;
}
export function updateMusic(mediaItemId, updates) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const existing = musicRepository.findByMediaItemId(mediaItemId);
        if (!existing) {
            return { message: "Music does not exist", status: 400 };
        }
        const updated = {
            ...existing,
            ...updates,
            mediaItemId,
        };
        musicRepository.update(mediaItemId, updated);
        return { message: "Music Updated", status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
export function deleteMusic(mediaItemId) {
    try {
        if (!mediaItemId) {
            return { message: "Media Item ID is required", status: 400 };
        }
        const music = musicRepository.findByMediaItemId(mediaItemId);
        if (!music) {
            return { message: "Music does not exist", status: 400 };
        }
        musicRepository.delete(mediaItemId);
        return { message: `Music ${music.title} Deleted`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
