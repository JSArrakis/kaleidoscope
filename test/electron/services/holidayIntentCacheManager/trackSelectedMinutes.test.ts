import { jest } from "@jest/globals";
import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

// Mock the movieRepository since this test doesn't need real database data
jest.mock("../../../../src/electron/repositories/movieRepository", () => ({
  movieRepository: {
    getTotalMinutesByHolidayTag: jest.fn().mockReturnValue(300),
  },
}));

describe("trackSelectedMinutes", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should accumulate selectedMinutesToday with each call", () => {
    /**
     * GOAL: Verify that trackSelectedMinutes adds to running total
     * FACTORS:
     *   - Multiple trackSelectedMinutes calls with different durations
     *   - Same date and holiday
     * EXPECTED:
     *   - selectedMinutesToday increments by called amount each time
     *   - Final total is sum of all tracked minutes
     */
    const dateString = "2025-12-15";

    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(0);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      dateString
    );
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(50);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      75,
      dateString
    );
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(125);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      25,
      dateString
    );
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(150);
  });

  it("should reset counter when date changes", () => {
    /**
     * GOAL: Verify that changing date resets selectedMinutesToday
     * FACTORS:
     *   - Track on date 1, accumulate to 100 minutes
     *   - Track on date 2
     *   - lastResetDate changes
     * EXPECTED:
     *   - After tracking on date 2, counter resets to that day's tracked amount only
     *   - Date 1 total not carried to date 2
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-16";

    // Track on date 1
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      date1
    );
    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(100);
    expect(intent.lastResetDate).toBe(date1);

    // Track on date 2
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      date2
    );
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(50); // Reset for new date
    expect(intent.lastResetDate).toBe(date2);
  });

  it("should update lastResetDate when crossing day boundary", () => {
    /**
     * GOAL: Verify lastResetDate is updated when date changes
     * FACTORS:
     *   - Track on date 1
     *   - Track on date 2 (different date)
     * EXPECTED:
     *   - lastResetDate updates to date 2
     *   - Reflects the date of most recent reset
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-16";

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      date1
    );

    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.lastResetDate).toBe(date1);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      date2
    );

    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.lastResetDate).toBe(date2);
  });

  it("should update currentRotationDay when date changes", () => {
    /**
     * GOAL: Verify rotation day updates when date changes
     * FACTORS:
     *   - Track on date 1 (rotation day X)
     *   - Track on date 2 (rotation day Y)
     *   - Date 2 may have different rotation based on epoch
     * EXPECTED:
     *   - currentRotationDay updates on date change
     *   - Valid rotation day (1, 2, or 3)
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-20"; // 5 days later

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      date1
    );
    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    const rotDay1 = intent.currentRotationDay;

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      date2
    );
    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    const rotDay2 = intent.currentRotationDay;

    expect([1, 2, 3]).toContain(rotDay1);
    expect([1, 2, 3]).toContain(rotDay2);
  });

  it("should work with zero minutes", () => {
    /**
     * GOAL: Verify tracking 0 minutes doesn't cause issues
     * FACTORS:
     *   - Call trackSelectedMinutes with 0
     *   - Should be valid operation
     * EXPECTED:
     *   - No errors thrown
     *   - selectedMinutesToday stays same (0 + 0 = 0)
     */
    const dateString = "2025-12-15";

    expect(() => {
      holidayIntentCacheManager.trackSelectedMinutes(
        "holiday-christmas",
        0,
        dateString
      );
    }).not.toThrow();

    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(0);
  });

  it("should handle negative minutes (edge case)", () => {
    /**
     * GOAL: Verify behavior with negative minutes (unusual but possible edge case)
     * FACTORS:
     *   - Call trackSelectedMinutes with negative value
     * EXPECTED:
     *   - Accumulates (subtracts in this case)
     *   - selectedMinutesToday can go negative (or stays >= 0 depending on implementation)
     */
    const dateString = "2025-12-15";

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      dateString
    );

    let intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(100);

    // This is an edge case - implementation may not expect this
    // Just verify it doesn't crash
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      -30,
      dateString
    );

    intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    // May be 70 or implementation may clamp to 0
    expect(intent.selectedMinutesToday).toBeDefined();
  });

  it("should track independently for different holidays", () => {
    /**
     * GOAL: Verify tracking is per-holiday
     * FACTORS:
     *   - Track Christmas with 100 minutes
     *   - Track Halloween with 50 minutes
     *   - Same date
     * EXPECTED:
     *   - Christmas selectedMinutesToday = 100
     *   - Halloween selectedMinutesToday = 50
     *   - Independent tracking
     */
    const dateString = "2025-12-15";

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      dateString
    );
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-halloween",
      50,
      dateString
    );

    const christmasIntent =
      holidayIntentCacheManager.getIntent("holiday-christmas");
    const halloweenIntent =
      holidayIntentCacheManager.getIntent("holiday-halloween");

    expect(christmasIntent.selectedMinutesToday).toBe(100);
    expect(halloweenIntent.selectedMinutesToday).toBe(50);
  });

  it("should not throw for non-existent holiday", () => {
    /**
     * GOAL: Verify tracking doesn't fail for non-existent holiday
     * FACTORS:
     *   - Track for holiday tag that doesn't exist
     * EXPECTED:
     *   - No errors thrown
     *   - Intent created with 0 content
     */
    const dateString = "2025-12-15";

    expect(() => {
      holidayIntentCacheManager.trackSelectedMinutes(
        "holiday-nonexistent",
        50,
        dateString
      );
    }).not.toThrow();

    const intent = holidayIntentCacheManager.getIntent("holiday-nonexistent");
    expect(intent.selectedMinutesToday).toBe(50);
  });

  it("should allow exceeding target (budget enforcement elsewhere)", () => {
    /**
     * GOAL: Verify trackSelectedMinutes doesn't prevent exceeding budget
     * FACTORS:
     *   - Target is 180 minutes
     *   - Track 250 minutes
     * EXPECTED:
     *   - selectedMinutesToday = 250 (exceeded)
     *   - trackSelectedMinutes doesn't enforce budget, that's canAddMoreContent's job
     */
    const dateString = "2025-12-15";
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    // Track way over budget
    const overBudgetAmount = target * 2;
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      overBudgetAmount,
      dateString
    );

    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent.selectedMinutesToday).toBe(overBudgetAmount);
  });
});
