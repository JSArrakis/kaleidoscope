import { constructStream } from "./streamConstructor.js";
import { StreamType } from "../types/StreamType.js";
import moment from "moment";
let upcoming = [];
let onDeck = [];
let continuousStream = false;
let args = null;
let streamVarianceInSeconds = 0;
/**
 * Initializes a continuous stream, populating onDeck with initial media blocks
 * and upcoming with the constructed stream up to end of day
 */
export async function initializeStream(streamArgs, streamType = StreamType.Cont, cadence = false) {
    try {
        setContinuousStreamArgs(streamArgs);
        setContinuousStream(true);
        const now = moment().unix();
        const alignedTime = findNextCadenceTime(now);
        // TODO: Implement firstMedia selection via refract system
        // For now, pass undefined and let stream constructor handle it
        const [constructedBlocks, error] = constructStream(streamType, alignedTime > now ? alignedTime : now, cadence);
        if (error) {
            return error;
        }
        // Add initial blocks to onDeck
        onDeck.push(...constructedBlocks.slice(0, 2));
        // Add remaining to upcoming
        upcoming.push(...constructedBlocks.slice(2));
        // TODO: Initialize VLC or Electron player
        // await VLCService.initializeVLCService(streamArgs.Password);
        // await addInitialMediaBlocks();
        // await VLCService.playVLC();
        console.log(`[StreamManager] Stream initialized: ${onDeck.length} on deck, ${upcoming.length} upcoming`);
        return "";
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[StreamManager] Stream initialization failed: ${message}`);
        return message;
    }
}
/**
 * Populates onDeck with upcoming media blocks
 * Typically called when onDeck drops below a certain threshold
 */
export function initializeOnDeckStream() {
    for (let i = 0; i < 2; i++) {
        if (upcoming.length > 0) {
            const selectedBlock = upcoming.shift();
            if (selectedBlock) {
                onDeck.push(selectedBlock);
            }
        }
    }
}
export function addItemToOnDeck(mediaBlocks) {
    onDeck.push(...mediaBlocks);
}
export function removeFirstItemFromOnDeck() {
    return onDeck.shift();
}
export function removeFirstItemFromUpcoming() {
    return upcoming.shift();
}
export function addToUpcomingStream(mediaBlocks) {
    upcoming.push(...mediaBlocks);
}
export function getUpcomingStream() {
    return upcoming;
}
export function getOnDeckStream() {
    return onDeck;
}
export function getOnDeckStreamLength() {
    return onDeck.length;
}
export function isContinuousStream() {
    return continuousStream;
}
export function setContinuousStream(value) {
    continuousStream = value;
}
export function getContinuousStreamArgs() {
    return args;
}
export function setContinuousStreamArgs(value) {
    args = value;
}
export function getStreamVariationInSeconds() {
    return streamVarianceInSeconds;
}
export function setStreamVariationInSeconds(value) {
    streamVarianceInSeconds = value;
}
export function getStreamStatus() {
    return {
        isContinuous: continuousStream,
        hasUpcomingStream: upcoming.length > 0,
        onDeckLength: onDeck.length,
        upcomingLength: upcoming.length,
        streamArgs: args
            ? {
                title: args.Title,
                hasPassword: !!args.Password,
            }
            : null,
    };
}
export function stopContinuousStream() {
    continuousStream = false;
    upcoming = [];
    onDeck = [];
    // TODO: Handle VLC or Electron player cleanup
}
/**
 * Adds initial media blocks to the player's playlist
 * TODO: Replace VLC-specific logic with Electron player integration
 */
export async function addInitialMediaBlocks() {
    // TODO: Implement with Electron player API
    // for (const item of onDeck) {
    //   await VLCService.addMediaBlockToPlaylist(item);
    // }
}
/**
 * Finds the next cadence time (00:00 or 30:00 of each minute)
 * Used for aligning media blocks to consistent time boundaries
 */
function findNextCadenceTime(now) {
    const nowMoment = moment.unix(now);
    const minutes = nowMoment.minute();
    const seconds = nowMoment.second();
    // If we're already past :30, next cadence is at :00 of next minute
    if (minutes % 1 === 0 && seconds >= 30) {
        return nowMoment.clone().add(1, "minute").startOf("minute").unix();
    }
    // If we're before :30, next cadence is at :30 of current minute
    if (seconds < 30) {
        return nowMoment.clone().minute(minutes).second(30).unix();
    }
    // Otherwise next cadence is at :00 of next minute
    return nowMoment.clone().add(1, "minute").startOf("minute").unix();
}
