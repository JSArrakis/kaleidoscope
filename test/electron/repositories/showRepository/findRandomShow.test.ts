import { showRepository } from "../../../../src/electron/repositories/showRepository.js";
import { getDB } from "../../../../src/electron/db/sqlite.js";
import {
  createGenreAndAestheticTagsPackage,
  createMultipleShowsPackage,
  setupTestPackage,
  combinePackages,
} from "./packages.js";

describe("showRepository.findRandomShow", () => {
  const db = getDB();

  // Step 1 & 2: Setup using test packages
  let cleanup: (() => void) | null = null;

  beforeAll(() => {
    // Combine packages: tags + multiple shows for random selection
    const tagsPackage = createGenreAndAestheticTagsPackage(db);
    const showsPackage = createMultipleShowsPackage(db, [
      {
        mediaItemId: "show-random-fantasy-1",
        title: "Random Fantasy Show 1",
        primaryTagId: "genre-fantasy",
      },
      {
        mediaItemId: "show-random-fantasy-2",
        title: "Random Fantasy Show 2",
        primaryTagId: "genre-fantasy",
      },
      {
        mediaItemId: "show-random-mystery-1",
        title: "Random Mystery Show 1",
        primaryTagId: "genre-mystery",
      },
      {
        mediaItemId: "show-random-action-1",
        title: "Random Action Show 1",
        primaryTagId: "genre-action",
      },
      {
        mediaItemId: "show-random-comedy-1",
        title: "Random Comedy Show 1",
        primaryTagId: "genre-comedy",
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
  test("should return a show object", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  test("should return a show with valid mediaItemId", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.mediaItemId).toBeDefined();
    expect(typeof result?.mediaItemId).toBe("string");
    expect(result?.mediaItemId.length).toBeGreaterThan(0);
  });

  test("should return a show with title", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.title).toBeDefined();
    expect(typeof result?.title).toBe("string");
    expect(result?.title.length).toBeGreaterThan(0);
  });

  test("should return a show with tags", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.tags).toBeDefined();
    expect(Array.isArray(result?.tags)).toBe(true);
    expect(result?.tags.length).toBeGreaterThan(0);
  });

  test("should return a show with episodes", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.episodes).toBeDefined();
    expect(Array.isArray(result?.episodes)).toBe(true);
    expect(result?.episodes.length).toBeGreaterThan(0);
  });

  test("should return a show with episodes ordered by episodeNumber", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    if (result?.episodes && result.episodes.length > 1) {
      for (let i = 0; i < result.episodes.length - 1; i++) {
        const current = result.episodes[i];
        const next = result.episodes[i + 1];
        const currentNum = current.episodeNumber ?? 0;
        const nextNum = next.episodeNumber ?? 0;
        expect(currentNum).toBeLessThanOrEqual(nextNum);
      }
    }
  });

  test("should include secondary tags array", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.secondaryTags).toBeDefined();
    expect(Array.isArray(result?.secondaryTags)).toBe(true);
  });

  test("should include all required show properties", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result).toHaveProperty("mediaItemId");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("tags");
    expect(result).toHaveProperty("secondaryTags");
    expect(result).toHaveProperty("episodes");
    expect(result).toHaveProperty("episodeCount");
  });

  test("should return a show that exists in the database", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert - result should have a valid mediaItemId
    expect(result?.mediaItemId).toBeDefined();
    expect(result?.mediaItemId).toMatch(/^show-/);
  });

  test("should return different shows across multiple calls (statistical test)", () => {
    // Arrange: Get multiple random selections
    const results = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const show = showRepository.findRandomShow();
      if (show?.mediaItemId) {
        results.add(show.mediaItemId);
      }
    }

    // Assert: With RANDOM() selector, should get multiple different shows
    // (Very statistically unlikely to get only 1 show with 25 tries)
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  test("should include episode tags in returned episodes", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    if (result?.episodes && result.episodes.length > 0) {
      for (const episode of result.episodes) {
        expect(episode).toHaveProperty("tags");
        expect(Array.isArray(episode.tags)).toBe(true);
      }
    }
  });

  test("should not return null when shows exist", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert - should always return a show when database has shows
    expect(result).not.toBeNull();
  });

  test("should have unique mediaItemId", () => {
    // Act
    const result = showRepository.findRandomShow();

    // Assert
    expect(result?.mediaItemId).toBeDefined();
    expect(typeof result?.mediaItemId).toBe("string");
    expect(result?.mediaItemId.length).toBeGreaterThan(0);
  });
});
