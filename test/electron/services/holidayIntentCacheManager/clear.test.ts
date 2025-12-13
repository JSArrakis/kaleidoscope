import { jest } from "@jest/globals";
import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

// Mock the movieRepository since this test doesn't need real database data
jest.mock("../../../../src/electron/repositories/movieRepository", () => ({
  movieRepository: {
    getTotalMinutesByHolidayTag: jest.fn().mockReturnValue(300),
  },
}));

describe("clear", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should remove all cached holidays", () => {
    /**
     * GOAL: Verify clear() empties the entire cache
     * FACTORS:
     *   - Multiple holidays loaded in cache
     *   - Call clear
     * EXPECTED:
     *   - Cache size becomes 0
     *   - All entries removed
     */
    // Load several holidays
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(3);

    holidayIntentCacheManager.clear();

    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
  });

  it("should reset staleCount to 0", () => {
    /**
     * GOAL: Verify clear() also clears stale entries
     * FACTORS:
     *   - Load holidays
     *   - Invalidate some
     *   - Call clear
     * EXPECTED:
     *   - staleCount becomes 0
     *   - Cache completely empty
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    const statsBefore = holidayIntentCacheManager.getStats();
    expect(statsBefore.cacheSize).toBe(2);
    expect(statsBefore.staleCount).toBe(1);

    holidayIntentCacheManager.clear();

    const statsAfter = holidayIntentCacheManager.getStats();
    expect(statsAfter.cacheSize).toBe(0);
    expect(statsAfter.staleCount).toBe(0);
  });

  it("should allow fresh loading after clear", () => {
    /**
     * GOAL: Verify that after clear, holidays can be re-loaded fresh
     * FACTORS:
     *   - Load holiday
     *   - Modify tracking (selectedMinutesToday)
     *   - Clear cache
     *   - Load same holiday again
     * EXPECTED:
     *   - After clear+reload: selectedMinutesToday resets to 0
     *   - Fresh intent created
     */
    // Load and track
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      "2025-12-15"
    );
    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(100);

    // Clear
    holidayIntentCacheManager.clear();

    // Load again
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(0); // Fresh start
  });

  it("should work when cache is already empty", () => {
    /**
     * GOAL: Verify clear() on empty cache doesn't error
     * FACTORS:
     *   - Cache is empty (or cleared already)
     *   - Call clear again
     * EXPECTED:
     *   - No errors thrown
     *   - Cache remains empty
     */
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);

    expect(() => {
      holidayIntentCacheManager.clear();
    }).not.toThrow();

    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
  });

  it("should allow calling clear multiple times", () => {
    /**
     * GOAL: Verify multiple clears are safe
     * FACTORS:
     *   - Load holiday
     *   - Call clear multiple times
     * EXPECTED:
     *   - All calls succeed
     *   - Cache stays empty after first clear
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(1);

    holidayIntentCacheManager.clear();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);

    holidayIntentCacheManager.clear();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);

    holidayIntentCacheManager.clear();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
  });

  it("should truly reset cache, not just reset values", () => {
    /**
     * GOAL: Verify clear removes entries entirely, not just resets them
     * FACTORS:
     *   - Load multiple holidays
     *   - Clear
     *   - Load different set of holidays
     * EXPECTED:
     *   - Can load completely different holidays after clear
     *   - No leftover references
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");

    holidayIntentCacheManager.clear();

    // Load new holidays
    holidayIntentCacheManager.getIntent("holiday-easter");
    const stats = holidayIntentCacheManager.getStats();

    expect(stats.cacheSize).toBe(1); // Only easter
    // Can verify by accessing
    const easter = holidayIntentCacheManager.getIntent("holiday-easter");
    expect(easter.holidayTagId).toBe("holiday-easter");
  });

  it("should work in test cleanup/setup scenarios", () => {
    /**
     * GOAL: Verify clear is appropriate for test isolation
     * FACTORS:
     *   - Load and modify state
     *   - Clear for test isolation
     *   - Next test starts fresh
     * EXPECTED:
     *   - Each test can clear to start clean
     *   - No bleed-through between tests
     */
    // Simulate test 1
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      "2025-12-15"
    );

    let stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(1);

    // Simulate test cleanup
    holidayIntentCacheManager.clear();

    // Simulate test 2
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(0); // Fresh start

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-halloween",
      50,
      "2025-10-15"
    );

    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(1);
    const intent = holidayIntentCacheManager.getIntent("holiday-halloween");
    expect(intent.selectedMinutesToday).toBe(50);
  });

  it("should immediately reflect in getStats", () => {
    /**
     * GOAL: Verify stats are updated immediately after clear
     * FACTORS:
     *   - Load holidays
     *   - Clear
     *   - Immediately check stats
     * EXPECTED:
     *   - Stats show size 0 and staleCount 0 immediately
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    const statsBefore = holidayIntentCacheManager.getStats();
    expect(statsBefore.cacheSize).toBe(2);
    expect(statsBefore.staleCount).toBe(1);

    holidayIntentCacheManager.clear();

    // Check immediately - not async
    const statsAfter = holidayIntentCacheManager.getStats();
    expect(statsAfter.cacheSize).toBe(0);
    expect(statsAfter.staleCount).toBe(0);
  });
});
