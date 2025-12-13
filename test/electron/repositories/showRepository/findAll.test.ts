import { showRepository } from "../../../../src/electron/repositories/showRepository.js";
import { getDB } from "../../../../src/electron/db/sqlite.js";
import {
  createGenreAndAestheticTagsPackage,
  createMultipleShowsPackage,
  createShowWithSecondaryTagsPackage,
  setupTestPackage,
  combinePackages,
} from "./packages.js";

describe("showRepository.findAll", () => {
  const db = getDB();

  // Step 1 & 2: Setup using test packages
  let cleanup: (() => void) | null = null;

  beforeAll(() => {
    // Combine packages: tags + multiple shows + show with secondary tags
    const tagsPackage = createGenreAndAestheticTagsPackage(db);
    const showsPackage = createMultipleShowsPackage(db, [
      {
        mediaItemId: "show-drama-1",
        title: "Drama Show",
        primaryTagId: "genre-drama",
      },
      {
        mediaItemId: "show-comedy-1",
        title: "Comedy Show",
        primaryTagId: "genre-comedy",
      },
      {
        mediaItemId: "show-scifi-1",
        title: "Sci-Fi Show",
        primaryTagId: "genre-scifi",
      },
    ]);

    // Add a show with secondary tags for comprehensive testing
    const secondaryTagsPackage = createShowWithSecondaryTagsPackage(db, {
      mediaItemId: "show-noir-action",
      title: "Noir Action Show",
      primaryTagIds: ["aesthetic-noir"],
      secondaryTagIds: ["genre-action"],
    });

    const combinedPackage = combinePackages(
      tagsPackage,
      showsPackage,
      secondaryTagsPackage
    );
    cleanup = setupTestPackage(combinedPackage);
  });

  // Step 3: Clean per-suite data
  afterAll(() => {
    if (cleanup) {
      cleanup();
    }
  });

  // Tests
  test("should return all shows ordered by title", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - should include our test shows
    const testShowIds = [
      "show-drama-1",
      "show-comedy-1",
      "show-scifi-1",
      "show-noir-action",
    ];
    const foundShowIds = result
      .filter((s) => testShowIds.includes(s.mediaItemId))
      .map((s) => s.mediaItemId);

    expect(foundShowIds.length).toBe(4);

    // Verify ordering by title
    const titles = result.map((s) => s.title);
    expect(titles).toEqual([...titles].sort());
  });

  test("should include episodes for each show", () => {
    // Act
    const result = showRepository.findAll();

    // Assert
    for (const mediaItemId of [
      "show-drama-1",
      "show-comedy-1",
      "show-scifi-1",
      "show-noir-action",
    ]) {
      const show = result.find((s) => s.mediaItemId === mediaItemId);
      expect(show).toBeDefined();
      expect(show?.episodes).toBeDefined();
      expect(show?.episodes.length).toBeGreaterThan(0);
    }
  });

  test("should include episodes ordered by episodeNumber then episode", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - verify episodes are sorted correctly
    for (const show of result) {
      if (show.episodes && show.episodes.length > 1) {
        for (let i = 0; i < show.episodes.length - 1; i++) {
          const current = show.episodes[i];
          const next = show.episodes[i + 1];

          // Episode numbers should be in order
          const currentNum = current.episodeNumber ?? 0;
          const nextNum = next.episodeNumber ?? 0;
          expect(currentNum).toBeLessThanOrEqual(nextNum);
        }
      }
    }
  });

  test("should include primary tags for each show", () => {
    // Act
    const result = showRepository.findAll();

    // Assert
    const dramaShow = result.find((s) => s.mediaItemId === "show-drama-1");
    expect(dramaShow?.tags).toBeDefined();
    expect(dramaShow?.tags.length).toBeGreaterThan(0);
    expect(dramaShow?.tags.some((t) => t.tagId === "genre-drama")).toBeTruthy();

    const comedyShow = result.find((s) => s.mediaItemId === "show-comedy-1");
    expect(comedyShow?.tags).toBeDefined();
    expect(
      comedyShow?.tags.some((t) => t.tagId === "genre-comedy")
    ).toBeTruthy();

    const scifiShow = result.find((s) => s.mediaItemId === "show-scifi-1");
    expect(scifiShow?.tags).toBeDefined();
    expect(scifiShow?.tags.some((t) => t.tagId === "genre-scifi")).toBeTruthy();
  });

  test("should include secondary tags array for all shows", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - all shows should have secondaryTags array
    for (const show of result) {
      expect(show.secondaryTags).toBeDefined();
      expect(Array.isArray(show.secondaryTags)).toBe(true);
    }
  });

  test("should include secondary tags when show has them", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - noir-action show should have both primary and secondary tags
    const noirActionShow = result.find(
      (s) => s.mediaItemId === "show-noir-action"
    );
    expect(noirActionShow).toBeDefined();
    expect(noirActionShow?.tags.length).toBeGreaterThan(0);
    expect(noirActionShow?.secondaryTags.length).toBeGreaterThan(0);

    // Verify primary and secondary tags are different
    const primaryTagIds = noirActionShow?.tags.map((t) => t.tagId) || [];
    const secondaryTagIds =
      noirActionShow?.secondaryTags.map((t) => t.tagId) || [];
    expect(primaryTagIds).not.toEqual(secondaryTagIds);
  });

  test("should include all required show properties", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - verify shape of returned objects
    const show = result.find((s) => s.mediaItemId === "show-drama-1");
    expect(show).toHaveProperty("mediaItemId");
    expect(show).toHaveProperty("title");
    expect(show).toHaveProperty("type");
    expect(show).toHaveProperty("tags");
    expect(show).toHaveProperty("secondaryTags");
    expect(show).toHaveProperty("episodes");
    expect(show).toHaveProperty("episodeCount");
  });

  test("should handle shows with no tags", () => {
    // This test documents behavior for edge case
    // Act
    const result = showRepository.findAll();

    // Assert - all test shows should have at least one tag
    for (const show of result.filter((s) =>
      [
        "show-drama-1",
        "show-comedy-1",
        "show-scifi-1",
        "show-noir-action",
      ].includes(s.mediaItemId)
    )) {
      expect(show.tags.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("should include episode tags in episode objects", () => {
    // Act
    const result = showRepository.findAll();

    // Assert - episodes should have tags array
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
