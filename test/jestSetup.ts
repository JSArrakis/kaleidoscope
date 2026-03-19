import { jest } from "@jest/globals";
import path from "path";
import fs from "fs";

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

// Populate TagType globally
if (typeof (globalThis as any).TagType === "undefined") {
  (globalThis as any).TagType = {
    Aesthetic: "Aesthetic",
    Era: "Era",
    Genre: "Genre",
    Specialty: "Specialty",
    Holiday: "Holiday",
    AgeGroup: "AgeGroup",
    MusicalGenre: "MusicalGenre",
  };
}

const TEST_DB_PATH = path.join(process.cwd(), "temp-test.db");

// Helper function to safely delete file with retry logic for Windows file locks
function safeDeleteFile(filePath: string, maxRetries: number = 3): boolean {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return true; // File doesn't exist, consider it successful
    } catch (error: any) {
      // EBUSY means the file is locked, which is expected during Jest parallel test execution
      // Only log and retry, don't treat as error
      if (error.code === "EBUSY" && attempt < maxRetries - 1) {
        // Exponential backoff: 50ms, 100ms, 200ms
        const delayMs = 50 * Math.pow(2, attempt);
        const startTime = Date.now();
        while (Date.now() - startTime < delayMs) {
          // Busy wait
        }
        continue;
      }
      // Non-EBUSY errors or final retry - log as warning not error
      if (error.code !== "EBUSY") {
        console.warn(
          `[Jest Setup] Warning: Could not delete ${filePath}: ${error.message}`,
        );
      }
      return false;
    }
  }
  return false;
}

// Clean up any existing test database before starting tests
// This runs for each test file, but EBUSY errors are expected and handled gracefully
const filesToClean = [
  TEST_DB_PATH,
  `${TEST_DB_PATH}-shm`,
  `${TEST_DB_PATH}-wal`,
];
for (const filePath of filesToClean) {
  safeDeleteFile(filePath);
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
  console.log("[Jest Setup] Test database created at:", TEST_DB_PATH);

  // Populate with test data
  populateTestData(globalThis.testDb);
  console.log("[Jest Setup] Test data populated");

  // Inject into sqliteService
  sqliteService.setDatabase(globalThis.testDb);
  console.log("[Jest Setup] Test database injected into sqliteService");

  globalThis.testDatabaseInitialized = true;

  // Clean up temp database after all tests complete
  afterAll(() => {
    console.log("[Jest Setup] Closing test database...");
    globalThis.testDb?.close();

    // Small delay to ensure the file handle is fully released (especially on Windows)
    const delayMs = 150;
    const startTime = Date.now();
    while (Date.now() - startTime < delayMs) {
      // Busy wait for file handle to be released
    }

    // Delete temp database file and related WAL files
    const filesToDelete = [
      TEST_DB_PATH,
      `${TEST_DB_PATH}-shm`,
      `${TEST_DB_PATH}-wal`,
    ];

    for (const filePath of filesToDelete) {
      safeDeleteFile(filePath);
    }
  });
}
