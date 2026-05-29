import { buildContinuousStream } from "./streamConstruction/continuousStreamBuilder.js";
import { buildAdhocStream } from "./streamConstruction/adhocStreamBuilder.js";
import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../models.js";
import { createNormalizationJobsFromBlocks } from "./normalization/normalizationJobFactory.js";
import { normalizationQueue } from "./normalization/normalizationQueue.js";

/**
 * Main stream service entry point
 * Routes to appropriate builder based on stream type
 *
 * Supports two stream types:
 * - Continuous: Runs until end of day, repeats daily (indefinitely)
 * - Adhoc: Runs until a specified end time (one-off streams)
 *
 * Each stream type can be configured as:
 * - Cadenced: Uses buffers to align anchor media to :00/:30 marks
 * - UnCadenced: Back-to-back media with no buffers
 * - Themed: Uses prisms/facets/holidays for selection
 * - Random: Random media selection
 */
export async function createStream(
  streamType: StreamType,
  streamConstructionOptions: StreamConstructionOptions,
  endTimepoint?: number,
): Promise<[MediaBlock[], string]> {
  let result: [MediaBlock[], string];

  switch (streamType) {
    case StreamType.Cont:
      result = await buildContinuousStream(streamConstructionOptions);
      break;

    case StreamType.Adhoc:
      if (!endTimepoint) {
        return [[], "Adhoc streams require an endTimepoint parameter"];
      }
      result = await buildAdhocStream(streamConstructionOptions, endTimepoint);
      break;

    default:
      return [[], `Unsupported stream type: ${streamType}`];
  }

  const [blocks, errorMessage] = result;

  if (!errorMessage && blocks.length > 0) {
    const jobs = createNormalizationJobsFromBlocks(blocks);
    const queued = normalizationQueue.enqueue(jobs);
    console.log(
      `[StreamService] Enqueued normalization jobs: ${queued}/${jobs.length}`,
    );
  }

  return result;
}
