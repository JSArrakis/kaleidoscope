import { showRepository } from "../../../../src/electron/repositories/showRepository.js";
import { getDB } from "../../../../src/electron/db/sqlite.js";
import {
  createGenreAndAestheticTagsPackage,
  createMultipleShowsPackage,
  setupTestPackage,
  combinePackages,
} from "./packages.js";

describe("showRepository.findByTag", () => {
  const db = getDB();

  // Step 1 & 2: Setup using test packages
  let cleanup: (() => void) | null = null;

  beforeAll(() => {
    // Combine packages: tags + multiple shows with different tags
    const tagsPackage = createGenreAndAestheticTagsPackage(db);

    const showsPackage = createMultipleShowsPackage(db, [
      {
        mediaItemId: "show-tag-scifi-1",
        title: "Sci-Fi Tag Show",
        primaryTagId: "genre-scifi",
      },
      {
        mediaItemId: "show-tag-action-1",
        title: "Action Tag Show",
        primaryTagId: "genre-action",
      },
      {
        mediaItemId: "show-tag-scifi-2",
        title: "Another Sci-Fi Show",
        primaryTagId: "genre-scifi",
      },
      {
        mediaItemId: "show-tag-drama-1",
        title: "Drama Tag Show",
        primaryTagId: "genre-drama",
      },
    ]);

    const combinedPackage = combinePackages(tagsPackage, showsPackage);
    cleanup = setupTestPackage(combinedPackage);
  });

  // Step 3: Clean per-suite data
  afterAll(() => {
    if (cleanup) {
      cleanup();
    }
  });

  // Tests
  test("should return only shows with the specified tag", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - should find both sci-fi shows
    expect(
      result.some((show) => show.mediaItemId === "show-tag-scifi-1")
    ).toBeTruthy();
    expect(
      result.some((show) => show.mediaItemId === "show-tag-scifi-2")
    ).toBeTruthy();

    // Should not find non-sci-fi shows
    expect(
      result.some((show) => show.mediaItemId === "show-tag-action-1")
    ).toBeFalsy();
    expect(
      result.some((show) => show.mediaItemId === "show-tag-drama-1")
    ).toBeFalsy();
  });

  test("should filter shows by action tag", () => {
    // Act
    const result = showRepository.findByTag("genre-action");

    // Assert
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(
      result.some((show) => show.mediaItemId === "show-tag-action-1")
    ).toBeTruthy();
    expect(
      result.some((show) => show.mediaItemId === "show-tag-scifi-1")
    ).toBeFalsy();
  });

  test("should return empty array when no shows have the tag", () => {
    // Act
    const result = showRepository.findByTag("aesthetic-retro");

    // Assert - retro is not assigned to any show
    expect(result.length).toBe(0);
  });

  test("should return results ordered by show title", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - results should be sorted by title
    const titles = result.map((s) => s.title);
    expect(titles).toEqual([...titles].sort());
  });

  test("should include episodes for returned shows", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - all returned shows should have episodes
    for (const show of result) {
      expect(show.episodes).toBeDefined();
      expect(show.episodes.length).toBeGreaterThan(0);
    }
  });

  test("should include episodes ordered by episodeNumber then episode", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - verify episode ordering
    for (const show of result) {
      if (show.episodes && show.episodes.length > 1) {
        for (let i = 0; i < show.episodes.length - 1; i++) {
          const current = show.episodes[i];
          const next = show.episodes[i + 1];
          const currentNum = current.episodeNumber ?? 0;
          const nextNum = next.episodeNumber ?? 0;
          expect(currentNum).toBeLessThanOrEqual(nextNum);
        }
      }
    }
  });

  test("should include the primary tag being filtered in returned shows", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - all shows should have the requested tag
    for (const show of result) {
      expect(show.tags).toBeDefined();
      expect(show.tags.length).toBeGreaterThan(0);
      expect(show.tags.some((t) => t.tagId === "genre-scifi")).toBeTruthy();
    }
  });

  test("should include secondary tags array for all returned shows", () => {
    // Act
    const result = showRepository.findByTag("genre-drama");

    // Assert - all shows should have secondaryTags array
    for (const show of result) {
      expect(show.secondaryTags).toBeDefined();
      expect(Array.isArray(show.secondaryTags)).toBe(true);
    }
  });

  test("should return distinct shows when filtering", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - should not have duplicate shows
    const mediaItemIds = result.map((s) => s.mediaItemId);
    const uniqueIds = new Set(mediaItemIds);
    expect(mediaItemIds.length).toBe(uniqueIds.size);
  });

  test("should include all required show properties in results", () => {
    // Act
    const result = showRepository.findByTag("genre-action");

    // Assert
    const show = result[0];
    if (show) {
      expect(show).toHaveProperty("mediaItemId");
      expect(show).toHaveProperty("title");
      expect(show).toHaveProperty("type");
      expect(show).toHaveProperty("tags");
      expect(show).toHaveProperty("secondaryTags");
      expect(show).toHaveProperty("episodes");
      expect(show).toHaveProperty("episodeCount");
    }
  });

  test("should include episode tags in episode objects", () => {
    // Act
    const result = showRepository.findByTag("genre-scifi");

    // Assert - episodes should have tags
    for (const show of result) {
      if (show.episodes && show.episodes.length > 0) {
        for (const episode of show.episodes) {
          expect(episode).toHaveProperty("tags");
          expect(Array.isArray(episode.tags)).toBe(true);
        }
      }
    }
  });
});
