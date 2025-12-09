import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("getRemainingMinutesToday", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should return full target when nothing selected yet", () => {
    /**
     * GOAL: Verify full budget is available initially
     * FACTORS:
     *   - Fresh intent with selectedMinutesToday = 0
     *   - Target for today is X minutes
     * EXPECTED:
     *   - getRemainingMinutesToday returns X
     *   - Equal to getTodayTargetMinutes
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );
    const remaining = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );

    expect(remaining).toBe(target);
  });

  it("should decrease as content is selected", () => {
    /**
     * GOAL: Verify remaining budget decreases with selections
     * FACTORS:
     *   - Initial remaining = target
     *   - Select 50 minutes
     *   - Select another 75 minutes
     * EXPECTED:
     *   - After first selection: remaining = target - 50
     *   - After second selection: remaining = target - 125
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    const remaining1 = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );
    expect(remaining1).toBe(target);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      50,
      dateString
    );

    const remaining2 = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );
    expect(remaining2).toBe(target - 50);

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      75,
      dateString
    );

    const remaining3 = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );
    expect(remaining3).toBe(target - 125);
  });

  it("should return 0 when budget fully exhausted", () => {
    /**
     * GOAL: Verify remaining is 0 when selectedMinutesToday equals target
     * FACTORS:
     *   - Select exactly the target amount
     * EXPECTED:
     *   - getRemainingMinutesToday returns 0
     *   - No negative values
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      target,
      dateString
    );

    const remaining = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );

    expect(remaining).toBe(0);
  });

  it("should not return negative values when exceeding target", () => {
    /**
     * GOAL: Verify remaining is clamped to 0 (never negative)
     * FACTORS:
     *   - Target = 180
     *   - Selected = 250 (over budget)
     * EXPECTED:
     *   - Returns 0 (or max(0, 180-250))
     *   - Never returns negative value
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    // Select way over budget
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      target + 100,
      dateString
    );

    const remaining = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );

    expect(remaining).toBeGreaterThanOrEqual(0); // Should be 0, not negative
  });

  it("should reset when date changes", () => {
    /**
     * GOAL: Verify remaining budget resets on new date
     * FACTORS:
     *   - Date 1: Select 100 minutes (remaining = target - 100)
     *   - Date 2: Fresh day (remaining = new target)
     * EXPECTED:
     *   - Date 1 remaining = old target - 100
     *   - Date 2 remaining = new target (full budget again)
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-16";

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date1
    );
    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date2
    );

    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      date1
    );

    const remaining1 = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      date1
    );
    expect(remaining1).toBe(target1 - 100);

    const remaining2 = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      date2
    );
    expect(remaining2).toBe(target2); // Fresh budget for new day
  });

  it("should return 0 for holiday with no content", () => {
    /**
     * GOAL: Verify remaining is 0 for holiday with zero target
     * FACTORS:
     *   - Holiday with no tagged content
     *   - Target = 0
     * EXPECTED:
     *   - Returns 0
     */
    const remaining = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-nonexistent",
      "2025-12-15"
    );

    expect(remaining).toBe(0);
  });

  it("should track independently per holiday", () => {
    /**
     * GOAL: Verify remaining budget is per-holiday
     * FACTORS:
     *   - Christmas and Halloween on same date
     *   - Different selection amounts
     * EXPECTED:
     *   - Christmas remaining = christmas target - selected
     *   - Halloween remaining = halloween target - selected
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

    const christmasRemaining =
      holidayIntentCacheManager.getRemainingMinutesToday(
        "holiday-christmas",
        dateString
      );
    const halloweenRemaining =
      holidayIntentCacheManager.getRemainingMinutesToday(
        "holiday-halloween",
        dateString
      );

    expect(christmasRemaining).toBe(christmasTarget - 100);
    expect(halloweenRemaining).toBe(halloweenTarget - 50);
  });

  it("should handle fractional remaining correctly", () => {
    /**
     * GOAL: Verify calculation works with fractional/odd numbers
     * FACTORS:
     *   - Target might not divide evenly
     *   - Select amounts that leave fractional remaining
     * EXPECTED:
     *   - Returns correct remaining value
     *   - Handles Math operations correctly
     */
    const dateString = "2025-12-15";

    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      dateString
    );

    // Select a fractional amount
    const selectAmount = Math.floor(target * 0.33);
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      selectAmount,
      dateString
    );

    const remaining = holidayIntentCacheManager.getRemainingMinutesToday(
      "holiday-christmas",
      dateString
    );

    expect(remaining).toBe(target - selectAmount);
  });
});
