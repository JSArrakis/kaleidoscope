import * as streamManager from "./streamManager.js";
import { rolloverToNextDay } from "./streamConstruction/continuousStreamBuilder.js";
import { StreamType } from "../types/StreamType.js";
import { existsSync } from "fs";

let cycleCheckTimeout: NodeJS.Timeout | null = null;

const intervalInSeconds: number = 300; // 5 minutes
let endOfDayMarker: number = 0;
let tomorrow: number = 0;

function getCurrentUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function calculateDelayToNextInterval(intervalInSeconds: number): number {
  const now = getCurrentUnixTimestamp();
  console.log(`Current Unix Timestamp: ${now}`);

  const secondsToNextInterval = intervalInSeconds - (now % intervalInSeconds);
  console.log(`Seconds to next interval: ${secondsToNextInterval}`);

  return secondsToNextInterval * 1000; // Convert to milliseconds
}

function setEndOfDayMarker(): void {
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    30,
    0,
    0,
  );
  endOfDayMarker = Math.floor(endOfDay.getTime() / 1000);
  console.log(`End of day marker set to: ${endOfDayMarker}`);
}

function setTomorrow(): void {
  const tomorrow_date = new Date();
  tomorrow_date.setDate(tomorrow_date.getDate() + 1);
  tomorrow = Math.floor(
    new Date(
      tomorrow_date.getFullYear(),
      tomorrow_date.getMonth(),
      tomorrow_date.getDate(),
      0,
      0,
      0,
      0,
    ).getTime() / 1000,
  );
  console.log(`Tomorrow marker set to: ${tomorrow}`);
}

function validateUpcomingMediaFiles(currentUnixTimestamp: number): void {
  const validationEndTime = currentUnixTimestamp + intervalInSeconds;

  // Check On Deck and Upcoming blocks whose startTime falls within the next interval
  const blocks = [
    ...streamManager.getOnDeckStream(),
    ...streamManager.getUpcomingStream(),
  ];

  let missingCount = 0;

  for (const block of blocks) {
    if (block.startTime > validationEndTime) break;

    // Check anchor media file
    if (
      block.anchorMedia &&
      "path" in block.anchorMedia &&
      block.anchorMedia.path
    ) {
      if (!existsSync(block.anchorMedia.path)) {
        console.warn(
          `[Media Validation] MISSING anchor file: "${block.anchorMedia.title}" ` +
            `at path: ${block.anchorMedia.path} ` +
            `(scheduled for ${new Date(block.startTime * 1000).toISOString()})`,
        );
        missingCount++;
      }
    }

    // Check buffer media files
    for (const item of block.buffer) {
      if ("path" in item && item.path) {
        if (!existsSync(item.path)) {
          console.warn(
            `[Media Validation] MISSING buffer file: "${item.title}" ` +
              `at path: ${item.path}`,
          );
          missingCount++;
        }
      }
    }
  }

  if (missingCount > 0) {
    console.warn(
      `[Media Validation] ${missingCount} missing file(s) in upcoming ${intervalInSeconds}s interval`,
    );
  }
}

async function cycleCheck(): Promise<void> {
  // BACKGROUND SERVICE OPERATIONS:
  // - Monitors and manages On Deck / Upcoming lists
  // - Transitions media blocks at scheduled times
  // - Generates next day's stream ONLY for continuous streams
  // - Validates upcoming media files for missing paths

  const currentUnixTimestamp = getCurrentUnixTimestamp();
  console.log(`[Cycle Check] Current Unix Timestamp: ${currentUnixTimestamp}`);

  // Validate upcoming media files
  validateUpcomingMediaFiles(currentUnixTimestamp);

  // --- On Deck state ---
  const onDeck = streamManager.getOnDeckStream();

  if (onDeck.length >= 2) {
    console.log(`[Cycle Check] Next item start time: ${onDeck[1].startTime}`);
  } else {
    console.log(
      "[Cycle Check] Not enough items in On Deck to check for a new item",
    );
  }

  if (onDeck.length >= 1 && currentUnixTimestamp >= onDeck[0].startTime) {
    console.log(
      `[Cycle Check] "${
        onDeck[0].anchorMedia?.title ?? "(buffer block)"
      }" is starting now`,
    );
  }

  // --- Prune expired On Deck blocks ---
  // When Slot 2's startTime has passed, Slot 1 has finished — remove it.
  // Loop in case multiple slots expired between cycles (e.g. after a long pause).
  if (streamManager.isContinuousStream()) {
    while (onDeck.length > 1 && currentUnixTimestamp >= onDeck[1].startTime) {
      const expired = streamManager.removeFirstItemFromOnDeck();
      if (expired) {
        streamManager.recordPlayedMovie(expired);
        streamManager.recordPlayedEpisodeProgression(expired);
      }
      console.log(
        `[Cycle Check] Removed expired On Deck block: "${
          expired?.anchorMedia?.title ?? "(buffer block)"
        }"`,
      );
    }
  }

  // --- Promote from Upcoming → On Deck (Slot 3) when below threshold ---
  if (onDeck.length < 3) {
    const upcoming = streamManager.getUpcomingStream();
    if (upcoming.length > 0) {
      const next = streamManager.removeFirstItemFromUpcoming();
      if (next) {
        streamManager.addItemToOnDeck([next]);
        console.log(
          `[Cycle Check] Promoted to On Deck Slot ${
            onDeck.length
          }: "${next.anchorMedia?.title ?? "(buffer block)"}"`,
        );
      }
    }
  }

  // --- Day rollover ---
  // Trigger when Upcoming is down to exactly 1 block and that block has no
  // buffer yet (i.e. it was the terminal element of the previous iteration,
  // skipped by fillStreamBlockBuffers).
  const upcoming = streamManager.getUpcomingStream();
  const lastUpcoming =
    upcoming.length > 0 ? upcoming[upcoming.length - 1] : null;

  const shouldRollover =
    streamManager.isContinuousStream() &&
    lastUpcoming !== null &&
    upcoming.length === 1 &&
    lastUpcoming.buffer.length === 0;

  if (shouldRollover) {
    const args = streamManager.getContinuousStreamArgs();
    if (args) {
      const options: StreamConstructionOptions = {
        Cadence: args.Cadence ?? true,
        Themed: args.Themed ?? false,
        StreamType: StreamType.Cont,
      };
      rolloverToNextDay(options, tomorrow);
      console.log(
        "[Cycle Check] Day rollover triggered — next day's stream built",
      );
    }
  }

  // Check if day has changed — update tomorrow marker
  if (currentUnixTimestamp >= tomorrow) {
    setTomorrow();
  }

  // Reset end-of-day marker after it passes
  if (currentUnixTimestamp >= endOfDayMarker) {
    setEndOfDayMarker();
  }

  // Calculate delay to next interval and reschedule
  const nextDelay = calculateDelayToNextInterval(intervalInSeconds);
  if (cycleCheckTimeout) clearTimeout(cycleCheckTimeout);
  cycleCheckTimeout = setTimeout(cycleCheck, nextDelay);
}

export function startBackgroundService(): void {
  console.log("Starting background service");
  setEndOfDayMarker();
  setTomorrow();

  const initialDelay = calculateDelayToNextInterval(intervalInSeconds);
  cycleCheckTimeout = setTimeout(cycleCheck, initialDelay);
}

export function stopBackgroundService(): void {
  console.log("Stopping background service");
  if (cycleCheckTimeout) {
    clearTimeout(cycleCheckTimeout);
    cycleCheckTimeout = null;
  }
}
