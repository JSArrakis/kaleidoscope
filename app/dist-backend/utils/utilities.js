"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomMedia = getRandomMedia;
exports.ManageProgression = ManageProgression;
exports.ReduceProgression = ReduceProgression;
exports.incrementProgression = incrementProgression;
exports.addProgression = addProgression;
exports.keyNormalizer = keyNormalizer;
exports.deepCopy = deepCopy;
exports.getMediaDuration = getMediaDuration;
exports.createMosaicKey = createMosaicKey;
exports.parseMonthDayToCurrentYear = parseMonthDayToCurrentYear;
exports.formatDateToISO = formatDateToISO;
exports.formatDateToISODate = formatDateToISODate;
exports.parseToISODateTime = parseToISODateTime;
exports.isDateInRange = isDateInRange;
exports.isDateInHolidayDates = isDateInHolidayDates;
exports.convertMMDDToDateTime = convertMMDDToDateTime;
exports.convertDateTimeToMMDD = convertDateTimeToMMDD;
exports.isDateInHolidayDateTimes = isDateInHolidayDateTimes;
const mediaProgression_1 = require("../models/mediaProgression");
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const fs = __importStar(require("fs"));
function getRandomMedia(objects) {
    const randomIndex = Math.floor(Math.random() * objects.length);
    return objects[randomIndex];
}
function ManageProgression(title, type, progression, show, numOfEpsRequested) {
    let episodeNumbers = [];
    // To give better context, each MediaProgression object keeps the state of progression of shows in the siloed context of each collection (that contains shows) or for the main stream based on environment
    // Add progression if it doesnt already exist, or if the any shows present in the MediaProgression object are not present, add them
    addProgression(title, type, progression, show);
    // Theres a potential that multiple episodes played back to back in a block under certain circumstances, so we need to increment the progression for each episode requested
    for (let i = 0; i < numOfEpsRequested; i++) {
        // Get the contexual progression
        let progContext = progression.filter(prog => prog.title === title)[0];
        // Get the episode number for the show that is being selected to be played
        let episode = progContext.shows.filter(item => item.mediaItemId === show.mediaItemId)[0].episode;
        // Add the episode number to the array of episodes to be played. Subsequent episodes might not necessarily be just the next number. If the first episode in the array is the
        // last episode of available episodes, the next episode will be the first episode of the show
        episodeNumbers.push(episode);
        // Increment the progression for the show that was just played
        // This makes the next episode available as the next episode to be played or restarts the series if the last episode is what is currently listed in the progression
        incrementProgression(progression, title, show);
    }
    return episodeNumbers;
}
function ReduceProgression(title, showLoadTitle, progression) {
    progression
        .filter(pitem => pitem.title === title)[0]
        .shows.filter(fshow => fshow.mediaItemId === showLoadTitle)
        .forEach(sitem => {
        sitem.episode = sitem.episode - 1;
    });
}
function incrementProgression(progression, title, show) {
    progression
        .filter(pitem => pitem.title === title)[0]
        .shows // Find matching show title in the progression object
        .filter(fshow => fshow.mediaItemId === show.mediaItemId)
        // Increment the episode number for each show that shares the load title (there should only be one)
        .forEach(sitem => {
        //Increment the episode number for the show
        sitem.episode++;
        // If after incrementing the epsiode number, the episode number is greater than the total number of episodes, reset the episode number to 1 to restart the series
        if (sitem.episode > show.episodeCount) {
            sitem.episode = 1;
        }
    });
}
function addProgression(title, type, progression, show) {
    // Show progression is the object that will be added to the MediaProgression object it contains the show title and the episode number to be played next
    // The the first episode is always 1
    let showProg = new mediaProgression_1.ShowProgression(show.mediaItemId, 1);
    // MediaProgression is an object that contains the progression of shows based on context. Each collection, or the main stream for an environment will have a MediaProgression object
    let progItem = new mediaProgression_1.MediaProgression(title, type, [showProg]);
    // Check if the title is already in the progression array
    let progressionItem = progression.filter(prog => prog.title === title);
    // If the MediaProgression (collection, or main stream) is not in the progression array, add it to the array
    if (progressionItem.length === 0) {
        progression.push(progItem);
    }
    // Check if the show is already in the listed shows for the target MediaProgression object that we just added.
    // The reason we do this instead of adding the show to the just created MediaProgression object is because there is a chance the show did not exist in the collection
    // or main stream when the MediaProgression object originally was created.
    let selectedShowProgression = progression
        .filter(prog => prog.title === title)[0]
        .shows.filter(selShow => selShow.mediaItemId == show.mediaItemId);
    // If the show isnt present, add it to the MediaProgression object
    if (selectedShowProgression.length === 0) {
        progression.filter(pitem => pitem.title === title)[0].shows.push(showProg);
    }
}
function keyNormalizer(key) {
    return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}
function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // primitive value or null
    }
    if (Array.isArray(obj)) {
        return obj.map(deepCopy); // array
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = deepCopy(value); // object
    }
    return result;
}
async function getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
        // First check if the file exists
        if (!fs.existsSync(filePath)) {
            reject(new Error(`Media file not found: ${filePath}`));
            return;
        }
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (!err) {
                const durationInSeconds = Math.round(Number(metadata.format.duration)) || 0;
                resolve(durationInSeconds);
            }
            else {
                // Provide more descriptive error messages
                if (err.message && err.message.includes('No such file')) {
                    reject(new Error(`Media file not found: ${filePath}`));
                }
                else if (err.message && err.message.includes('Invalid data')) {
                    reject(new Error(`Invalid media file or unsupported format: ${filePath}`));
                }
                else {
                    reject(new Error(`Failed to analyze media file: ${filePath}. ${err.message || err}`));
                }
            }
        });
    });
}
function createMosaicKey(genres) {
    return genres
        .map(genre => genre.toLowerCase())
        .sort()
        .join('-');
}
function parseMonthDayToCurrentYear(monthDay) {
    const currentYear = new Date().getFullYear();
    // Handle formats like "--12-25" or "12-25"
    const cleanMonthDay = monthDay.startsWith('--')
        ? monthDay.slice(2)
        : monthDay;
    return new Date(`${currentYear}-${cleanMonthDay}`);
}
/**
 * Format a Date object to ISO datetime string (YYYY-MM-DD HH:MM:SS) in local time
 */
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
/**
 * Format a Date object to ISO date string (YYYY-MM-DD) in local time
 */
function formatDateToISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Parse various date formats to ISO datetime string
 * Supports: YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, --MM-DD, MM-DD
 */
function parseToISODateTime(dateString, defaultTime = '00:00:00') {
    if (!dateString)
        return null;
    try {
        const currentYear = new Date().getFullYear();
        // Handle "--12-25" or "12-25" format (month-day only)
        if (dateString.startsWith('--') && dateString.length === 7) {
            const cleanMonthDay = dateString.slice(2);
            return `${currentYear}-${cleanMonthDay} ${defaultTime}`;
        }
        if (dateString.match(/^\d{2}-\d{2}$/) && dateString.length === 5) {
            return `${currentYear}-${dateString} ${defaultTime}`;
        }
        // Handle "YYYY-MM-DD" format
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return `${dateString} ${defaultTime}`;
        }
        // Handle "YYYY-MM-DD HH:MM:SS" format
        if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            return dateString;
        }
        // Try to parse as Date and format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date format: ${dateString}`);
            return null;
        }
        return formatDateToISO(date);
    }
    catch (error) {
        console.warn(`Error parsing date ${dateString}:`, error);
        return null;
    }
}
/**
 * Check if current date/time is within the specified date range
 * Supports both date-only and datetime comparisons
 */
function isDateInRange(currentDate, startDate, endDate) {
    if (!startDate || !endDate)
        return false;
    try {
        const current = formatDateToISO(currentDate);
        // Handle date-only comparison (compare just the date part)
        if (startDate.length === 10 && endDate.length === 10) {
            const currentDateOnly = formatDateToISODate(currentDate);
            return currentDateOnly >= startDate && currentDateOnly <= endDate;
        }
        // Handle datetime comparison
        return current >= startDate && current <= endDate;
    }
    catch (error) {
        console.warn(`Error comparing dates:`, error);
        return false;
    }
}
/**
 * Check if current date matches any of the holiday dates in the array
 */
function isDateInHolidayDates(currentDate, holidayDates) {
    if (!holidayDates || holidayDates.length === 0)
        return false;
    const currentDateStr = formatDateToISODate(currentDate);
    const currentYear = currentDate.getFullYear();
    return holidayDates.some(holidayDate => {
        if (!holidayDate)
            return false;
        // Handle "--MM-DD" format
        if (holidayDate.startsWith('--') && holidayDate.length === 7) {
            const cleanMonthDay = holidayDate.slice(2);
            const fullDate = `${currentYear}-${cleanMonthDay}`;
            return currentDateStr === fullDate;
        }
        // Handle "MM-DD" format
        if (holidayDate.match(/^\d{2}-\d{2}$/) && holidayDate.length === 5) {
            const fullDate = `${currentYear}-${holidayDate}`;
            return currentDateStr === fullDate;
        }
        // Handle "YYYY-MM-DD" format
        if (holidayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return currentDateStr === holidayDate;
        }
        // Handle other formats by parsing and comparing date part
        try {
            const parsedDate = new Date(holidayDate);
            if (!isNaN(parsedDate.getTime())) {
                return formatDateToISODate(parsedDate) === currentDateStr;
            }
        }
        catch (error) {
            console.warn(`Error parsing holiday date ${holidayDate}:`, error);
        }
        return false;
    });
}
/**
 * Convert MM-DD format to DATETIME for storage (using current year)
 */
function convertMMDDToDateTime(mmdd) {
    if (!mmdd)
        throw new Error('MM-DD string cannot be empty');
    // Clean the input - remove any leading '--' if present
    const cleanMMDD = mmdd.startsWith('--') ? mmdd.slice(2) : mmdd;
    // Validate MM-DD format
    if (!cleanMMDD.match(/^\d{2}-\d{2}$/)) {
        throw new Error(`Invalid MM-DD format: ${mmdd}. Expected format: MM-DD or --MM-DD`);
    }
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${cleanMMDD} 00:00:00`;
}
/**
 * Convert DATETIME back to MM-DD format for API responses
 */
function convertDateTimeToMMDD(datetime) {
    if (!datetime)
        throw new Error('DateTime string cannot be empty');
    try {
        // Extract MM-DD from YYYY-MM-DD HH:MM:SS format
        const dateMatch = datetime.match(/^\d{4}-(\d{2}-\d{2})/);
        if (dateMatch) {
            return dateMatch[1]; // Return just the MM-DD part
        }
        // Try parsing as Date if the format is different
        const date = new Date(datetime);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid datetime format: ${datetime}`);
        }
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    }
    catch (error) {
        throw new Error(`Error converting datetime to MM-DD: ${datetime} - ${error}`);
    }
}
/**
 * Check if current date matches any of the holiday dates stored as DATETIME
 */
function isDateInHolidayDateTimes(currentDate, holidayDateTimes) {
    if (!holidayDateTimes || holidayDateTimes.length === 0)
        return false;
    const currentMMDD = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return holidayDateTimes.some(datetime => {
        try {
            const holidayMMDD = convertDateTimeToMMDD(datetime);
            return currentMMDD === holidayMMDD;
        }
        catch (error) {
            console.warn(`Error converting holiday datetime ${datetime}:`, error);
            return false;
        }
    });
}
