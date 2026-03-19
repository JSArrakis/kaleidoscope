import { tagRepository } from "../repositories/tagsRepository.js";
/**
 * Create a new tag
 */
export async function createTag(tag) {
    try {
        console.log("[tagController] Creating tag:", tag.tagId, "type:", tag.type);
        if (!tag.tagId) {
            return { message: "tagId is required", status: 400 };
        }
        if (!tag.type) {
            return { message: "type is required", status: 400 };
        }
        const validTypes = [
            "Aesthetic",
            "Era",
            "Genre",
            "Specialty",
            "Holiday",
            "AgeGroup",
            "MusicGenre",
        ];
        if (!validTypes.includes(tag.type)) {
            return { message: `Invalid tag type: ${tag.type}`, status: 400 };
        }
        const existing = tagRepository.findByTagId(tag.tagId);
        if (existing) {
            console.log("[tagController] Tag already exists:", tag.tagId);
            return {
                message: `Tag with ID ${tag.tagId} already exists`,
                status: 400,
            };
        }
        tagRepository.create(tag);
        console.log("[tagController] Tag created successfully:", tag.tagId);
        return { message: `Tag ${tag.name} Created`, status: 200 };
    }
    catch (error) {
        console.error("[tagController] Error creating tag:", error);
        if (error.message?.includes("already exists")) {
            return { message: error.message, status: 400 };
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 500 };
    }
}
/**
 * Get all tags
 */
export function getAllTags() {
    return tagRepository.findAll();
}
/**
 * Get all tags by type
 */
export function getTagsByType(type) {
    console.log("[tagController] Fetching tags for type:", type);
    const validTypes = [
        "Aesthetic",
        "Era",
        "Genre",
        "Specialty",
        "Holiday",
        "AgeGroup",
        "MusicGenre",
    ];
    if (!validTypes.includes(type)) {
        throw new Error(`Invalid tag type: ${type}`);
    }
    const tags = tagRepository.findByType(type);
    console.log("[tagController] Found", tags.length, "tags for type:", type);
    return tags;
}
/**
 * Get tag by tagId
 */
export function getTag(tagId) {
    if (!tagId) {
        throw new Error("tagId is required");
    }
    const tag = tagRepository.findByTagId(tagId);
    if (!tag) {
        throw new Error(`Tag with ID ${tagId} does not exist`);
    }
    return tag;
}
/**
 * Update existing tag
 */
export function updateTag(tagId, updates) {
    try {
        if (!tagId) {
            return { message: "tagId is required", status: 400 };
        }
        const existing = tagRepository.findByTagId(tagId);
        if (!existing) {
            return { message: `Tag with ID ${tagId} does not exist`, status: 400 };
        }
        const updated = {
            ...existing,
            ...updates,
            tagId, // Ensure ID doesn't change
        };
        tagRepository.update(tagId, updated);
        return { message: "Tag Updated", status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
/**
 * Delete tag
 */
export function deleteTag(tagId) {
    try {
        if (!tagId) {
            return { message: "tagId is required", status: 400 };
        }
        const tag = tagRepository.findByTagId(tagId);
        if (!tag) {
            return { message: `Tag with ID ${tagId} does not exist`, status: 400 };
        }
        tagRepository.delete(tagId);
        return { message: `Tag ${tag.name} Deleted`, status: 200 };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { message: errorMessage, status: 400 };
    }
}
