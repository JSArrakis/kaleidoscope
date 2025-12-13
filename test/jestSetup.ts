import { jest } from "@jest/globals";

// Mock electron FIRST thing, before any other imports
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn((type) => process.cwd()),
  },
}));

// Make types and enums globally available for tests
declare global {
  var testDatabaseInitialized: boolean;
  var testDb: any;
  enum MediaType {
    Show = "Show",
    Episode = "Episode",
    Movie = "Movie",
    Short = "Short",
    Music = "Music",
    Commercial = "Commercial",
    Promo = "Promo",
    Bumper = "Bumper",
  }
}

// Populate MediaType globally
if (typeof (globalThis as any).MediaType === "undefined") {
  (globalThis as any).MediaType = {
    Show: "Show",
    Episode: "Episode",
    Movie: "Movie",
    Short: "Short",
    Music: "Music",
    Commercial: "Commercial",
    Promo: "Promo",
    Bumper: "Bumper",
  };
}

// Only initialize the test database ONCE per Jest session
if (!globalThis.testDatabaseInitialized) {
  console.log("[Jest Setup] Initializing test database...");

  const {
    setupTestDatabase,
    populateTestData,
  } = require("./testDatabaseSetup");
  const { sqliteService } = require("../src/electron/db/sqlite");

  // Create test database
  globalThis.testDb = setupTestDatabase();
  console.log(
    "[Jest Setup] Test database created at:",
    process.cwd() + "/temp-test.db"
  );

  // Populate with test data
  populateTestData(globalThis.testDb);
  console.log("[Jest Setup] Test data populated");

  // Inject into sqliteService
  sqliteService.setDatabase(globalThis.testDb);
  console.log("[Jest Setup] Test database injected into sqliteService");

  globalThis.testDatabaseInitialized = true;
}

// Each test suite can clear the cache before/after tests as needed
// No cleanup here - let Jest handle the process termination
