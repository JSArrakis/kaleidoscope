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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cycleCheck = cycleCheck;
exports.startBackgroundProcess = startBackgroundProcess;
exports.stopBackgroundProcess = stopBackgroundProcess;
exports.calculateDelayToNextInterval = calculateDelayToNextInterval;
exports.setEndOfDayMarker = setEndOfDayMarker;
exports.setTomorrow = setTomorrow;
exports.validateUpcomingMediaFiles = validateUpcomingMediaFiles;
const moment_1 = __importDefault(require("moment"));
const fs = __importStar(require("fs"));
const streamConstructor_1 = require("./streamConstructor.cjs");
const streamMan = __importStar(require("./streamManager.cjs"));
const streamRequest_1 = require("../models/streamRequest.cjs");
const streamTypes_1 = require("../models/enum/streamTypes.cjs");
const mediaService_1 = require("./mediaService.cjs");
const vlcService = __importStar(require("./vlcService.cjs"));
const intervalInSeconds = 300;
let endOfDayMarker = 0;
let tomorrow = 0;
let initialStart = true;
let currentHolidays = []; // This will hold the current holidays, if any
let cachedTimedMediaItems = []; // Global cache of timed media items
let cycleCheckTimeout = null; // Store timeout ID to prevent memory leak
function calculateDelayToNextInterval(intervalInSeconds) {
    // Get the current Unix timestamp
    const now = (0, moment_1.default)().unix();
    console.log(`Current Unix Timestamp: ${now}`);
    // Calculate the seconds until the next interval
    // The interval in seconds equals 5 minutes (300 seconds)
    const secondsToNextInterval = intervalInSeconds - (now % intervalInSeconds);
    console.log(`Seconds to next interval: ${secondsToNextInterval}`);
    return secondsToNextInterval * 1000; // Convert seconds to milliseconds
}
function setEndOfDayMarker() {
    endOfDayMarker = (0, moment_1.default)().set({ hour: 23, minute: 30, second: 0 }).unix();
}
function setTomorrow() {
    tomorrow = (0, moment_1.default)()
        .add(1, 'days')
        .set({ hour: 0, minute: 0, second: 0 })
        .unix();
}
function validateUpcomingMediaFiles(currentUnixTimestamp) {
    // Clean up old cached items to prevent memory leak
    // Remove items that have already passed (older than current time)
    cachedTimedMediaItems = cachedTimedMediaItems.filter(item => item.startTime > currentUnixTimestamp);
    // Get the time window for validation (current time + interval)
    const validationEndTime = currentUnixTimestamp + intervalInSeconds;
    // Filter cached items that should start within the current interval
    const upcomingItems = cachedTimedMediaItems.filter(item => item.startTime >= currentUnixTimestamp &&
        item.startTime <= validationEndTime);
    // Validate each upcoming media file
    upcomingItems.forEach(item => {
        try {
            // TODO: When a file is missing we need to add or rearrange buffers to cover the missing file
            // to keep the stream seamless
            // If it is a show that is missing we will have to add more shorts or music videos than we previously would for a normal buffer to fill the time
            // If it is a movie that is missing we should fill as much as we can with shows at the proper time points (:00 or :30) keeping in mind to stick to the same tags that the movie had.
            // If there are no shows that have the same tags use facets and find the closest facet distance matching and the closest age group etc until the gap is filled.
            // The first 30 minutes will have to be just on theme shorts and music videos with an appropriate smattering of commercials. This is due to the media block already starting. And commercial run time would have already started.
            // So the goal is to just keep everything on the time point. We have some time to reconfigure the stream to account for the new gap because the buffer that was meant to play after the missing media should be playing now in sequence.
            // But we should also do an emergency check of all the buffer media in this block to make sure there arent any more gaps that need to be addressed.
            if (!fs.existsSync(item.path)) {
                console.log(`TODO: Set adjustments on missing file - ${item.mediaType}: "${item.title}" ` +
                    `from block "${item.blockTitle}" at path: ${item.path} ` +
                    `(scheduled for ${new Date(item.startTime * 1000).toISOString()})`);
            }
        }
        catch (error) {
            console.log(`TODO: Set adjustments on missing file - Error checking ${item.mediaType}: "${item.title}" ` +
                `from block "${item.blockTitle}" at path: ${item.path} ` +
                `(Error: ${error})`);
        }
    });
    // Log validation summary if there were upcoming items
    if (upcomingItems.length > 0) {
        console.log(`[Media Validation] Checked ${upcomingItems.length} media files scheduled for next ${intervalInSeconds}s interval`);
    }
}
async function cycleCheck() {
    // BACKGROUND SERVICE OPERATIONS:
    // - Monitors and manages current/ondeck playlists
    // - Transitions media blocks at scheduled times
    // - Generates next day's stream ONLY for continuous streams (adhoc streams end and stop)
    // - Adjusts streams for missing media files
    // - Adjusts streams for time drift off of cadence marks due to processing delays
    // Get the current Unix timestamp
    const currentUnixTimestamp = (0, moment_1.default)().unix();
    console.log(`Current Unix Timestamp: ${currentUnixTimestamp}`);
    // Validate upcoming media files that should play within the next interval
    validateUpcomingMediaFiles(currentUnixTimestamp);
    // Gets the items currently loaded into the on deck array
    let onDeck = streamMan.getOnDeckStream();
    // Logging statement to show when the next item in the on deck stream is scheduled to start
    if (onDeck.length >= 2) {
        console.log('Target Unix Timestamp: ' + onDeck[1].startTime);
    }
    else {
        console.log('There arent enough items in the on deck stream to check for a new item');
    }
    // Logging statement to display that the next item from the ondeck stream should be starting now
    if (onDeck.length >= 1 && currentUnixTimestamp === onDeck[0].startTime) {
        console.log(onDeck[0].featureMedia?.title + ' is starting now');
    }
    // This is the mechanism that will remove the first item from the on deck stream and add the next item from the upcoming stream
    // This operation will only initiate if the stream is continuous and there are at least 2 items in the on deck stream
    if (streamMan.isContinuousStream() && onDeck.length > 1) {
        // If there is a second item in the on deck stream and the current time is greater than or equal to the start time of the second item
        if (onDeck[1].startTime && currentUnixTimestamp >= onDeck[1].startTime) {
            // Remove the first item from the on deck stream
            let removed = streamMan.removeFirstItemFromOnDeck();
            if (removed != null || removed != undefined) {
                console.log('Removing ' +
                    removed.featureMedia?.title +
                    ' and post buffer from On Deck');
            }
            // Shifts the first item from the upcoming stream
            let nextMediaBlock = streamMan.removeFirstItemFromUpcoming();
            // Logs the item that will be added to the on deck stream
            if (nextMediaBlock != null || nextMediaBlock != undefined) {
                console.log('Adding ' + nextMediaBlock.featureMedia?.title + ' to On Deck Stream');
            }
            // If the item is not null or undefined, add it to the on deck stream and the VLC playlist
            if (nextMediaBlock != null || nextMediaBlock != undefined) {
                streamMan.addItemToOnDeck([nextMediaBlock]);
                // Adds the block (the media item and its buffer) to the VLC playlist
                await vlcService.addMediaBlockToPlaylist(nextMediaBlock);
            }
        }
    }
    // If the current Unix timestamp is greater than or equal to the tomorrow marker, set the tomorrow marker to the new value (being the next instance of 12:00am)
    if (currentUnixTimestamp >= tomorrow) {
        setTomorrow();
    }
    // Prepares the next day's stream if the current Unix timestamp is greater than or equal to the end of day marker
    if (currentUnixTimestamp >= endOfDayMarker) {
        // Sets the new end of day marker to the next instance of 11:30pm (this is important to ensure this operation does not run multiple times in a day)
        setEndOfDayMarker();
        // Generate next day's stream ONLY for continuous streams
        // Adhoc streams run until their scheduled end time and then stop - no next day generation needed
        const currentStreamType = (0, mediaService_1.getStreamType)();
        if (currentStreamType === streamTypes_1.StreamType.Cont) {
            //
            // Get the current continuous stream arguments from the stream service
            let continuousStreamArgs = streamMan.getContinuousStreamArgs();
            // Create a new StreamArgs object with the same password as the current continuous stream arguments
            // This piece is here for future development to allow for different arguments for the next day's stream if we so choose
            // Create a safer copy of the continuous args for tomorrow. Many of these
            // fields may be empty when the continuous endpoint is password-only,
            // so default to empty arrays or existing values to avoid crashes.
            let tomorrowsContinuousStreamArgs = new streamRequest_1.ContStreamRequest(continuousStreamArgs.Password);
            // Constructs the stream for the next day and adds it to the upcoming stream
            const stream = (0, streamConstructor_1.constructStream)((0, mediaService_1.getStreamType)(), tomorrow, // Pass the calculated tomorrow time
            false);
            // Add tomorrow's stream to the upcoming stream buffer (not on-deck to prevent memory issues)
            // This ensures continuous operation while keeping the on-deck stream limited to 2 items
            streamMan.addToUpcomingStream(stream[0]);
            // Note: We don't rebuild cache here since tomorrow's stream goes to upcoming, not on-deck
        }
    }
    // Calculate the delay until the next interval mark and set it as the new interval
    // Intervals will always be set to the next 5 minute mark based on the world clock (i.e. 12:00:00, 12:05:00, 12:10:00, etc.)
    const nextDelay = calculateDelayToNextInterval(intervalInSeconds);
    // Clear any existing timeout before scheduling a new one to prevent memory leak
    if (cycleCheckTimeout)
        clearTimeout(cycleCheckTimeout);
    cycleCheckTimeout = setTimeout(cycleCheck, nextDelay);
}
function startBackgroundProcess() {
    console.log('Starting background process');
    // Start the initial check after a delay
    const initialDelay = calculateDelayToNextInterval(intervalInSeconds);
    setTimeout(cycleCheck, initialDelay);
}
function stopBackgroundProcess() {
    console.log('Stopping background process');
    if (cycleCheckTimeout) {
        clearTimeout(cycleCheckTimeout);
        cycleCheckTimeout = null;
    }
}
