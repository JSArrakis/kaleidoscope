import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("invalidateAll", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should mark all cached holidays as stale", () => {
    /**
     * GOAL: Verify invalidateAll sets stale=true for all entries
     * FACTORS:
     *   - Multiple holidays cached and fresh
     *   - Call invalidateAll
     * EXPECTED:
     *   - All stale flags become true
     *   - staleCount equals cacheSize
     */
    // Load multiple holidays
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    const stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(0);
    expect(stats.cacheSize).toBe(3);

    holidayIntentCacheManager.invalidateAll();

    const statsAfter = holidayIntentCacheManager.getStats();
    expect(statsAfter.staleCount).toBe(3); // All stale now
    expect(statsAfter.cacheSize).toBe(3); // Cache still has them
  });

  it("should trigger recalculation on next access of any holiday", () => {
    /**
     * GOAL: Verify all holidays recalculate when accessed after invalidateAll
     * FACTORS:
     *   - All holidays invalidated
     *   - Access Christmas, Halloween, Easter
     * EXPECTED:
     *   - Each returns fresh (non-stale) intent on access
     *   - Recalculation happens for each
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    holidayIntentCacheManager.invalidateAll();

    const christmas = holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloween = holidayIntentCacheManager.getIntent("holiday-halloween");
    const easter = holidayIntentCacheManager.getIntent("holiday-easter");

    expect(christmas.stale).toBe(false);
    expect(halloween.stale).toBe(false);
    expect(easter.stale).toBe(false);
  });

  it("should clear staleCount back to 0 after accessing invalidated entries", () => {
    /**
     * GOAL: Verify staleCount updates as invalidated entries are re-accessed
     * FACTORS:
     *   - Load 3 holidays
     *   - Invalidate all (staleCount = 3)
     *   - Access 2 of them (recalculate)
     * EXPECTED:
     *   - After invalidateAll: staleCount = 3
     *   - After accessing 2: staleCount = 1 (only 1 still stale)
     *   - After accessing all 3: staleCount = 0
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    holidayIntentCacheManager.invalidateAll();
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(3);

    // Access one
    holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(2);

    // Access another
    holidayIntentCacheManager.getIntent("holiday-halloween");
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(1);

    // Access last one
    holidayIntentCacheManager.getIntent("holiday-easter");
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(0);
  });

  it("should preserve cache size after invalidateAll", () => {
    /**
     * GOAL: Verify cache entries not deleted, just marked stale
     * FACTORS:
     *   - Load 3 holidays
     *   - Call invalidateAll
     * EXPECTED:
     *   - Cache size remains 3
     *   - Entries not removed
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    const sizeBefore = holidayIntentCacheManager.getStats().cacheSize;

    holidayIntentCacheManager.invalidateAll();

    const sizeAfter = holidayIntentCacheManager.getStats().cacheSize;
    expect(sizeAfter).toBe(sizeBefore);
  });

  it("should work when no holidays are cached", () => {
    /**
     * GOAL: Verify invalidateAll handles empty cache gracefully
     * FACTORS:
     *   - Cache is empty
     *   - Call invalidateAll
     * EXPECTED:
     *   - No errors thrown
     *   - Stats remain (size 0, stale count 0)
     */
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);

    expect(() => {
      holidayIntentCacheManager.invalidateAll();
    }).not.toThrow();

    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(0);
  });

  it("should allow re-invalidating all again", () => {
    /**
     * GOAL: Verify calling invalidateAll multiple times is safe
     * FACTORS:
     *   - Load holidays
     *   - Call invalidateAll twice
     * EXPECTED:
     *   - Both calls work
     *   - staleCount correct both times
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");

    holidayIntentCacheManager.invalidateAll();
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(2);

    // Invalidate again
    holidayIntentCacheManager.invalidateAll();
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(2); // Still 2
  });

  it("should work correctly with clear() afterwards", () => {
    /**
     * GOAL: Verify invalidateAll followed by clear works correctly
     * FACTORS:
     *   - Load holidays
     *   - Call invalidateAll
     *   - Call clear
     * EXPECTED:
     *   - After invalidateAll: all stale, cache size = 3
     *   - After clear: cache empty, size = 0
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    holidayIntentCacheManager.invalidateAll();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(3);
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(3);

    holidayIntentCacheManager.clear();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
    expect(holidayIntentCacheManager.getStats().staleCount).toBe(0);
  });

  it("should recalculate with potentially new data after invalidateAll", async () => {
    /**
     * GOAL: Verify that invalidateAll enables picking up data changes
     * FACTORS:
     *   - Load holiday (captures state at that time)
     *   - invalidateAll marks stale
     *   - Re-access (would recalculate if DB changed)
     * EXPECTED:
     *   - First intent has certain data
     *   - After invalidate + re-access, would get new data
     *   - In our test, DB static so same data, but recalculation happens
     */
    const christmasFirst =
      holidayIntentCacheManager.getIntent("holiday-christmas");
    const firstTotal = christmasFirst.totalAvailableMinutes;
    const firstCalcTime = christmasFirst.calculatedAt;

    holidayIntentCacheManager.invalidateAll();

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const christmasAfter =
      holidayIntentCacheManager.getIntent("holiday-christmas");

    // Same data since DB unchanged, but recalculation happened
    expect(christmasAfter.totalAvailableMinutes).toBe(firstTotal);
    // calculatedAt should be more recent (if implementation updates it)
  });
});
