import { MediaBlock } from "../types/MediaBlock.js";

/**
 * Factory function to create a MediaBlock.
 *
 * @param buffer Array of filler media items (commercials, shorts, music, etc.)
 * @param mainBlock The anchor media (Movie or Episode), optional for buffer-only blocks
 * @param startTime Unix timestamp when block starts (in seconds)
 * @returns MediaBlock instance
 */
export function createMediaBlock(
  buffer: (Promo | Music | Short | Commercial | Bumper)[],
  mainBlock: Movie | Episode | undefined,
  startTime: number,
  sourceContext?: MediaBlockSourceContext,
): MediaBlock {
  return new MediaBlock(buffer, mainBlock, startTime, sourceContext);
}
