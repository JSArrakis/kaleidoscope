import { randomUUID } from "crypto";
import { bootstrapPoolRepository } from "../../repositories/bootstrapPoolRepository.js";
import { prewarmBootstrapVariants } from "./bootstrapVariantPrewarmService.js";
import { bootstrapLogger } from "./bootstrapLogger.js";

/**
 * Incremental bootstrap coverage triggers.
 * Called after media ingest or tag updates to ensure fresh anchors are available.
 */

const BOOTSTRAP_PROFILES: Array<"native" | "plex" | "jellyfin"> = [
  "native",
  "plex",
  "jellyfin",
];

/**
 * Check if a media item should trigger bootstrap pool addition based on its tags.
 * Called after movie/episode creation or tag updates.
 *
 * Rules:
 * 1. If media has Genre or Aesthetic tags, check if those tags already have pool coverage.
 *    If not, add this media to the pool and queue prewarm.
 * 2. If media has no tags AND pool is empty, add as fallback anchor.
 *
 * @param input Media item details
 */
export function checkBootstrapCoverageTrigger(input: {
  mediaItemId: string;
  mediaType: "Movie" | "Episode";
  tags: Tag[];
}): void {
  try {
    // Filter out fake/empty tagId placeholders from UI and only keep Genre/Aesthetic
    const genreAestheticTags = input.tags.filter(
      (t) =>
        (t.type === "Genre" || t.type === "Aesthetic") &&
        t.tagId &&
        t.tagId.trim() !== "",
    );

    const poolSize = bootstrapPoolRepository.getPoolSize();
    bootstrapLogger.logCoverageTriggerCheck({
      mediaItemId: input.mediaItemId,
      mediaType: input.mediaType,
      genreAestheticTagCount: genreAestheticTags.length,
      poolSize,
    });

    // Case 1: Media has genre/aesthetic tags - check for coverage gaps
    if (genreAestheticTags.length > 0) {
      let hasUncoveredTag = false;

      for (const tag of genreAestheticTags) {
        const existingPoolItem = bootstrapPoolRepository.findPoolItemByTag(
          tag.tagId,
        );
        if (!existingPoolItem) {
          hasUncoveredTag = true;
          bootstrapLogger.logUncoveredTagDetected({
            tagId: tag.tagId,
            tagType: tag.type,
          });
          break;
        }
      }

      if (hasUncoveredTag) {
        console.log(
          `[bootstrapIncrementalTriggers] Calling addMediaToBootstrapPool for ${input.mediaType} ${input.mediaItemId} (uncovered tags)`,
        );
        try {
          addMediaToBootstrapPool(
            input.mediaItemId,
            input.mediaType,
            input.tags,
          );
          console.log(
            `[bootstrapIncrementalTriggers] Successfully added ${input.mediaType} ${input.mediaItemId} to pool`,
          );
        } catch (error) {
          console.error(
            `[bootstrapIncrementalTriggers] FAILED to add to pool:`,
            error,
          );
          throw error;
        }
      } else {
        bootstrapLogger.logCoverageTriggerSkipped(
          "All tags already covered by existing pool items",
        );
      }
    }

    // Case 2: Untagged media fallback - only if pool is empty
    else {
      console.log(
        `[bootstrapIncrementalTriggers] Untagged media, checking fallback (poolSize=${poolSize})`,
      );
      if (poolSize === 0) {
        bootstrapLogger.logFirstUntaggedFallback({
          mediaItemId: input.mediaItemId,
          mediaType: input.mediaType,
        });
        console.log(
          `[bootstrapIncrementalTriggers] Calling addMediaToBootstrapPool for UNTAGGED ${input.mediaType} ${input.mediaItemId} (fallback)`,
        );
        try {
          addMediaToBootstrapPool(input.mediaItemId, input.mediaType, []);
          console.log(
            `[bootstrapIncrementalTriggers] Successfully added untagged ${input.mediaType} to pool`,
          );
        } catch (error) {
          console.error(
            `[bootstrapIncrementalTriggers] FAILED to add untagged to pool:`,
            error,
          );
          throw error;
        }
      } else {
        bootstrapLogger.logCoverageTriggerSkipped(
          `Untagged media but pool not empty (poolSize=${poolSize})`,
        );
      }
    }
  } catch (error) {
    console.error(
      "[bootstrapIncrementalTriggers] Error checking coverage trigger:",
      error,
    );
    // Don't throw - this is a background optimization, shouldn't block media ingest
  }
}

/**
 * Add a media item to the bootstrap pool and queue prewarm for all profiles.
 */
function addMediaToBootstrapPool(
  mediaItemId: string,
  mediaType: "Movie" | "Episode",
  tags: Tag[],
): void {
  console.log(
    `[addMediaToBootstrapPool] START: ${mediaType} ${mediaItemId}, ${tags.length} tags`,
  );

  // Reuse existing poolItemId if this media item is already in the pool.
  // This preserves existing variant records (already-transcoded files).
  const existingPoolItemId =
    bootstrapPoolRepository.findPoolItemIdByMediaItemId(mediaItemId, mediaType);
  const poolItemId = existingPoolItemId ?? randomUUID();

  if (existingPoolItemId) {
    console.log(
      `[addMediaToBootstrapPool] Reusing existing poolItemId: ${poolItemId} (variants preserved)`,
    );
  } else {
    console.log(
      `[addMediaToBootstrapPool] New pool item, generated poolItemId: ${poolItemId}`,
    );
  }

  // Add to pool (upsert is a no-op if already exists, just updates updatedAt)
  try {
    bootstrapPoolRepository.upsertPoolItem({
      poolItemId,
      mediaItemId,
      mediaType,
    });
    console.log(`[addMediaToBootstrapPool] Pool item upserted`);
  } catch (error) {
    console.error(`[addMediaToBootstrapPool] FAILED upsertPoolItem:`, error);
    throw error;
  }

  // Associate tags
  const bootstrapTags = tags
    .filter((t) => t.type === "Genre" || t.type === "Aesthetic")
    .map((t) => ({
      tagId: t.tagId,
      tagType: t.type as "Genre" | "Aesthetic",
    }));

  console.log(
    `[addMediaToBootstrapPool] Filtered to ${bootstrapTags.length} Genre/Aesthetic tags`,
  );

  try {
    bootstrapPoolRepository.replacePoolItemTags(poolItemId, bootstrapTags);
    console.log(`[addMediaToBootstrapPool] Tags associated`);
  } catch (error) {
    console.error(
      `[addMediaToBootstrapPool] FAILED replacePoolItemTags:`,
      error,
    );
    throw error;
  }

  bootstrapLogger.logPoolItemAdded({
    poolItemId,
    mediaItemId,
    mediaType,
    tagCount: bootstrapTags.length,
  });

  bootstrapLogger.logPoolItemTagsAssociated({
    poolItemId,
    tags: bootstrapTags,
  });

  // Queue prewarm (fire-and-forget)
  const runId = `incremental-${poolItemId.slice(0, 8)}`;
  console.log(
    `[addMediaToBootstrapPool] Queueing prewarm with runId: ${runId}`,
  );

  bootstrapLogger.logPrewarmQueued({
    runId,
    poolItemId,
    profiles: BOOTSTRAP_PROFILES,
  });

  try {
    void prewarmBootstrapVariants({
      runId,
      profiles: BOOTSTRAP_PROFILES,
    });
    console.log(`[addMediaToBootstrapPool] Prewarm queued successfully`);
  } catch (error) {
    console.error(`[addMediaToBootstrapPool] FAILED to queue prewarm:`, error);
    throw error;
  }

  console.log(`[addMediaToBootstrapPool] COMPLETE`);
}
