import { MediaBlock } from "../../types/MediaBlock.js";

/**
 * Builds an adhoc stream
 * Constructs media blocks from startTimepoint until endTimepoint
 * Supports Cadenced and UnCadenced modes with Themed and Random selection
 *
 * Adhoc streams are meant to be one-off, with a defined end time
 *
 * @param streamConstructionOptions Configuration for stream (Cadence, Themed, etc)
 * @param startTimepoint Unix timestamp in seconds (usually current time)
 * @param endTimepoint Unix timestamp in seconds (when stream should end)
 * @returns Tuple of [MediaBlock[], errorMessage]
 */
export async function buildAdhocStream(
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint: number,
): Promise<[MediaBlock[], string]> {
  return [[], "Adhoc stream builder not yet implemented"];
}
