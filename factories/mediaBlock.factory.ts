import { randomUUID } from "crypto";
import { MediaBlock } from "../src/electron/types/MediaBlock.js";

/**
 * Factory function to create a MediaBlock with constructor-style parameters
 */
export function createMediaBlock(
  buffer?: (Promo | Music | Short | Commercial | Bumper)[],
  mainBlock?: Movie | Episode,
  startTime?: number,
  duration?: number
): MediaBlock {
  // Create a new MediaBlock instance using the constructor
  const mediaBlock = new MediaBlock(
    buffer ?? [],
    mainBlock,
    startTime ?? Math.floor(Date.now() / 1000)
  );

  // If a custom duration is provided, override the calculated duration
  if (duration !== undefined) {
    mediaBlock.duration = duration;
  }

  return mediaBlock;
}
