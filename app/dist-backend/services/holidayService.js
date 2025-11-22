"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadHolidays = loadHolidays;
exports.updateCurrentHolidays = updateCurrentHolidays;
exports.getAllHolidays = getAllHolidays;
exports.getCurrentHolidays = getCurrentHolidays;
exports.getActiveHolidayTags = getActiveHolidayTags;
exports.hasActiveHolidays = hasActiveHolidays;
exports.getActiveHolidayNames = getActiveHolidayNames;
exports.getActiveHolidaysFromDB = getActiveHolidaysFromDB;
exports.initializeHolidayService = initializeHolidayService;
const holiday_1 = require("../models/holiday");
const tagTypes_1 = require("../models/const/tagTypes");
const tag_1 = require("../models/tag");
const tagsRepository_1 = require("../repositories/tagsRepository");
const utilities_1 = require("../utils/utilities");
let holidays = [];
let currentHolidays = [];
let activeHolidayTags = [];
/**
 * Load all holidays from the database
 */
async function loadHolidays() {
    // Load holidays as tags with type "Holiday" from tagsRepository
    const holidayTags = tagsRepository_1.tagRepository.findByType('Holiday');
    if (!holidayTags || holidayTags.length === 0) {
        console.log('No Holidays Found');
        holidays = [];
        return;
    }
    // Convert Tag objects to Holiday objects
    holidays = holidayTags.map(tag => new holiday_1.Holiday(tag.name, tag.tagId, tag.holidayDates || [], tag.exclusionTags || [], tag.seasonStartDate, tag.seasonEndDate));
    console.log(holidays.length + ' Holidays loaded');
    // Immediately check for active holidays
    updateCurrentHolidays();
}
/**
 * Update the current active holidays based on today's date
 */
function updateCurrentHolidays() {
    const today = new Date();
    currentHolidays = holidays.filter(holiday => {
        // Check season-based holidays first
        if (holiday.seasonStartDate && holiday.seasonEndDate) {
            return (0, utilities_1.isDateInRange)(today, holiday.seasonStartDate, holiday.seasonEndDate);
        }
        // Check specific date holidays
        if (holiday.holidayDates && holiday.holidayDates.length > 0) {
            return (0, utilities_1.isDateInHolidayDates)(today, holiday.holidayDates);
        }
        return false;
    });
    // Update active holiday tags
    activeHolidayTags = currentHolidays.map(holiday => new tag_1.Tag(holiday.tagId, holiday.name, tagTypes_1.TagType.Holiday, holiday.holidayDates, holiday.exclusionTags, holiday.seasonStartDate, holiday.seasonEndDate));
    if (currentHolidays.length > 0) {
        console.log(`[Holiday Service] Active holidays: ${currentHolidays.map(h => h.name).join(', ')}`);
    }
}
/**
 * Get all loaded holidays
 */
function getAllHolidays() {
    return holidays;
}
/**
 * Get currently active holidays
 */
function getCurrentHolidays() {
    return currentHolidays;
}
/**
 * Get active holiday tags for media selection
 */
function getActiveHolidayTags() {
    return activeHolidayTags;
}
/**
 * Check if any holidays are currently active
 */
function hasActiveHolidays() {
    return currentHolidays.length > 0;
}
/**
 * Get holiday names that are currently active
 */
function getActiveHolidayNames() {
    return currentHolidays.map(holiday => holiday.name);
}
/**
 * Get holidays that are either in season or whose holiday date is right now
 * This function calls the database directly through tagRepository with SQL date filtering
 */
function getActiveHolidaysFromDB() {
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
    const activeHolidayTags = tagsRepository_1.tagRepository.findAllTodaysHolidays(currentDateTime);
    if (!activeHolidayTags || activeHolidayTags.length === 0) {
        return [];
    }
    // Convert Tag objects to Holiday objects (no filtering needed since SQL already filtered)
    const activeHolidays = activeHolidayTags.map(tag => new holiday_1.Holiday(tag.name, tag.tagId, tag.holidayDates || [], tag.exclusionTags || [], tag.seasonStartDate, tag.seasonEndDate));
    return activeHolidays;
}
/**
 * Initialize the holiday service - call this on app startup
 */
async function initializeHolidayService() {
    await loadHolidays();
    // Set up periodic updates (check for new holidays every hour)
    setInterval(() => {
        updateCurrentHolidays();
    }, 60 * 60 * 1000); // 1 hour
}
