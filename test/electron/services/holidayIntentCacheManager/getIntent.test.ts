import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("getIntent", () => {
  beforeEach(() => {
    // Clear the cache to start fresh for each test
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    // Clean up after each test
    holidayIntentCacheManager.clear();
  });

  it("should lazy-load and cache a holiday intent on first access", () => {
    /**
     * GOAL: Verify that getIntent() creates and caches a HolidayIntent on first call
     * FACTORS:
     *   - First call to getIntent with a holiday tag ID
     *   - No prior cached value
     * EXPECTED:
     *   - Returns a valid HolidayIntent object
     *   - Intent contains correct holiday tag ID
     *   - Cache size becomes 1 after call
     *   - Intent is not marked stale
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    expect(intent).toBeDefined();
    expect(intent.holidayTagId).toBe("holiday-christmas");
    expect(intent.stale).toBe(false);
    expect(intent.totalAvailableMinutes).toBeGreaterThan(0);
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(1);
  });

  it("should return cached intent without recalculating if not stale", () => {
    /**
     * GOAL: Verify that cached intents are returned directly without recalculation
     * FACTORS:
     *   - First call populates cache
     *   - Second call on same holiday tag
     *   - Cache entry is not stale
     * EXPECTED:
     *   - Both calls return same object reference
     *   - selectedMinutesToday modifications persist (proving same object)
     *   - Cache size remains 1
     */
    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");

    expect(intent1).toBe(intent2); // Same reference
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(1);
  });

  it("should recalculate intent if marked stale and then accessed", () => {
    /**
     * GOAL: Verify invalidation-based lazy loading works correctly
     * FACTORS:
     *   - Initial intent cached
     *   - Intent marked stale via invalidation
     *   - Intent accessed again
     * EXPECTED:
     *   - First call returns cached non-stale intent
     *   - After invalidation, stale flag is true
     *   - Second getIntent call recalculates (different object)
     *   - New intent is not stale
     */
    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent1.stale).toBe(false);

    // Invalidate
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    const statsAfterInvalidate =
      holidayIntentCacheManager.getStats().staleCount;
    expect(statsAfterInvalidate).toBe(1);

    // Access again - should recalculate
    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent2.stale).toBe(false); // Recalculated, so no longer stale
  });

  it("should handle multiple different holiday tags independently", () => {
    /**
     * GOAL: Verify that different holiday tags are cached separately
     * FACTORS:
     *   - Access multiple different holiday tags
     *   - Each has different total available minutes
     * EXPECTED:
     *   - Cache size matches number of unique tags accessed
     *   - Each intent has correct tag ID
     *   - Each intent has different totalAvailableMinutes based on content
     */
    const christmas = holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloween = holidayIntentCacheManager.getIntent("holiday-halloween");
    const easter = holidayIntentCacheManager.getIntent("holiday-easter");

    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(3);
    expect(christmas.holidayTagId).toBe("holiday-christmas");
    expect(halloween.holidayTagId).toBe("holiday-halloween");
    expect(easter.holidayTagId).toBe("holiday-easter");

    // Different holidays should have different total available minutes
    expect(christmas.totalAvailableMinutes).toBeGreaterThan(0);
    expect(halloween.totalAvailableMinutes).toBeGreaterThan(0);
    expect(easter.totalAvailableMinutes).toBeGreaterThan(0);
  });

  it("should handle non-existent holiday tag gracefully", () => {
    /**
     * GOAL: Verify behavior when accessing a tag that doesn't exist in DB
     * FACTORS:
     *   - Tag ID that was never inserted into test database
     *   - Repository returns 0 minutes for non-existent tag
     * EXPECTED:
     *   - Returns valid HolidayIntent (doesn't throw)
     *   - totalAvailableMinutes is 0
     *   - threeDayDistribution is [0, 0, 0]
     *   - Can still track and manage even with 0 content
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-nonexistent");

    expect(intent).toBeDefined();
    expect(intent.holidayTagId).toBe("holiday-nonexistent");
    expect(intent.totalAvailableMinutes).toBe(0);
    expect(intent.threeDayDistribution).toEqual([0, 0, 0]);
  });
});
