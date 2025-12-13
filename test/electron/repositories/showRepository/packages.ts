import Database from "better-sqlite3";

/**
 * Test data packages for showRepository tests
 * Packages are reusable, composable test data setups
 * Each package handles creation AND cleanup of related test data
 */

export interface TestPackage {
  /**
   * Set up test data for this package
   */
  setup: () => void;

  /**
   * Clean up test data for this package
   */
  cleanup: () => void;
}

/**
 * Package: Basic test tags (drama, comedy, noir, scifi, action, fantasy, mystery, retro)
 * Reusable across all showRepository test suites
 */
export function createGenreAndAestheticTagsPackage(
  db: Database.Database
): TestPackage {
  const tagIds = [
    { id: "genre-drama", name: "Drama", type: "genre" },
    { id: "genre-comedy", name: "Comedy", type: "genre" },
    { id: "genre-scifi", name: "Sci-Fi", type: "genre" },
    { id: "genre-action", name: "Action", type: "genre" },
    { id: "genre-fantasy", name: "Fantasy", type: "genre" },
    { id: "genre-mystery", name: "Mystery", type: "genre" },
    { id: "aesthetic-noir", name: "Noir", type: "aesthetic" },
    { id: "aesthetic-retro", name: "Retro", type: "aesthetic" },
  ];

  return {
    setup: () => {
      for (const tag of tagIds) {
        db.prepare(
          "INSERT OR IGNORE INTO tags (tagId, name, type) VALUES (?, ?, ?)"
        ).run(tag.id, tag.name, tag.type);
      }
    },
    cleanup: () => {
      // Keep tags - they're referenced by schema and reusable
      // Don't delete tags here as they may be used by other test data
    },
  };
}

/**
 * Package: Single show with one episode and tags
 * Creates show with primary tag and secondary tags from episode tags
 * @param db Database instance
 * @param config Configuration for the show (mediaItemId, title, primaryTagId)
 */
export function createShowWithEpisodePackage(
  db: Database.Database,
  config: {
    mediaItemId: string;
    title: string;
    primaryTagId: string;
    episodeCount?: number;
  }
): TestPackage {
  const { mediaItemId, title, primaryTagId, episodeCount = 1 } = config;

  let showId: number;

  return {
    setup: () => {
      // Create show
      const showResult = db
        .prepare(
          `INSERT INTO shows (title, mediaItemId, episodeCount) 
         VALUES (?, ?, ?)`
        )
        .run(title, mediaItemId, episodeCount);

      showId = showResult.lastInsertRowid as number;

      // Add primary tag
      db.prepare(
        `INSERT INTO show_tags (mediaItemId, tagId, tagType) VALUES (?, ?, ?)`
      ).run(mediaItemId, primaryTagId, "genre");

      // Create episodes
      for (let i = 1; i <= episodeCount; i++) {
        const episodeResult = db
          .prepare(
            `INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, duration, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            showId,
            "1",
            String(i),
            i,
            `/test/${mediaItemId}/ep${i}`,
            `Episode ${i}`,
            `${mediaItemId}-ep-${i}`,
            1800,
            7 // MediaType.Episode
          );

        // Add episode tag matching primary
        db.prepare(
          "INSERT INTO episode_tags (mediaItemId, tagId) VALUES (?, ?)"
        ).run(`${mediaItemId}-ep-${i}`, primaryTagId);
      }
    },
    cleanup: () => {
      // CASCADE delete will handle episodes and their tags
      db.prepare("DELETE FROM shows WHERE mediaItemId = ?").run(mediaItemId);
    },
  };
}

/**
 * Package: Show with mixed primary and secondary tags
 * Creates show where episodes have tags not in primary show tags
 * This tests the secondary tags derivation functionality
 * @param db Database instance
 * @param config Configuration for show and tags
 */
export function createShowWithSecondaryTagsPackage(
  db: Database.Database,
  config: {
    mediaItemId: string;
    title: string;
    primaryTagIds: string[];
    secondaryTagIds: string[]; // Tags that will be on episodes but not primary
  }
): TestPackage {
  let showId: number;

  return {
    setup: () => {
      // Create show
      const showResult = db
        .prepare(
          `INSERT INTO shows (title, mediaItemId, episodeCount) 
         VALUES (?, ?, ?)`
        )
        .run(config.title, config.mediaItemId, 1);

      showId = showResult.lastInsertRowid as number;

      // Add primary tags
      for (const primaryTagId of config.primaryTagIds) {
        db.prepare(
          `INSERT INTO show_tags (mediaItemId, tagId, tagType) VALUES (?, ?, ?)`
        ).run(config.mediaItemId, primaryTagId, "genre");
      }

      // Create episode
      const episodeResult = db
        .prepare(
          `INSERT INTO episodes (showId, season, episode, episodeNumber, path, title, mediaItemId, duration, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          showId,
          "1",
          "1",
          1,
          `/test/${config.mediaItemId}/ep1`,
          "Episode 1",
          `${config.mediaItemId}-ep-1`,
          1800,
          7
        );

      // Add primary tags to episode
      for (const primaryTagId of config.primaryTagIds) {
        db.prepare(
          "INSERT INTO episode_tags (mediaItemId, tagId) VALUES (?, ?)"
        ).run(`${config.mediaItemId}-ep-1`, primaryTagId);
      }

      // Add secondary tags to episode (not in primary)
      for (const secondaryTagId of config.secondaryTagIds) {
        db.prepare(
          "INSERT INTO episode_tags (mediaItemId, tagId) VALUES (?, ?)"
        ).run(`${config.mediaItemId}-ep-1`, secondaryTagId);
      }

      // Compute and insert secondary tags
      const primaryTagSet = new Set(config.primaryTagIds);
      const allEpisodeTagsStmt = db.prepare(
        `SELECT DISTINCT tagId FROM episode_tags 
         WHERE mediaItemId IN (SELECT mediaItemId FROM episodes WHERE showId = ?)`
      );
      const episodeTagIds = allEpisodeTagsStmt
        .all(showId)
        .map((r: any) => r.tagId);

      const computedSecondaryTagIds = episodeTagIds.filter(
        (tagId: string) => !primaryTagSet.has(tagId)
      );

      for (const tagId of computedSecondaryTagIds) {
        db.prepare(
          "INSERT INTO show_secondary_tags (mediaItemId, tagId) VALUES (?, ?)"
        ).run(config.mediaItemId, tagId);
      }
    },
    cleanup: () => {
      db.prepare("DELETE FROM shows WHERE mediaItemId = ?").run(
        config.mediaItemId
      );
    },
  };
}

/**
 * Package: Multiple shows with different tags
 * Useful for testing filtering/selection across multiple shows
 * @param db Database instance
 * @param showConfigs Array of show configurations
 */
export function createMultipleShowsPackage(
  db: Database.Database,
  showConfigs: Array<{
    mediaItemId: string;
    title: string;
    primaryTagId: string;
  }>
): TestPackage {
  const packages = showConfigs.map((config) =>
    createShowWithEpisodePackage(db, config)
  );

  return {
    setup: () => {
      for (const pkg of packages) {
        pkg.setup();
      }
    },
    cleanup: () => {
      for (const pkg of packages) {
        pkg.cleanup();
      }
    },
  };
}

/**
 * Utility: Run a test package setup and register its cleanup
 * Call this in beforeAll, and the returned cleanup function in afterAll
 * @param pkg Package to set up
 * @returns Cleanup function
 */
export function setupTestPackage(pkg: TestPackage): () => void {
  pkg.setup();
  return () => pkg.cleanup();
}

/**
 * Utility: Combine multiple packages into one
 * Useful for complex test suites that need multiple data packages
 * @param packages Array of packages to combine
 * @returns Combined package
 */
export function combinePackages(...packages: TestPackage[]): TestPackage {
  return {
    setup: () => {
      for (const pkg of packages) {
        pkg.setup();
      }
    },
    cleanup: () => {
      // Cleanup in reverse order (LIFO - last in, first out)
      for (let i = packages.length - 1; i >= 0; i--) {
        packages[i].cleanup();
      }
    },
  };
}
