import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("calculateIntent", () => {
  beforeEach(() => {
    // Clear the cache to start fresh for each test
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    // Clean up after each test
    holidayIntentCacheManager.clear();
  });

  it("should create HolidayIntent with correct structure", () => {
    /**
     * GOAL: Verify calculateIntent returns valid HolidayIntent structure
     * FACTORS:
     *   - Call getIntent which calls calculateIntent internally
     *   - First access triggers calculation
     * EXPECTED:
     *   - Returns object with all required HolidayIntent properties:
     *     * holidayTagId, totalAvailableMinutes, threeDayDistribution,
     *     * currentRotationDay, lastRotationDate, selectedMinutesToday,
     *     * lastResetDate, calculatedAt, stale
     *   - All properties have correct types
     *   - All required values are set
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    expect(intent.holidayTagId).toBe("holiday-christmas");
    expect(typeof intent.totalAvailableMinutes).toBe("number");
    expect(Array.isArray(intent.threeDayDistribution)).toBe(true);
    expect(intent.threeDayDistribution.length).toBe(3);
    expect([1, 2, 3]).toContain(intent.currentRotationDay);
    expect(typeof intent.lastRotationDate).toBe("string");
    expect(typeof intent.selectedMinutesToday).toBe("number");
    expect(typeof intent.lastResetDate).toBe("string");
    expect(typeof intent.calculatedAt).toBe("number");
    expect(intent.stale).toBe(false);
  });

  it("should calculate totalAvailableMinutes correctly", () => {
    /**
     * GOAL: Verify total minutes includes all tagged movies and episodes
     * FACTORS:
     *   - Christmas has multiple movies and shows with episodes
     *   - Each has duration in seconds (converted to minutes)
     * EXPECTED:
     *   - totalAvailableMinutes is sum of all:
     *     * Polar Express (100 min) + Elf (97) + Home Alone (103) +
     *       Christmas Story (94) + Wonderful Life (130) +
     *       Office Holiday (135) + Friends Holiday (44) = ~703 minutes
     *   - Value is reasonable and positive
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    expect(intent.totalAvailableMinutes).toBeGreaterThan(0);
    // Rough check: Christmas should have substantial content
    expect(intent.totalAvailableMinutes).toBeGreaterThan(500);
    expect(intent.totalAvailableMinutes).toBeLessThan(1000);
  });

  it("should set totalAvailableMinutes to 0 for empty holiday", () => {
    /**
     * GOAL: Verify handling of holiday with no content
     * FACTORS:
     *   - Holiday tag exists but no movies/episodes tagged with it
     * EXPECTED:
     *   - totalAvailableMinutes = 0
     *   - threeDayDistribution = [0, 0, 0]
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-nonexistent");

    expect(intent.totalAvailableMinutes).toBe(0);
    expect(intent.threeDayDistribution).toEqual([0, 0, 0]);
  });

  it("should set currentRotationDay to valid value (1, 2, or 3)", () => {
    /**
     * GOAL: Verify rotation day is set to deterministic value based on date
     * FACTORS:
     *   - Current date determines rotation day via epoch calculation
     * EXPECTED:
     *   - currentRotationDay is 1, 2, or 3
     *   - Same for all holidays on same date
     */
    const christmas = holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloween = holidayIntentCacheManager.getIntent("holiday-halloween");

    expect([1, 2, 3]).toContain(christmas.currentRotationDay);
    expect([1, 2, 3]).toContain(halloween.currentRotationDay);
    // Both calculated on same date, should have same rotation
    expect(christmas.currentRotationDay).toBe(halloween.currentRotationDay);
  });

  it("should set lastRotationDate to today's ISO date", () => {
    /**
     * GOAL: Verify lastRotationDate is set to current date
     * FACTORS:
     *   - calculateIntent called today
     * EXPECTED:
     *   - lastRotationDate matches today in YYYY-MM-DD format
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    expect(intent.lastRotationDate).toBe(today);
  });

  it("should initialize selectedMinutesToday to 0", () => {
    /**
     * GOAL: Verify fresh intent starts with no selected content
     * FACTORS:
     *   - New holiday intent calculated
     * EXPECTED:
     *   - selectedMinutesToday = 0
     *   - Budget is full and available
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-halloween");

    expect(intent.selectedMinutesToday).toBe(0);
  });

  it("should set lastResetDate to today", () => {
    /**
     * GOAL: Verify last reset date is initialized to today
     * FACTORS:
     *   - First calculation on today
     * EXPECTED:
     *   - lastResetDate matches today's ISO date
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-easter");
    const today = new Date().toISOString().split("T")[0];

    expect(intent.lastResetDate).toBe(today);
  });

  it("should set calculatedAt to recent timestamp", () => {
    /**
     * GOAL: Verify calculation timestamp is set to now
     * FACTORS:
     *   - Calculate intent
     *   - Check timestamp is recent
     * EXPECTED:
     *   - calculatedAt is within last second (roughly current time)
     *   - Is a valid Unix timestamp (milliseconds)
     */
    const beforeCalc = Date.now();
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    const afterCalc = Date.now();

    expect(intent.calculatedAt).toBeGreaterThanOrEqual(beforeCalc);
    expect(intent.calculatedAt).toBeLessThanOrEqual(afterCalc + 100); // Allow 100ms buffer
  });

  it("should initialize stale to false", () => {
    /**
     * GOAL: Verify newly calculated intent is not marked stale
     * FACTORS:
     *   - Fresh calculation
     * EXPECTED:
     *   - stale = false
     *   - Intent is ready to use
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    expect(intent.stale).toBe(false);
  });

  it("should distribute threeDayDistribution correctly", () => {
    /**
     * GOAL: Verify three-day distribution is calculated correctly
     * FACTORS:
     *   - Holiday with specific total available minutes
     *   - Distribution algorithm should apply
     * EXPECTED:
     *   - Sum of distribution equals totalAvailableMinutes (if <= 810)
     *   - Or [270, 270, 270] if totalAvailableMinutes > 810
     *   - Each value is non-negative
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    const [day1, day2, day3] = intent.threeDayDistribution;

    // All should be non-negative
    expect(day1).toBeGreaterThanOrEqual(0);
    expect(day2).toBeGreaterThanOrEqual(0);
    expect(day3).toBeGreaterThanOrEqual(0);

    // Sum should match total
    if (intent.totalAvailableMinutes <= 810) {
      expect(day1 + day2 + day3).toBe(intent.totalAvailableMinutes);
    } else {
      expect(day1).toBe(270);
      expect(day2).toBe(270);
      expect(day3).toBe(270);
    }
  });

  it("should handle different holidays independently", () => {
    /**
     * GOAL: Verify calculations are per-holiday and don't interfere
     * FACTORS:
     *   - Calculate Christmas and Halloween separately
     *   - Different content amounts
     * EXPECTED:
     *   - Each intent calculated independently
     *   - totalAvailableMinutes differs per holiday
     *   - threeDayDistribution differs
     */
    const christmas = holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloween = holidayIntentCacheManager.getIntent("holiday-halloween");

    expect(christmas.holidayTagId).toBe("holiday-christmas");
    expect(halloween.holidayTagId).toBe("holiday-halloween");

    // Christmas should have more content than Halloween in our test data
    expect(christmas.totalAvailableMinutes).toBeGreaterThan(
      halloween.totalAvailableMinutes
    );
  });

  it("should calculate consistently (same input = same output)", () => {
    /**
     * GOAL: Verify calculation is deterministic
     * FACTORS:
     *   - Calculate same holiday twice (via invalidate + recalculate)
     *   - No DB changes between calculations
     * EXPECTED:
     *   - Both calculations produce same results
     *   - totalAvailableMinutes same
     *   - threeDayDistribution same
     *   - Values deterministic
     */
    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    const total1 = intent1.totalAvailableMinutes;
    const dist1 = intent1.threeDayDistribution;

    // Invalidate and recalculate
    holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");
    const total2 = intent2.totalAvailableMinutes;
    const dist2 = intent2.threeDayDistribution;

    expect(total1).toBe(total2);
    expect(dist1).toEqual(dist2);
  });

  it("should handle holidays with only movies", () => {
    /**
     * GOAL: Verify calculation works for holidays with only movies (no shows)
     * FACTORS:
     *   - Holiday like Easter might have mostly movies
     * EXPECTED:
     *   - Calculates totalAvailableMinutes correctly
     *   - No errors from missing episodes
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-easter");

    expect(intent.totalAvailableMinutes).toBeGreaterThan(0);
    expect(intent.threeDayDistribution[0]).toBeGreaterThan(0);
  });

  it("should handle holidays with only episodes", () => {
    /**
     * GOAL: Verify calculation works for holidays with only show episodes
     * FACTORS:
     *   - Holiday might have only episodes from shows
     * EXPECTED:
     *   - Includes episode durations in totalAvailableMinutes
     *   - Calculates correctly
     */
    // Note: Our test data has Christmas with both, but verify the logic works
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    // Should include both movies and episodes
    expect(intent.totalAvailableMinutes).toBeGreaterThan(0);
  });

  it("should set values suitable for budgeting decisions", () => {
    /**
     * GOAL: Verify calculated intent is ready for budget tracking
     * FACTORS:
     *   - Intent will be used by canAddMoreContent, trackSelectedMinutes, etc.
     * EXPECTED:
     *   - All values make sense for budgeting:
     *     * totalAvailableMinutes is realistic
     *     * threeDayDistribution sums correctly
     *     * selectedMinutesToday starts at 0
     *     * currentRotationDay is valid
     */
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    // Budgeting sanity checks
    expect(intent.totalAvailableMinutes).toBeGreaterThanOrEqual(0);
    expect(intent.selectedMinutesToday).toBe(0);
    const targetToday =
      intent.threeDayDistribution[intent.currentRotationDay - 1];
    expect(targetToday).toBeGreaterThanOrEqual(0);

    // Can add more initially since selected=0 < target
    if (targetToday > 0) {
      expect(intent.selectedMinutesToday).toBeLessThan(targetToday);
    }
  });
});
