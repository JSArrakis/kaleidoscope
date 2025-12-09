import { randomUUID } from "crypto";

/**
 * Factory function to create a MediaBlock with constructor-style parameters
 */
export function createMediaBlock(
  buffer?: (Promo | Music | Short | Commercial | Bumper)[],
  mainBlock?: Movie | Episode,
  startTime?: number,
  duration?: number
): MediaBlock {
  // Calculate buffer duration
  const bufferDuration = (buffer ?? []).reduce(
    (sum, item) => sum + (item.duration || 0),
    0
  );

  // Calculate total duration: buffer duration + main media duration
  const mainDuration = mainBlock?.duration || 0;
  const totalDuration = duration ?? bufferDuration + mainDuration;

  return {
    buffer: buffer ?? [],
    mainBlock,
    startTime: startTime ?? Math.floor(Date.now() / 1000),
    duration: totalDuration
  };
}
