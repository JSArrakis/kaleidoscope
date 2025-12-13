import Database from "better-sqlite3";
import {
  setupTestDatabase,
  populateTestData,
} from "../../../testDatabaseSetup";
import { showRepository } from "../../../../src/electron/repositories/showRepository";

describe("showRepository.findByTag", () => {
  let db: Database.Database;

  beforeAll(() => {
    db = setupTestDatabase();
    populateTestData(db);
  });

  beforeEach(() => {
    // Clear test data before each test
    db.prepare("DELETE FROM show_tags WHERE 1=1").run();
    db.prepare("DELETE FROM episode_tags WHERE 1=1").run();
    db.prepare("DELETE FROM episodes WHERE 1=1").run();
    db.prepare("DELETE FROM shows WHERE 1=1").run();
  });

  describe("positive confirmations", () => {
    it("should find shows with a specific tag", () => {
      // Use existing "Christmas" holiday tag from test data
      const tagId = "holiday-christmas";

      // Insert test show
      const showResult = db
        .prepare(
          "INSERT INTO shows (title, mediaItemId, episodeCount) VALUES (?, ?, ?)"
        )
        .run("Test Show", "show-test-1", 2);

      const showId = showResult.lastInsertRowid;

      // Insert episodes for the show
      db.prepare(
        "INSERT INTO episodes (showId, season, episode, episodeNumber, title, mediaItemId, duration) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(showId, 1, 1, 1, "Episode 1", "ep-test-1", 45 * 60);

      db.prepare(
        "INSERT INTO episodes (showId, season, episode, episodeNumber, title, mediaItemId, duration) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(showId, 1, 2, 2, "Episode 2", "ep-test-2", 45 * 60);

      // Associate tag with show via show_tags
      db.prepare(
        "INSERT INTO show_tags (mediaItemId, tagId) VALUES (?, ?)"
      ).run("show-test-1", tagId);

      // Call repository method
      const result = showRepository.findByTag(tagId);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe("Test Show");
    });

    it("should return empty array when tag has no associated shows", () => {
      // Use an existing tag that has no shows associated with it
      const tagId = "holiday-easter"; // Easter has no shows in test data

      // Call repository method with tag that has no shows
      const result = showRepository.findByTag(tagId);

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });
});
