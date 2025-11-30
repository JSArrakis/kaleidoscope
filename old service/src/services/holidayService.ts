import { Holiday } from '../models/holiday';
import { TagType } from '../models/const/tagTypes';
import { Tag } from '../models/tag';
import { tagRepository } from '../repositories/tagsRepository';
import {
  parseMonthDayToCurrentYear,
  formatDateToISO,
  formatDateToISODate,
  isDateInRange,
  isDateInHolidayDates,
} from '../utils/utilities';

let holidays: Holiday[] = [];
let currentHolidays: Holiday[] = [];
let activeHolidayTags: Tag[] = [];

/**
 * Load all holidays from the database
 */
export async function loadHolidays(): Promise<void> {
  // Load holidays as tags with type "Holiday" from tagsRepository
  const holidayTags = tagRepository.findByType('Holiday');

  if (!holidayTags || holidayTags.length === 0) {
    console.log('No Holidays Found');
    holidays = [];
    return;
  }

  // Convert Tag objects to Holiday objects
  holidays = holidayTags.map(
    tag =>
      new Holiday(
        tag.name,
        tag.tagId,
        tag.holidayDates || [],
        tag.exclusionTags || [],
        tag.seasonStartDate,
        tag.seasonEndDate,
      ),
  );

  console.log(holidays.length + ' Holidays loaded');

  // Immediately check for active holidays
  updateCurrentHolidays();
}

/**
 * Update the current active holidays based on today's date
 */
export function updateCurrentHolidays(): void {
  const today = new Date();

  currentHolidays = holidays.filter(holiday => {
    // Check season-based holidays first
    if (holiday.seasonStartDate && holiday.seasonEndDate) {
      return isDateInRange(
        today,
        holiday.seasonStartDate,
        holiday.seasonEndDate,
      );
    }

    // Check specific date holidays
    if (holiday.holidayDates && holiday.holidayDates.length > 0) {
      return isDateInHolidayDates(today, holiday.holidayDates);
    }

    return false;
  });

  // Update active holiday tags
  activeHolidayTags = currentHolidays.map(
    holiday =>
      new Tag(
        holiday.tagId,
        holiday.name,
        TagType.Holiday,
        holiday.holidayDates,
        holiday.exclusionTags,
        holiday.seasonStartDate,
        holiday.seasonEndDate,
      ),
  );

  if (currentHolidays.length > 0) {
    console.log(
      `[Holiday Service] Active holidays: ${currentHolidays.map(h => h.name).join(', ')}`,
    );
  }
}

/**
 * Get all loaded holidays
 */
export function getAllHolidays(): Holiday[] {
  return holidays;
}

/**
 * Get currently active holidays
 */
export function getCurrentHolidays(): Holiday[] {
  return currentHolidays;
}

/**
 * Get active holiday tags for media selection
 */
export function getActiveHolidayTags(): Tag[] {
  return activeHolidayTags;
}

/**
 * Check if any holidays are currently active
 */
export function hasActiveHolidays(): boolean {
  return currentHolidays.length > 0;
}

/**
 * Get holiday names that are currently active
 */
export function getActiveHolidayNames(): string[] {
  return currentHolidays.map(holiday => holiday.name);
}

/**
 * Get holidays that are either in season or whose holiday date is right now
 * This function calls the database directly through tagRepository with SQL date filtering
 */
export function getActiveHolidaysFromDB(): Holiday[] {
  const today = new Date();

  // Format current datetime for database query using local timezone
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');
  const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  // Get only active holidays from the database using SQL filtering
  const activeHolidayTags =
    tagRepository.findAllTodaysHolidays(currentDateTime);

  if (!activeHolidayTags || activeHolidayTags.length === 0) {
    return [];
  }

  // Convert Tag objects to Holiday objects (no filtering needed since SQL already filtered)
  const activeHolidays = activeHolidayTags.map(
    tag =>
      new Holiday(
        tag.name,
        tag.tagId,
        tag.holidayDates || [],
        tag.exclusionTags || [],
        tag.seasonStartDate,
        tag.seasonEndDate,
      ),
  );

  return activeHolidays;
}

/**
 * Initialize the holiday service - call this on app startup
 */
export async function initializeHolidayService(): Promise<void> {
  await loadHolidays();

  // Set up periodic updates (check for new holidays every hour)
  setInterval(
    () => {
      updateCurrentHolidays();
    },
    60 * 60 * 1000,
  ); // 1 hour
}
