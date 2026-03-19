/**
 * ============================================================================
 * HOLIDAY INTENT CACHE MANAGER
 * ============================================================================
 *
 * PROBLEM IT SOLVES:
 * -----------------
 * When building a continuous media stream, we need to intelligently incorporate
 * holiday-themed content at the right times and in the right amounts. However,
 * repeatedly calculating content distribution across dates is expensive:
 * - Query databases for all holiday content
 * - Analyze available duration across multiple media items
 * - Distribute content across 3-day rotations with smart budgeting
 * - Check holiday dates and season spans
 *
 * WHY THIS MATTERS FOR STREAMING:
 * --------------------------------
 * Stream construction happens FREQUENTLY:
 * - Every time a user starts/resumes playback
 * - Multiple times during a single session as content is selected
 * - During continuous 24/7 playback blocks with automatic progression
 *
 * Without caching, each stream construction would trigger expensive calculations:
 * - If building streams 10+ times per session, we'd query databases 10+ times
 * - Database queries could take 100-500ms each
 * - Delays compound: slow stream construction → poor user experience
 * - Real-time selection becomes sluggish
 *
 * CACHING SOLUTION:
 * - First stream construction: Calculate once (100-500ms, acceptable overhead)
 * - Subsequent constructions: Return cached result instantly (<1ms)
 * - Invalidate only when holiday content actually changes
 * - Balances performance with data freshness
 *
 * This manager caches these calculations to avoid redundant database queries
 * and computations while remaining responsive to changes.
 *
 * WHAT IT DOES:
 * -------------
 * 1. LAZY-LOADED CACHE: Only calculates holiday intents when first accessed
 *    - First access to "Christmas" holiday → calculate and cache
 *    - Subsequent accesses → return cached value instantly
 *
 * 2. INVALIDATION TRACKING: Marks entries as stale when updates occur
 *    - Holiday content is added/removed → invalidateHoliday("christmas")
 *    - Next access recalculates from fresh data
 *    - Other holidays remain cached and don't recalculate
 *
 * 3. THREE-DAY ROTATION DISTRIBUTION: Spreads content across rotating days
 *    - Maps out 3-day rotation cycles (day 1, 2, 3, repeat)
 *    - Each day gets a fair share of available content
 *    - Deterministic: same holiday = same distribution each cycle
 *    - Example: 360 minutes available → 120 minutes per day per cycle
 *
 * 4. BUDGET TRACKING: Prevents over-selection of content
 *    - Tracks minutes selected today vs. 3-day allocation
 *    - canAddMoreContent() prevents exceeding daily budget
 *    - getRemainingMinutesToday() shows available capacity
 *
 * HOW IT WORKS:
 * -------------
 * Cache Structure:
 *   Map<holidayTagId, HolidayIntent>
 *   Where HolidayIntent contains:
 *     - holidayTagId: The holiday tag identifier
 *     - totalAvailableMinutes: All holiday content duration (movies + shows)
 *     - threeDayDistribution: [day1, day2, day3] minutes per cycle
 *     - currentRotationDay: Which day (1, 2, or 3) we're currently on
 *     - selectedMinutesToday: Minutes already selected for current rotation day
 *     - lastResetDate: Date when counter was last reset
 *     - calculatedAt: Timestamp when intent was calculated
 *     - stale: Flag indicating if recalculation needed
 *
 * Main Methods:
 *   - getIntent(): Get cached or calculated intent
 *   - calculateIntent(): Query repos, compute distribution
 *   - calculateThreeDayDistribution(): Divide content fairly
 *   - trackSelectedMinutes(): Update daily budget
 *   - canAddMoreContent(): Check if capacity remains
 *   - invalidateHoliday(): Mark entry as stale
 *   - clear(): Reset entire cache
 *
 * USAGE EXAMPLE:
 * ---------------
 * // Get distribution plan for Christmas
 * const intent = holidayIntentCacheManager.getIntent("holiday-christmas");
 * // Returns: { threeDayDistribution: 120, selectedMinutesToday: 0, ... }
 *
 * // Check if we can add 45 minutes of content
 * if (holidayIntentCacheManager.canAddMoreContent("holiday-christmas", dateString)) {
 *   // Add the content...
 *   holidayIntentCacheManager.trackSelectedMinutes("holiday-christmas", 45, dateString);
 * }
 *
 * // If Christmas content is updated in database
 * holidayIntentCacheManager.invalidateHoliday("holiday-christmas");
 * // Next getIntent() call will recalculate from database
 *
 * ============================================================================
 */

import { movieRepository } from "../repositories/movieRepository.js";
import { showRepository } from "../repositories/showRepository.js";

/**
 * HolidayIntentCacheManager
 * Manages lazy-loaded cache of holiday content distribution intents
 * Uses invalidation-based strategy: only recalculate when accessed if stale
 * Distributes holiday content across a 3-day rotation (day 1, 2, 3, repeat)
 * Target: 4-5 hours per day during season span, unlimited on actual holiday dates
 *
 * TIMEZONE HANDLING (HYBRID APPROACH):
 * ===================================
 * Rotation cycles are UTC-based for consistency and caching simplicity.
 * When passing dateString parameters, use the local calendar date as the user perceives it.
 * Example: If user is in EST and it's midnight Feb 1st local time, pass "2025-02-01"
 * even though UTC might be "2025-02-01T05:00:00Z".
 *
 * Why this works:
 * - Rotation is deterministic based on calendar date
 * - Cache remains synchronized regardless of timezone
 * - Caller passes what they see locally; manager handles UTC internally
 *
 * dateString Format: ISO date string (YYYY-MM-DD) representing the local calendar date
 * NOT a full ISO 8601 timestamp; time component is ignored/optional
 */
class HolidayIntentCacheManager {
  private cache: Map<string, HolidayIntent> = new Map();

  /**
   * Validates dateString format
   * @param dateString The date string to validate
   * @returns True if format is valid YYYY-MM-DD
   */
  private validateDateString(dateString: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }

  /**
   * Gets the holiday intent for a holiday tag
   * Lazy-loads and calculates on first access
   * Recalculates only if invalidated and then accessed
   * @param holidayTagId The holiday tag ID
   * @returns The HolidayIntent for this holiday
   */
  getIntent(holidayTagId: string): HolidayIntent {
    // Return cached value if it exists and is not stale
    const cached = this.cache.get(holidayTagId);
    if (cached && !cached.stale) {
      return cached;
    }

    // Calculate or recalculate the intent
    const intent = this.calculateIntent(holidayTagId);
    this.cache.set(holidayTagId, intent);
    return intent;
  }

  /**
   * Calculates the holiday intent for a holiday tag
   * Determines total runtime and distributes across 3-day rotation
   * @param holidayTagId The holiday tag ID
   * @returns Newly calculated HolidayIntent
   */
  private calculateIntent(holidayTagId: string): HolidayIntent {
    // Get total runtime of all holiday content (movies + shows)
    let movieMinutes = 0;
    let showMinutes = 0;

    try {
      movieMinutes = movieRepository.getTotalMinutesByHolidayTag(holidayTagId);
      showMinutes = showRepository.getTotalMinutesByHolidayTag(holidayTagId);
    } catch (error) {
      console.error(
        `Error calculating intent for holiday ${holidayTagId}:`,
        error,
      );
      // Fall back to 0 minutes if repository fails
      movieMinutes = 0;
      showMinutes = 0;
    }

    const totalAvailableMinutes = movieMinutes + showMinutes;

    // Calculate 3-day distribution
    const threeDayDistribution = this.calculateThreeDayDistribution(
      totalAvailableMinutes,
    );

    // Calculate the rotation day for today (use local date, not UTC)
    // This ensures consistency with how callers pass dates as local calendar dates
    const today = new Date();
    const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const initialRotationDay = this.getRotationDay(localDateString) as
      | 1
      | 2
      | 3;

    return {
      holidayTagId,
      totalAvailableMinutes,
      threeDayDistribution,
      currentRotationDay: initialRotationDay,
      selectedMinutesToday: 0,
      lastResetDate: localDateString,
      calculatedAt: Date.now(),
      stale: false,
    };
  }

  /**
   * Distributes total minutes across a 3-day rotation
   * Aims for 4-5 hours (240-300 minutes) per day
   * Spreads evenly if less content available
   * @param totalMinutes Total available minutes
   * @returns [day1Minutes, day2Minutes, day3Minutes]
   */
  private calculateThreeDayDistribution(
    totalMinutes: number,
  ): [number, number, number] {
    const targetPerDay = 270; // 4.5 hours middle of 4-5 hour range
    const threeDayTotal = targetPerDay * 3; // 810 minutes ideal

    // If we have less content than the 3-day target, spread what we have evenly
    if (totalMinutes <= threeDayTotal) {
      const perDay = Math.floor(totalMinutes / 3);
      const remainder = totalMinutes % 3;

      // Distribute remainder starting with day 1
      const day1 = perDay + (remainder > 0 ? 1 : 0);
      const day2 = perDay + (remainder > 1 ? 1 : 0);
      const day3 = perDay;

      return [day1, day2, day3];
    }

    // If we have enough or more than 3-day target, cap at target
    return [targetPerDay, targetPerDay, targetPerDay];
  }

  /**
   * Gets the target minutes for today based on rotation day
   * Updates rotation if we've moved to a new day
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @returns Minutes of holiday content that should play today
   * @throws Error if dateString format is invalid
   */
  getTodayTargetMinutes(holidayTagId: string, dateString: string): number {
    if (!this.validateDateString(dateString)) {
      throw new Error(
        `Invalid dateString format: "${dateString}". Expected YYYY-MM-DD`,
      );
    }
    const intent = this.ensureCurrentRotation(holidayTagId, dateString);
    return intent.threeDayDistribution[intent.currentRotationDay - 1];
  }

  /**
   * Gets which day of the 3-day rotation this date falls on
   * Cycles: day 1 → day 2 → day 3 → day 1 ...
   * Uses UTC epoch for deterministic, timezone-independent calculation
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @returns 1, 2, or 3
   */
  private getRotationDay(dateString: string): number {
    // Parse dateString explicitly as UTC to avoid timezone ambiguity
    const [year, month, day] = dateString.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const epochDate = new Date(Date.UTC(1970, 0, 1));

    // Calculate days since epoch
    const daysSinceEpoch = Math.floor(
      (utcDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (daysSinceEpoch % 3) + 1; // Returns 1, 2, or 3
  }

  /**
   * Ensures rotation state is up-to-date for the given date
   * Updates rotation day, resets daily counter if date has changed
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @returns The updated HolidayIntent
   */
  private ensureCurrentRotation(
    holidayTagId: string,
    dateString: string,
  ): HolidayIntent {
    const intent = this.getIntent(holidayTagId);
    if (intent.lastResetDate !== dateString) {
      intent.currentRotationDay = this.getRotationDay(dateString) as 1 | 2 | 3;
      intent.selectedMinutesToday = 0;
      intent.lastResetDate = dateString;
    }
    return intent;
  }

  /**
   * Checks if we can add more holiday content today
   * Compares selected minutes against today's target
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @returns True if we haven't hit today's target yet
   * @throws Error if dateString format is invalid
   */
  canAddMoreContent(holidayTagId: string, dateString: string): boolean {
    if (!this.validateDateString(dateString)) {
      throw new Error(
        `Invalid dateString format: "${dateString}". Expected YYYY-MM-DD`,
      );
    }
    const intent = this.ensureCurrentRotation(holidayTagId, dateString);
    const targetToday =
      intent.threeDayDistribution[intent.currentRotationDay - 1];
    return intent.selectedMinutesToday < targetToday;
  }

  /**
   * Tracks that we've selected holiday content
   * Accumulates selected minutes for today
   * @param holidayTagId The holiday tag ID
   * @param minutes Duration selected (must be >= 0)
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @throws Error if dateString format is invalid or minutes is negative
   */
  trackSelectedMinutes(
    holidayTagId: string,
    minutes: number,
    dateString: string,
  ): void {
    if (!this.validateDateString(dateString)) {
      throw new Error(
        `Invalid dateString format: "${dateString}". Expected YYYY-MM-DD`,
      );
    }
    if (minutes < 0) {
      throw new Error(
        `Invalid minutes value: ${minutes}. Minutes must be >= 0`,
      );
    }
    const intent = this.ensureCurrentRotation(holidayTagId, dateString);
    intent.selectedMinutesToday += minutes;
  }

  /**
   * Gets how much more content can be selected today
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string (YYYY-MM-DD) as local calendar date
   * @returns Remaining minutes available today
   * @throws Error if dateString format is invalid
   */
  getRemainingMinutesToday(holidayTagId: string, dateString: string): number {
    if (!this.validateDateString(dateString)) {
      throw new Error(
        `Invalid dateString format: "${dateString}". Expected YYYY-MM-DD`,
      );
    }
    const intent = this.ensureCurrentRotation(holidayTagId, dateString);
    const targetToday =
      intent.threeDayDistribution[intent.currentRotationDay - 1];
    return Math.max(0, targetToday - intent.selectedMinutesToday);
  }

  /**
   * Invalidates a single holiday's cache
   * Marks it stale so it will be recalculated on next access
   * @param holidayTagId The holiday tag ID to invalidate
   */
  invalidateHoliday(holidayTagId: string): void {
    const cached = this.cache.get(holidayTagId);
    if (cached) {
      cached.stale = true;
    }
  }

  /**
   * Invalidates entire cache
   * Used when major content changes occur
   */
  invalidateAll(): void {
    for (const intent of this.cache.values()) {
      intent.stale = true;
    }
  }

  /**
   * Clears all cached intents and resets cache
   * Useful for testing or complete reset
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics for debugging
   * @returns Object with cache size and stale count
   */
  getStats(): {
    cacheSize: number;
    staleCount: number;
  } {
    let staleCount = 0;
    for (const intent of this.cache.values()) {
      if (intent.stale) {
        staleCount++;
      }
    }
    return {
      cacheSize: this.cache.size,
      staleCount,
    };
  }
}

// Export singleton instance
export const holidayIntentCacheManager = new HolidayIntentCacheManager();
