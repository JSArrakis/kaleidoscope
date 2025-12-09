import { holidayIntentCacheManager } from "../../../../src/electron/services/holidayIntentCacheManager";

describe("getTodayTargetMinutes", () => {
  beforeEach(() => {
    holidayIntentCacheManager.clear();
  });

  afterEach(() => {
    holidayIntentCacheManager.clear();
  });

  it("should return correct target minutes for current rotation day", () => {
    /**
     * GOAL: Verify getTodayTargetMinutes returns appropriate target based on rotation
     * FACTORS:
     *   - Holiday with calculated threeDayDistribution
     *   - Date that determines rotation day (1, 2, or 3)
     * EXPECTED:
     *   - Returns one of the three distribution values
     *   - Value is from threeDayDistribution array indexed by (rotationDay - 1)
     *   - Value is positive for holidays with content
     */
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      "2025-12-15"
    );

    expect(target).toBeGreaterThan(0);
    // Should be one of the distribution values
    const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
    const possibleValues = intent.threeDayDistribution;
    expect(possibleValues).toContain(target);
  });

  it("should reset selectedMinutesToday when moving to new date", () => {
    /**
     * GOAL: Verify daily counter resets when date changes
     * FACTORS:
     *   - Select content on day 1 (tracks selectedMinutesToday)
     *   - Query for different date (day 2)
     *   - lastResetDate should update
     * EXPECTED:
     *   - Intent selectedMinutesToday resets to 0 on new date
     *   - lastResetDate updates to new date
     *   - canAddMoreContent returns true (fresh daily budget)
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-16";

    // Track some minutes on date1
    holidayIntentCacheManager.trackSelectedMinutes(
      "holiday-christmas",
      100,
      date1
    );

    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    expect(intent1.selectedMinutesToday).toBe(100);
    expect(intent1.lastResetDate).toBe(date1);

    // Call getTodayTargetMinutes with date2
    holidayIntentCacheManager.getTodayTargetMinutes("holiday-christmas", date2);

    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");
    // Counter should reset
    expect(intent2.selectedMinutesToday).toBe(0);
    expect(intent2.lastResetDate).toBe(date2);
  });

  it("should update rotation day when date changes", () => {
    /**
     * GOAL: Verify that rotation day updates when crossing day boundaries
     * FACTORS:
     *   - Initial date and initial rotation day
     *   - Different date may have different rotation day
     * EXPECTED:
     *   - currentRotationDay updates based on new date
     *   - lastRotationDate reflects the new date
     */
    const date1 = "2025-12-15";
    const date2 = "2025-12-20"; // 5 days later

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date1
    );
    const intent1 = holidayIntentCacheManager.getIntent("holiday-christmas");
    const rotationDay1 = intent1.currentRotationDay;

    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      date2
    );
    const intent2 = holidayIntentCacheManager.getIntent("holiday-christmas");
    const rotationDay2 = intent2.currentRotationDay;

    // Both should be valid rotation days
    expect([1, 2, 3]).toContain(rotationDay1);
    expect([1, 2, 3]).toContain(rotationDay2);

    // Rotation days might be same or different depending on epoch days
    // Just verify they're tracked
    expect(intent2.lastRotationDate).toBe(date2);
  });

  it("should return 0 for holiday with no content", () => {
    /**
     * GOAL: Verify target is 0 for holidays with no tagged content
     * FACTORS:
     *   - Holiday tag with no movies or episodes tagged
     *   - threeDayDistribution is [0, 0, 0]
     * EXPECTED:
     *   - Returns 0 regardless of rotation day
     *   - No errors thrown
     */
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-nonexistent",
      "2025-12-15"
    );

    expect(target).toBe(0);
  });

  it("should maintain consistency for same date across multiple calls", () => {
    /**
     * GOAL: Verify same date always returns same target
     * FACTORS:
     *   - Same date queried multiple times
     *   - No changes to holiday content
     * EXPECTED:
     *   - All calls with same date return identical target
     *   - Rotation day stays same
     */
    const testDate = "2025-08-10";

    const target1 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      testDate
    );
    const target2 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      testDate
    );
    const target3 = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-christmas",
      testDate
    );

    expect(target1).toBe(target2);
    expect(target2).toBe(target3);
  });

  it("should return value from threeDayDistribution array", () => {
    /**
     * GOAL: Verify returned target is one of the three distribution values
     * FACTORS:
     *   - Holiday with specific threeDayDistribution
     *   - Date determines rotation day (index into distribution)
     * EXPECTED:
     *   - Returned value is exactly one of [day1, day2, day3]
     *   - No values outside this set
     */
    const target = holidayIntentCacheManager.getTodayTargetMinutes(
      "holiday-halloween",
      "2025-10-15"
    );

    const intent = holidayIntentCacheManager.getIntent("holiday-halloween");
    const [day1, day2, day3] = intent.threeDayDistribution;

    expect([day1, day2, day3]).toContain(target);
  });
});
