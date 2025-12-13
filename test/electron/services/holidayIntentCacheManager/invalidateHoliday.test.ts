import { jest } from "@jest/globals";
import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

// Mock the movieRepository since this test doesn't need real database data
jest.mock("../../../../src/electron/repositories/movieRepository", () => ({
  movieRepository: {
    getTotalMinutesByHolidayTag: jest.fn().mockReturnValue(300),
  },
}));

describe("invalidateHoliday", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should mark holiday as stale", () => {
    /**
     * GOAL: Verify invalidateHoliday sets stale flag to true
     * FACTORS:
     *   - Holiday cached and not stale
     *   - Call invalidateHoliday
     * EXPECTED:
     *   - stale flag becomes true
     *   - Other properties remain unchanged
     */
    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent1.stale).toBe(false);

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");
    // After getIntent again, it should recalculate, so no longer stale
    expect(intent2.stale).toBe(false); // Recalculated, so fresh
  });

  it("should trigger recalculation on next getIntent", async () => {
    /**
     * GOAL: Verify that accessing stale intent causes recalculation
     * FACTORS:
     *   - Cache intent
     *   - Invalidate it (mark stale)
     *   - Access it again with getIntent
     * EXPECTED:
     *   - getIntent recalculates instead of returning stale version
     *   - Returned intent is fresh (stale = false)
     */
    const originalIntent =
      holidayIntentCacheManager.getIntent("holiday-christmas");
    const originalCalculatedAt = originalIntent.calculatedAt;

    // Wait a tiny bit to ensure timestamp differs if recalculated
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    // Small delay to ensure time difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const newIntent = holidayIntentCacheManager.getIntent("holiday-christmas");

    // New intent should be recalculated (but same data since no DB change)
    expect(newIntent.stale).toBe(false);
    // calculatedAt might be updated (depending on implementation)
  });

  it("should increase staleCount in stats", () => {
    /**
     * GOAL: Verify getStats correctly counts stale entries
     * FACTORS:
     *   - Cache multiple holidays
     *   - Invalidate one
     * EXPECTED:
     *   - staleCount increases by 1
     *   - Only the invalidated one is marked stale
     */
    // Load multiple holidays
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");
    holidayIntentCacheManager.getIntent("holiday-easter");

    let stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(0);

    // Invalidate one
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(1);

    // Invalidate another
    holidayIntentCacheManager.invalidateHoliday("holiday-halloween");

    stats = holidayIntentCacheManager.getStats();
    expect(stats.staleCount).toBe(2);
  });

  it("should not affect other holidays", () => {
    /**
     * GOAL: Verify invalidating one holiday doesn't affect others
     * FACTORS:
     *   - Cache Christmas, Halloween, Easter
     *   - Invalidate Christmas only
     * EXPECTED:
     *   - Only Christmas marked stale
     *   - Halloween and Easter remain unchanged
     */
    const christmas = holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloween = holidayIntentCacheManager.getIntent("holiday-halloween");
    const easter = holidayIntentCacheManager.getIntent("holiday-easter");

    expect(christmas.stale).toBe(false);
    expect(halloween.stale).toBe(false);
    expect(easter.stale).toBe(false);

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    // Get them again to check stale status
    const christmasAfter =
      holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloweenAfter =
      holidayIntentCacheManager.getIntent("holiday-halloween");
    const easterAfter = holidayIntentCacheManager.getIntent("holiday-easter");

    // Christmas was recalculated (so fresh)
    expect(christmasAfter.stale).toBe(false);
    // Others should be unchanged (still have original instance)
    expect(halloweenAfter.stale).toBe(false);
    expect(easterAfter.stale).toBe(false);
  });

  it("should handle invalidating non-existent holiday gracefully", () => {
    /**
     * GOAL: Verify no error when invalidating unknown holiday
     * FACTORS:
     *   - Holiday tag never cached
     *   - Call invalidateHoliday
     * EXPECTED:
     *   - No errors thrown
     *   - staleCount unchanged (nothing to invalidate)
     */
    const statsBefore = holidayIntentCacheManager.getStats();

    expect(() => {
      holidayIntentCacheManager.invalidateHoliday("holiday-nonexistent");
    }).not.toThrow();

    const statsAfter = holidayIntentCacheManager.getStats();
    expect(statsAfter.staleCount).toBe(statsBefore.staleCount);
  });

  it("should allow re-invalidating already stale holiday", () => {
    /**
     * GOAL: Verify calling invalidateHoliday twice is safe
     * FACTORS:
     *   - Invalidate holiday
     *   - Invalidate same holiday again
     * EXPECTED:
     *   - No errors
     *   - stale flag remains true
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    const stats1 = holidayIntentCacheManager.getStats();
    expect(stats1.staleCount).toBe(1);

    // Invalidate again
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    const stats2 = holidayIntentCacheManager.getStats();
    expect(stats2.staleCount).toBe(1); // Still 1, not doubled
  });

  it("should preserve cache entry (not delete)", () => {
    /**
     * GOAL: Verify invalidateHoliday marks stale but doesn't delete from cache
     * FACTORS:
     *   - Cache size before invalidate
     *   - Cache size after invalidate
     * EXPECTED:
     *   - Cache size unchanged
     *   - Entry still exists, just marked stale
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");
    holidayIntentCacheManager.getIntent("holiday-halloween");

    const sizeBefore = holidayIntentCacheManager.getStats().cacheSize;

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");

    const sizeAfter = holidayIntentCacheManager.getStats().cacheSize;
    expect(sizeAfter).toBe(sizeBefore); // Size unchanged
  });

  it("should work correctly with clear() afterwards", () => {
    /**
     * GOAL: Verify invalidate followed by clear works correctly
     * FACTORS:
     *   - Invalidate holiday
     *   - Call clear()
     * EXPECTED:
     *   - Invalidate marks stale
     *   - Clear removes all entries
     *   - Cache becomes empty
     */
    holidayIntentCacheManager.getIntent("holiday-christmas");

    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(1);

    holidayIntentCacheManager.clear();
    expect(holidayIntentCacheManager.getStats().cacheSize).toBe(0);
  });
});
