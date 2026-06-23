import { buildContinuousStream } from "./streamConstruction/continuousStreamBuilder.js";
import { buildAdhocStream } from "./streamConstruction/adhocStreamBuilder.js";
import { MediaBlock } from "../types/MediaBlock.js";
import { StreamType } from "../models.js";
import { bootstrapPoolRepository } from "../repositories/bootstrapPoolRepository.js";
import { bootstrapLogger } from "./bootstrap/bootstrapLogger.js";

const ENABLE_BOOTSTRAP_SELECTOR = process.env.ENABLE_BOOTSTRAP_SELECTOR === "1";

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
  // Validate bootstrap pool has at least one ready anchor
  if (ENABLE_BOOTSTRAP_SELECTOR) {
    const readyCounts = bootstrapPoolRepository.getReadyVariantCountByProfile();
    const totalReady =
      readyCounts.native + readyCounts.plex + readyCounts.jellyfin;

    bootstrapLogger.logSeparator("STREAM START VALIDATION");
    bootstrapLogger.logStreamStartValidation({
      hasBootstrapEnabled: true,
      readyCounts,
      totalReady,
      canStart: totalReady > 0,
    });

    if (totalReady === 0) {
      console.error(
        "[StreamService] Cannot start stream - no pre-transcoded anchors available in bootstrap pool",
      );
      return [
        [],
        "Cannot start stream: No pre-transcoded media available. Please add movies or TV shows and wait for transcoding to complete, or trigger a bootstrap pool rebuild.",
      ];
    }

    console.log(
      `[StreamService] Bootstrap validation passed: ${totalReady} ready anchors (native=${readyCounts.native}, plex=${readyCounts.plex}, jellyfin=${readyCounts.jellyfin})`,
    );
  }

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

  return result;
}
