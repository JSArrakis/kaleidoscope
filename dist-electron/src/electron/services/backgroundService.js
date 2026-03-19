let cycleCheckTimeout = null;
const intervalInSeconds = 300; // 5 minutes
let endOfDayMarker = 0;
let tomorrow = 0;
function getCurrentUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}
function calculateDelayToNextInterval(intervalInSeconds) {
    const now = getCurrentUnixTimestamp();
    console.log(`Current Unix Timestamp: ${now}`);
    const secondsToNextInterval = intervalInSeconds - (now % intervalInSeconds);
    console.log(`Seconds to next interval: ${secondsToNextInterval}`);
    return secondsToNextInterval * 1000; // Convert to milliseconds
}
function setEndOfDayMarker() {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0, 0);
    endOfDayMarker = Math.floor(endOfDay.getTime() / 1000);
    console.log(`End of day marker set to: ${endOfDayMarker}`);
}
function setTomorrow() {
    const tomorrow_date = new Date();
    tomorrow_date.setDate(tomorrow_date.getDate() + 1);
    tomorrow = Math.floor(new Date(tomorrow_date.getFullYear(), tomorrow_date.getMonth(), tomorrow_date.getDate(), 0, 0, 0, 0).getTime() / 1000);
    console.log(`Tomorrow marker set to: ${tomorrow}`);
}
let cachedTimedMediaItems = [];
function validateUpcomingMediaFiles(currentUnixTimestamp) {
    // Clean up old cached items to prevent memory leak
    cachedTimedMediaItems = cachedTimedMediaItems.filter((item) => item.startTime > currentUnixTimestamp);
    const validationEndTime = currentUnixTimestamp + intervalInSeconds;
    const upcomingItems = cachedTimedMediaItems.filter((item) => item.startTime >= currentUnixTimestamp &&
        item.startTime <= validationEndTime);
    upcomingItems.forEach((item) => {
        try {
            // TODO: When a file is missing we need to add or rearrange buffers to cover the missing file
            console.log(`[Media Validation] Checking ${item.mediaType}: "${item.title}" ` +
                `from block "${item.blockTitle}" at path: ${item.path} ` +
                `(scheduled for ${new Date(item.startTime * 1000).toISOString()})`);
        }
        catch (error) {
            console.log(`[Media Validation] Error checking ${item.mediaType}: "${item.title}" ` +
                `from block "${item.blockTitle}" at path: ${item.path} ` +
                `(Error: ${error})`);
        }
    });
    if (upcomingItems.length > 0) {
        console.log(`[Media Validation] Checked ${upcomingItems.length} media files scheduled for next ${intervalInSeconds}s interval`);
    }
}
async function cycleCheck() {
    // BACKGROUND SERVICE OPERATIONS:
    // - Monitors and manages current/ondeck playlists
    // - Transitions media blocks at scheduled times
    // - Generates next day's stream ONLY for continuous streams
    // - Adjusts streams for missing media files
    // - Adjusts streams for time drift off of cadence marks
    const currentUnixTimestamp = getCurrentUnixTimestamp();
    console.log(`[Cycle Check] Current Unix Timestamp: ${currentUnixTimestamp}`);
    // Validate upcoming media files
    validateUpcomingMediaFiles(currentUnixTimestamp);
    // TODO: Get the items currently loaded into the on deck array from streamManager
    // const onDeck: MediaBlock[] = streamMan.getOnDeckStream();
    // TODO: Log when next item should start
    // if (onDeck.length >= 2) {
    //   console.log('Target Unix Timestamp: ' + onDeck[1].startTime);
    // } else {
    //   console.log(
    //     'There arent enough items in the on deck stream to check for a new item',
    //   );
    // }
    // TODO: Check if next item should be starting
    // if (onDeck.length >= 1 && currentUnixTimestamp === onDeck[0].startTime) {
    //   console.log(onDeck[0].featureMedia?.title + ' is starting now');
    // }
    // TODO: Manage stream transitions
    // if (streamMan.isContinuousStream() && onDeck.length > 1) {
    //   if (onDeck[1].startTime && currentUnixTimestamp >= onDeck[1].startTime) {
    //     // Remove and transition logic
    //   }
    // }
    // Check if day has changed
    if (currentUnixTimestamp >= tomorrow) {
        setTomorrow();
    }
    // Check if it's time to prepare next day's stream
    if (currentUnixTimestamp >= endOfDayMarker) {
        setEndOfDayMarker();
        // TODO: Generate next day's stream for continuous streams only
        // const currentStreamType = getStreamType();
        // if (currentStreamType === StreamType.Cont) {
        //   const continuousStreamArgs = streamMan.getContinuousStreamArgs();
        //   const stream = constructStream(getStreamType(), tomorrow, false);
        //   streamMan.addToUpcomingStream(stream[0]);
        // }
    }
    // Calculate delay to next interval and reschedule
    const nextDelay = calculateDelayToNextInterval(intervalInSeconds);
    if (cycleCheckTimeout)
        clearTimeout(cycleCheckTimeout);
    cycleCheckTimeout = setTimeout(cycleCheck, nextDelay);
}
export function startBackgroundService() {
    console.log("Starting background service");
    setEndOfDayMarker();
    setTomorrow();
    const initialDelay = calculateDelayToNextInterval(intervalInSeconds);
    cycleCheckTimeout = setTimeout(cycleCheck, initialDelay);
}
export function stopBackgroundService() {
    console.log("Stopping background service");
    if (cycleCheckTimeout) {
        clearTimeout(cycleCheckTimeout);
        cycleCheckTimeout = null;
    }
}
