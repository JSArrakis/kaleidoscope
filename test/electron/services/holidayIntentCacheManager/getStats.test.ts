import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("getStats", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should return object with cacheSize and staleCount properties", () => {
    /**
     * GOAL: Verify getStats returns correct structure
     * FACTORS:
     *   - Call getStats
     * EXPECTED:
     *   - Returns object with properties: cacheSize, staleCount
     *   - Both are numbers
     *   - Both are >= 0
     */
    const stats = holidayIntentCacheManager.getStats();

    expect(stats).toHaveProperty("cacheSize");
    expect(stats).toHaveProperty("staleCount");
    expect(typeof stats.cacheSize).toBe("number");
    expect(typeof stats.staleCount).toBe("number");
    expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    expect(stats.staleCount).toBeGreaterThanOrEqual(0);
  });

  it("should return cacheSize of 0 for empty cache", () => {
    /**
     * GOAL: Verify cacheSize is 0 when nothing cached
     * FACTORS:
     *   - Empty cache (after clear or initial state)
     * EXPECTED:
     *   - cacheSize = 0
     *   - staleCount = 0
     */
    const stats = holidayIntentCacheManager.getStats();

    expect(stats.cacheSize).toBe(0);
    expect(stats.staleCount).toBe(0);
  });

  it("should return correct cacheSize when holidays are loaded", () => {
    /**
     * GOAL: Verify cacheSize matches number of unique cached holidays
     * FACTORS:
     *   - Load 1 holiday
     *   - Load 2 more holidays
     *   - Load same holiday again (should not increase size)
     * EXPECTED:
     *   - After 1st: cacheSize = 1
     *   - After 2 more: cacheSize = 3
     *   - After duplicate: cacheSize = 3 (unchanged)
     */
    let stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(0);

    holidayIntentCacheManager.getIntent("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(1);

    holidayIntentCacheManager.getIntent("holiday-halloween");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(2);

    holidayIntentCacheManager.getIntent("holiday-easter");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(3);

    // Load christmas again (already cached)
    holidayIntentCacheManager.getIntent("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(3); // Still 3
  });

  it("should return staleCount of 0 when no invalidations", () => {
    /**
     * GOAL: Verify staleCount is 0 for fresh intent
     * FACTORS:
     *   - Load multiple holidays without invalidating
     * EXPECTED:
     *   - staleCount = 0
     *   - All loaded intents are fresh
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    const stats = holidayIntentCacheManager.getStats();

    expect(stats.staleCount).toBe(0);
    expect(stats.cacheSize).toBe(3);
  });

  it("should return correct staleCount when invalidating single holiday", () => {
    /**
     * GOAL: Verify staleCount increments with invalidations
     * FACTORS:
     *   - Load 3 holidays
     *   - Invalidate 1 (staleCount should be 1)
     *   - Invalidate another (staleCount should be 2)
     * EXPECTED:
     *   - After 1 invalidate: staleCount = 1
     *   - After 2 invalidates: staleCount = 2
     *   - cacheSize unchanged
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    let stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(3);
    expect(stats.staleCount).toBe(0);

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(1);
    expect(stats.cacheSize).toBe(3);

    holidayIntentCacheManager.invalidateHoliday("holiday-halloween");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(2);
    expect(stats.cacheSize).toBe(3);
  });

  it("should return cacheSize equal to staleCount when all invalidated", () => {
    /**
     * GOAL: Verify that invalidateAll makes staleCount = cacheSize
     * FACTORS:
     *   - Load N holidays
     *   - Call invalidateAll
     * EXPECTED:
     *   - staleCount = cacheSize
     *   - Both equal N
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    let stats = holidayIntentCacheManager.getStats();
    const cacheSize = stats.cacheSize;

    holidayIntentCacheManager.invalidateAll();

    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(cacheSize);
    expect(stats.cacheSize).toBe(cacheSize);
  });

  it("should return decreasing staleCount as stale entries are recalculated", () => {
    /**
     * GOAL: Verify staleCount decreases as invalidated entries are re-accessed
     * FACTORS:
     *   - Load 3 holidays
     *   - Invalidate all (staleCount = 3)
     *   - Access them one by one
     * EXPECTED:
     *   - After access 1: staleCount = 2
     *   - After access 2: staleCount = 1
     *   - After access 3: staleCount = 0
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    holidayIntentCacheManager.invalidateAll();
    let stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(3);

    // Access one
    holidayIntentCacheManager.getIntent("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(2);

    // Access another
    holidayIntentCacheManager.getIntent("holiday-halloween");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(1);

    // Access last
    holidayIntentCacheManager.getIntent("holiday-easter");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(0);
  });

  it("should return 0 after clear", () => {
    /**
     * GOAL: Verify stats reset to 0,0 after clear
     * FACTORS:
     *   - Load and invalidate some holidays
     *   - Call clear
     * EXPECTED:
     *   - cacheSize = 0
     *   - staleCount = 0
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    let stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBeGreaterThan(0);
    expect(stats.staleCount).toBeGreaterThan(0);

    holidayIntentCacheManager.clear();

    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(0);
    expect(stats.staleCount).toBe(0);
  });

  it("should return accurate stats in mixed scenario", () => {
    /**
     * GOAL: Verify stats are accurate in complex usage pattern
     * FACTORS:
     *   - Load some holidays
     *   - Invalidate some
     *   - Re-access some
     *   - Add more holidays
     * EXPECTED:
     *   - Stats accurately reflect current state at each step
     */
    // Load 2
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");

    let stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(2);
    expect(stats.staleCount).toBe(0);

    // Invalidate 1
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(2);
    expect(stats.staleCount).toBe(1);

    // Re-access invalidated one
    holidayIntentCacheManager.getIntent("holiday-christmas");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(2);
    expect(stats.staleCount).toBe(0);

    // Add more
    holidayIntentCacheManager.getIntent("holiday-easter");
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(3);
    expect(stats.staleCount).toBe(0);

    // Invalidate all
    holidayIntentCacheManager.invalidateAll();
    stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(3);
    expect(stats.staleCount).toBe(3);
  });

  it("should not include duplicates in cacheSize", () => {
    /**
     * GOAL: Verify cacheSize counts unique entries only
     * FACTORS:
     *   - Access same holiday multiple times
     * EXPECTED:
     *   - cacheSize = 1 (not 3 despite 3 accesses)
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-christmas");

    const stats = holidayIntentCacheManager.getStats();
    expect(stats.cacheSize).toBe(1);
  });

  it("should be callable without errors", () => {
    /**
     * GOAL: Verify getStats is robust and doesn't throw
     * FACTORS:
     *   - Call getStats multiple times
     *   - In various cache states
     * EXPECTED:
     *   - Never throws
     *   - Always returns valid stats object
     */
    expect(() => {
      holidayIntentCacheManager.getStats();
    }).not.toThrow();

    holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(() => {
      holidayIntentCacheManager.getStats();
    }).not.toThrow();

    holidayIntentCacheManager.invalidateAll();
    expect(() => {
      holidayIntentCacheManager.getStats();
    }).not.toThrow();

    holidayIntentCacheManager.clear();
    expect(() => {
      holidayIntentCacheManager.getStats();
    }).not.toThrow();
  });
});
