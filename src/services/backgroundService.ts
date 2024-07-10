import moment from 'moment';
import { constructStream } from './streamConstructor';
import { StreamArgs } from '../models/streamArgs';
import { addToOnDeckStream, getConfig, getContinuousStreamArgs, getOnDeckStream, isContinuousStream, removeFromOnDeckStream, removeFromUpcomingStream } from './streamManager';
import { MediaBlock } from '../models/mediaBlock';
import * as VLC from 'vlc-client';
import { getMedia } from './dataManager';

const intervalInSeconds: number = 300;
let vlc: VLC.Client;
let endOfDayMarker: number = 0;
let tomorrow: number = 0;

function calculateDelayToNextInterval(intervalInSeconds: number): number {
    // Get the current Unix timestamp
    const now = moment().unix();
    console.log(`Current Unix Timestamp: ${now}`);
    // Calculate the seconds until the next interval
    // The interval in seconds equals 5 minutes (300 seconds)
    // THE DREADED MODULO OPERATION
    const secondsToNextInterval = intervalInSeconds - (now % intervalInSeconds);
    console.log(`Seconds to next interval: ${secondsToNextInterval}`);
    return secondsToNextInterval * 1000; // Convert seconds to milliseconds
}

function setEndOfDayMarker() {
    endOfDayMarker = moment().set({ hour: 23, minute: 30, second: 0 }).unix();
}

function setTomorrow() {
    tomorrow = moment().add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).unix();
}

async function cycleCheck() {
    // Get the current Unix timestamp
    const currentUnixTimestamp = moment().unix();
    console.log(`Current Unix Timestamp: ${currentUnixTimestamp}`);

    // Gets the items currently loaded into the on deck array
    let onDeck: MediaBlock[] = getOnDeckStream()

    // Logging statement to show when the next item in the on deck stream is scheduled to start
    if (onDeck.length >= 2) {
        console.log("Target Unix Timestamp: " + onDeck[1].StartTime);
    } else {
        console.log("There arent enough items in the on deck stream to check for a new item");
    }

    // Logging statement to display that the next item from the ondeck stream should be starting now
    if (onDeck.length >= 1 && currentUnixTimestamp === onDeck[0].StartTime) {
        console.log(onDeck[0].MainBlock?.Title + " is starting now");
    }

    // This is the mechanism that will remove the first item from the on deck stream and add the next item from the upcoming stream
    // This operation will only initiate if the stream is continuous and there are at least 2 items in the on deck stream
    if (isContinuousStream() && onDeck.length >= 2) {

        // If there is a second item in the on deck stream and the current time is greater than or equal to the start time of the second item
        if (onDeck[1].StartTime && currentUnixTimestamp >= onDeck[1].StartTime) {
            // Remove the first item from the on deck stream
            let removed = removeFromOnDeckStream();
            // Logs the item that was removed from the on deck stream
            if (removed != null || removed != undefined) {
                console.log("Removing " + removed.MainBlock?.Title + " and post buffer from On Deck Stream");
            }
            // Gets amd removes the first item from the upcoming stream
            let added = removeFromUpcomingStream();

            // Logs the item that will be added to the on deck stream
            if (added != null || added != undefined) {
                console.log("Adding " + added.MainBlock?.Title + " to On Deck Stream");
            }
            // If the item is not null or undefined, add it to the on deck stream and the VLC playlist
            if (added != null || added != undefined) {
                // The item must be in an array to be added to the on deck stream (to reuse the addToOnDeckStream function)
                addToOnDeckStream([added]);
                // Adds the block (the media item and its buffer) to the VLC playlist
                await addMediaBlock(added);
            }
        }
    }

    // If the current Unix timestamp is greater than or equal to the tomorrow marker, set the tomorrow marker to the new value (being the next instance of 12:00am)
    if (currentUnixTimestamp >= tomorrow) {
        setTomorrow()
    }

    // Prepares the next day's stream if the current Unix timestamp is greater than or equal to the end of day marker
    if (currentUnixTimestamp >= endOfDayMarker) {
        // Sets the new end of day marker to the next instance of 11:30pm (this is important to ensure this operation does not run multiple times in a day)
        setEndOfDayMarker();
        // If the stream is continuous, prepare the next day's stream
        if (isContinuousStream()) {
            // Get the current continuous stream arguments from the stream service
            let continuousStreamArgs = getContinuousStreamArgs();
            // Create a new StreamArgs object with the same password as the current continuous stream arguments
            // This piece is here for future development to allow for different arguments for the next day's stream if we so choose
            let tomorrowsContinuousStreamArgs = new StreamArgs(continuousStreamArgs.password);
            tomorrowsContinuousStreamArgs.env = continuousStreamArgs.env;
            tomorrowsContinuousStreamArgs.tagsOR = continuousStreamArgs.tagsOR;
            tomorrowsContinuousStreamArgs.startTime = tomorrow
            // Constructs the stream for the next day and adds it to the upcoming stream
            const stream: [MediaBlock[], string] = constructStream(getConfig(), tomorrowsContinuousStreamArgs, getMedia());
            // TODO - I do not remember why I added this as it looks like it adds the entirety of tomorrow's stream to the on deck stream, this might need to be reworked
            addToOnDeckStream(stream[0]);
        }
    }

    // Calculate the delay until the next interval mark and set it as the new interval
    // Intervals will always be set to the next 5 minute mark based on the world clock (i.e. 12:00:00, 12:05:00, 12:10:00, etc.)
    const nextDelay = calculateDelayToNextInterval(intervalInSeconds);
    setTimeout(cycleCheck, nextDelay);
}

function startBackgroundProcess() {
    console.log('Starting background process');
    // Start the initial check after a delay
    const initialDelay = calculateDelayToNextInterval(intervalInSeconds);
    setTimeout(cycleCheck, initialDelay);
}

function setVLCClient(client: VLC.Client) {
    vlc = client;
}

async function playVLC() {
    try {
        // vlc.next() plays the next item in the playlist, which is the first item in the playlist as it is not already playing
        await vlc.next();
    } catch (error) {
        console.error("An error occurred when playing stream:", error);
    }
}

async function addMediaBlock(item: MediaBlock | undefined): Promise<void> {
    if (item != null || item != undefined) {
        try {
            //If item has a initial Buffer (buffer that plays before the media), add it to the playlist
            // initial buffers are only when launching the stream to make sure the first media item starts at the next 30 minute interval
            if (item.InitialBuffer.length > 0) {
                console.log("Adding " + item.InitialBuffer.length + " initial buffer items to playlist");
            }
            if (item.InitialBuffer != null || item.InitialBuffer != undefined) {
                item.InitialBuffer.forEach(async (element) => {
                    await vlc.addToPlaylist(element.Path);
                });
            }

            // Adds the main media item to the vlc playlist
            if (item.MainBlock?.Path != null || item.MainBlock?.Path != undefined) {
                console.log("Adding " + item.MainBlock.Title + " to playlist");
                await vlc.addToPlaylist(item.MainBlock.Path);
            }

            //If item has a post Buffer (buffer that plays after the media), add it to the playlist
            console.log("Adding " + item.Buffer.length + " post buffer items to playlist");
            item.Buffer.forEach(async (element) => {
                await vlc.addToPlaylist(element.Path);
            });
        } catch (error) {
            console.error("An error occurred when adding to Playlist:", error);
        }
    } else {
        console.log("Item was null or undefined");
    }
}

export {
    cycleCheck,
    startBackgroundProcess,
    setVLCClient,
    playVLC,
    addMediaBlock,
    calculateDelayToNextInterval,
    setEndOfDayMarker,
    setTomorrow
};

