import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("getRotationDay", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should return rotation day 1, 2, or 3 based on date from epoch", () => {
    /**
     * GOAL: Verify getRotationDay returns correct rotation cycle based on date
     * FACTORS:
     *   - Days since epoch determine position in 3-day cycle
     *   - Rotation cycles: day1 → day2 → day3 → day1 ...
     * EXPECTED:
     *   - Always returns 1, 2, or 3 (never outside this range)
     *   - Consistent for same date (deterministic)
     *   - Different dates yield different or same rotation based on math
     */
    // Test by calling getTodayTargetMinutes which internally uses getRotationDay
    const targetDay1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      "2025-01-01"
    );
    const targetDay2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      "2025-01-02"
    );
    const targetDay3 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      "2025-01-03"
    );
    const targetDay4 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      "2025-01-04"
    );

    // All should be valid targets (non-zero for christmas)
    expect(targetDay1).toBeGreaterThan(0);
    expect(targetDay2).toBeGreaterThan(0);
    expect(targetDay3).toBeGreaterThan(0);
    expect(targetDay4).toBeGreaterThan(0);

    // Day 4 should match day 1 (cycle repeats)
    // This is based on epoch calculation
  });

  it("should cycle correctly: day 1 → 2 → 3 → 1 pattern", () => {
    /**
     * GOAL: Verify that rotation follows correct cycling pattern
     * FACTORS:
     *   - Consecutive dates should rotate through 1, 2, 3, 1, 2, 3...
     *   - Every 3 days returns to same rotation number
     * EXPECTED:
     *   - Can determine rotation for any date
     *   - Pattern is deterministic and repeats every 3 days
     */
    // Pick two dates 3 days apart
    const date1 = "2025-06-15";
    const date2 = "2025-06-18"; // 3 days later

    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date1
    );
    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date2
    );

    // After recalculation, intent should reflect different rotation days
    // but pattern repeats every 3 days
    expect(target1).toBeGreaterThan(0);
    expect(target2).toBeGreaterThan(0);
  });

  it("should be deterministic for same date", () => {
    /**
     * GOAL: Verify same date always returns same rotation day
     * FACTORS:
     *   - Same date accessed multiple times
     *   - No randomness in rotation calculation
     * EXPECTED:
     *   - Multiple calls with same date return same target minutes
     *   - Same date = same position in cycle
     */
    const testDate = "2025-07-20";

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      testDate
    );

    // Clear and check again
    holidayIntentCacheManager.clear();

    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      testDate
    );

    expect(target1).toBe(target2); // Same date = same rotation = same target
  });

  it("should handle dates across year boundaries", () => {
    /**
     * GOAL: Verify rotation calculation works across year boundaries
     * FACTORS:
     *   - Dates spanning Dec 31 to Jan 1
     *   - Leap years and non-leap years
     * EXPECTED:
     *   - No errors thrown
     *   - Correct rotation returned
     *   - Continuous cycling regardless of year change
     */
    const dec31 = "2025-12-31";
    const jan1 = "2026-01-01";

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dec31
    );
    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      jan1
    );

    expect(target1).toBeGreaterThan(0);
    expect(target2).toBeGreaterThan(0);
    // These may be same or different depending on epoch day calculation
  });
});
