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
 *     - totalAvailableMinutes: All holiday content duration
 *     - holidayDates: Specific dates (e.g., Dec 25)
 *     - seasonStartDate: Season begins (e.g., Nov 1)
 *     - seasonEndDate: Season ends (e.g., Dec 31)
 *     - threeDayDistribution: Minutes per day in 3-day cycle
 *     - selectedMinutesToday: Already-selected minutes today
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
 * if (holidayIntentCacheManager.canAddMoreContent("holiday-christmas", 45)) {
 *   // Add the content...
 *   holidayIntentCacheManager.trackSelectedMinutes("holiday-christmas", 45);
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
 */
class HolidayIntentCacheManager {
  private cache: Map<string, HolidayIntent> = new Map();

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
   *
   * NOTE: Requires movieRepository.getTotalMinutesByHolidayTag() and
   *       showRepository.getTotalMinutesByHolidayTag() to be implemented
   */
  private calculateIntent(holidayTagId: string): HolidayIntent {
    // Get total runtime of all holiday content (movies + shows)
    // TODO: Implement getTotalMinutesByHolidayTag() in repositories
    const movieMinutes =
      movieRepository.getTotalMinutesByHolidayTag(holidayTagId);
    const showMinutes =
      showRepository.getTotalMinutesByHolidayTag(holidayTagId);
    const totalAvailableMinutes = movieMinutes + showMinutes;

    // Calculate 3-day distribution
    const threeDayDistribution = this.calculateThreeDayDistribution(
      totalAvailableMinutes
    );

    // Initialize rotation (will update when we check today's rotation day)
    const today = new Date().toISOString().split("T")[0];

    return {
      holidayTagId,
      totalAvailableMinutes,
      threeDayDistribution,
      currentRotationDay: 1,
      lastRotationDate: today,
      selectedMinutesToday: 0,
      lastResetDate: today,
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
    totalMinutes: number
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
   * @param dateString ISO date string (e.g., "2025-12-08")
   * @returns Minutes of holiday content that should play today
   */
  getTodayTargetMinutes(holidayTagId: string, dateString: string): number {
    const intent = this.getIntent(holidayTagId);

    // Check if we've moved to a new day
    if (intent.lastResetDate !== dateString) {
      // Update rotation day
      intent.currentRotationDay = this.getRotationDay(dateString) as 1 | 2 | 3;
      intent.lastRotationDate = dateString;
      intent.selectedMinutesToday = 0;
      intent.lastResetDate = dateString;
    }

    // Return target minutes for today's rotation day
    return intent.threeDayDistribution[intent.currentRotationDay - 1];
  }

  /**
   * Gets which day of the 3-day rotation this date falls on
   * Cycles: day 1 → day 2 → day 3 → day 1 ...
   * @param dateString ISO date string
   * @returns 1, 2, or 3
   */
  private getRotationDay(dateString: string): number {
    // Use epoch time to calculate which rotation day we're on
    const date = new Date(dateString);
    const epoch = new Date("1970-01-01");
    const daysSinceEpoch = Math.floor(
      (date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (daysSinceEpoch % 3) + 1; // Returns 1, 2, or 3
  }

  /**
   * Checks if we can add more holiday content today
   * Compares selected minutes against today's target
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string
   * @returns True if we haven't hit today's target yet
   */
  canAddMoreContent(holidayTagId: string, dateString: string): boolean {
    const intent = this.getIntent(holidayTagId);

    // Update rotation if needed
    if (intent.lastResetDate !== dateString) {
      intent.currentRotationDay = this.getRotationDay(dateString) as 1 | 2 | 3;
      intent.selectedMinutesToday = 0;
      intent.lastResetDate = dateString;
    }

    const targetToday =
      intent.threeDayDistribution[intent.currentRotationDay - 1];
    return intent.selectedMinutesToday < targetToday;
  }

  /**
   * Tracks that we've selected holiday content
   * Accumulates selected minutes for today
   * @param holidayTagId The holiday tag ID
   * @param minutes Duration selected
   * @param dateString ISO date string
   */
  trackSelectedMinutes(
    holidayTagId: string,
    minutes: number,
    dateString: string
  ): void {
    const intent = this.getIntent(holidayTagId);

    // Reset counter if we've moved to a new day
    if (intent.lastResetDate !== dateString) {
      intent.currentRotationDay = this.getRotationDay(dateString) as 1 | 2 | 3;
      intent.selectedMinutesToday = 0;
      intent.lastResetDate = dateString;
    }

    intent.selectedMinutesToday += minutes;
  }

  /**
   * Gets how much more content can be selected today
   * @param holidayTagId The holiday tag ID
   * @param dateString ISO date string
   * @returns Remaining minutes available today
   */
  getRemainingMinutesToday(holidayTagId: string, dateString: string): number {
    const intent = this.getIntent(holidayTagId);

    // Update if needed
    if (intent.lastResetDate !== dateString) {
      intent.currentRotationDay = this.getRotationDay(dateString) as 1 | 2 | 3;
      intent.selectedMinutesToday = 0;
      intent.lastResetDate = dateString;
    }

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
   * @returns Object with cache size, stale count, and distribution info
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
