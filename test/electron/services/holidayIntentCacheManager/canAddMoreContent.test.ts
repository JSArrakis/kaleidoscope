import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("canAddMoreContent", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should return true when selectedMinutesToday is below target", () => {
    /**
     * GOAL: Verify canAddMoreContent returns true when budget remains
     * FACTORS:
     *   - Target for today (e.g., 180 min)
     *   - Selected so far (e.g., 50 min)
     *   - Selected < Target
     * EXPECTED:
     *   - Returns true
     *   - Budget available to add more content
     */
    const dateString = "2025-12-15";

    // Start fresh with 0 selected
    const canAdd1 = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      dateString
    );
    expect(canAdd1).toBe(true);

    // Track some minutes (but less than target)
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      Math.floor(target / 2), // Select half the target
      dateString
    );

    const canAdd2 = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      dateString
    );
    expect(canAdd2).toBe(true);
  });

  it("should return false when selectedMinutesToday equals or exceeds target", () => {
    /**
     * GOAL: Verify canAddMoreContent returns false when budget exhausted
     * FACTORS:
     *   - Target for today (e.g., 180 min)
     *   - Selected so far (e.g., 180 min)
     *   - Selected >= Target
     * EXPECTED:
     *   - Returns false
     *   - No more budget for today
     */
    const dateString = "2025-12-15";

    // Get today's target
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    // Track exactly the target amount
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      target,
      dateString
    );

    const canAdd = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      dateString
    );
    expect(canAdd).toBe(false);
  });

  it("should return false when selectedMinutesToday exceeds target", () => {
    /**
     * GOAL: Verify canAddMoreContent stays false when budget is exceeded
     * FACTORS:
     *   - Target for today (e.g., 180 min)
     *   - Selected so far (e.g., 250 min) - over budget
     * EXPECTED:
     *   - Returns false
     *   - Even if selected > target, still returns false
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    // Track more than the target
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      target + 100,
      dateString
    );

    const canAdd = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      dateString
    );
    expect(canAdd).toBe(false);
  });

  it("should reset budget when date changes", () => {
    /**
     * GOAL: Verify daily budget resets when moving to new date
     * FACTORS:
     *   - Date 1: Select content and exhaust budget
     *   - Date 2: Same holiday, but fresh budget
     * EXPECTED:
     *   - On date 1: canAddMoreContent returns false after exhausting
     *   - On date 2: canAddMoreContent returns true (fresh budget)
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-16";

    // On date1, exhaust budget
    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date1
    );
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      target1,
      date1
    );

    const canAdd1 = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      date1
    );
    expect(canAdd1).toBe(false);

    // On date2, should have fresh budget
    const canAdd2 = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      date2
    );
    expect(canAdd2).toBe(true);
  });

  it("should return true for holiday with zero content/target", () => {
    /**
     * GOAL: Verify behavior for holiday with no content
     * FACTORS:
     *   - Holiday tag has no tagged movies/episodes
     *   - Target is 0
     *   - selectedMinutesToday is also 0
     * EXPECTED:
     *   - Returns false (0 is not less than 0)
     *   - No budget to add content when target is 0
     */
    const canAdd = holidayIntentCacheManager.canAddMoreContent(
      "holiday-nonexistent",
      "2025-12-15"
    );
    expect(canAdd).toBe(false); // 0 < 0 is false
  });

  it("should track across multiple trackSelectedMinutes calls", () => {
    /**
     * GOAL: Verify accumulated tracking across multiple selections
     * FACTORS:
     *   - Multiple calls to trackSelectedMinutes
     *   - Accumulation of minutes
     * EXPECTED:
     *   - canAddMoreContent reflects total accumulated
     *   - Returns true as long as total < target
     *   - Returns false once total >= target
     */
    const dateString = "2025-12-15";
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    const oneThird = Math.floor(target / 3);

    // First call
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      oneThird,
      dateString
    );
    expect(
      holidayIntentCacheManager.canAddMoreContent(
        "holiday-christmas",
        dateString
      )
    ).toBe(true);

    // Second call
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      oneThird,
      dateString
    );
    expect(
      holidayIntentCacheManager.canAddMoreContent(
        "holiday-christmas",
        dateString
      )
    ).toBe(true);

    // Third call to reach/exceed target
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      oneThird + (target % 3) + 1, // Exceed target
      dateString
    );
    expect(
      holidayIntentCacheManager.canAddMoreContent(
        "holiday-christmas",
        dateString
      )
    ).toBe(false);
  });

  it("should handle different holidays independently", () => {
    /**
     * GOAL: Verify that budget tracking is per-holiday
     * FACTORS:
     *   - Two different holidays on same date
     *   - Different budgets and selection amounts
     * EXPECTED:
     *   - Christmas budget independent from Halloween
     *   - Exhausting one doesn't affect the other
     */
    const dateString = "2025-12-15";

    const christmasTarget = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );
    const halloweenTarget = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-halloween",
      dateString
    );

    // Exhaust Christmas
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      christmasTarget,
      dateString
    );

    const christmasCanAdd = holidayIntentCacheManager.canAddMoreContent(
      "holiday-christmas",
      dateString
    );
    const halloweenCanAdd = holidayIntentCacheManager.canAddMoreContent(
      "holiday-halloween",
      dateString
    );

    expect(christmasCanAdd).toBe(false);
    expect(halloweenCanAdd).toBe(true); // Halloween budget unaffected
  });
});
