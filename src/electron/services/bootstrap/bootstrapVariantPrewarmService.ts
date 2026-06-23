import {
  bootstrapPoolRepository,
  BootstrapProfile,
} from "../../repositories/bootstrapPoolRepository.js";
import {
  ensureElectronPlayablePath,
  getCachedElectronPlayablePathIfReady,
} from "../ffmpegPlaybackProxy.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type PrewarmBootstrapVariantsResult = {
  queued: number;
  reused: number;
  failed: number;
};

// ── REPLACED BELOW ────────────────────────────────────────────────────────
//
// ── REPLACED BELOW ───────────────────────────────────────────────────────────
//
// For v1, all three profiles target the same Chromium-playable MP4/AAC format.
// When Plex/Jellyfin targets are added, each profile can define its own
// ffmpeg args or output path prefix here.

// ── Main prewarm entry point ───────────────────────────────────────────────

/**
 * For each pool item in the DB, ensure a playable variant record exists for
 * each requested profile.
 *
 * - If the file is already cached/playable (fast check via getCachedIfReady),
 *   mark variant as ready immediately (reuse path).
 * - Otherwise, fire-and-forget normalization (ensureElectronPlayablePath) and
 *   mark variant ready when it resolves. The variant is recorded as queued
 *   (isReady=false) immediately so diagnostics reflect in-progress work.
 *
 * For v1 all three profiles use the same Chromium-compatible output format.
 * Profile-specific transcode targets can be added here later.
 */
export async function prewarmBootstrapVariants(input: {
  runId: string;
  profiles: BootstrapProfile[];
}): Promise<PrewarmBootstrapVariantsResult> {
  console.log(
    `[BootstrapPrewarm] ENTRY: runId=${input.runId}, profiles=${input.profiles.join(",")}`,
  );

  const { profiles } = input;
  let queued = 0;
  let reused = 0;
  let failed = 0;

  const poolItems = bootstrapPoolRepository.findAllPoolItemsWithPaths();
  console.log(`[BootstrapPrewarm] Found ${poolItems.length} pool items`);

  if (poolItems.length === 0) {
    console.log(`[BootstrapPrewarm] No pool items to prewarm (empty pool)`);
    return { queued, reused, failed };
  }

  console.log(
    `[BootstrapPrewarm] Processing ${poolItems.length} pool item(s) × ${profiles.length} profile(s)`,
  );

  for (const item of poolItems) {
    for (const profile of profiles) {
      try {
        // Fast path: check if the playable output is already in cache
        const alreadyCached = await getCachedElectronPlayablePathIfReady(
          item.path,
        );

        if (alreadyCached) {
          bootstrapPoolRepository.upsertProfileVariant({
            poolItemId: item.poolItemId,
            profile,
            playablePath: alreadyCached,
            isReady: true,
            isStale: false,
            lastPreparedAt: Math.floor(Date.now() / 1000),
            lastValidationAt: Math.floor(Date.now() / 1000),
          });
          reused += 1;
          console.log(
            `[BootstrapPrewarm] Reused cached variant poolItemId=${item.poolItemId} profile=${profile}`,
          );
          continue;
        }

        // Slow path: record variant as queued (not yet ready) and fire
        // normalization in the background. Variant will be updated on completion.
        bootstrapPoolRepository.upsertProfileVariant({
          poolItemId: item.poolItemId,
          profile,
          playablePath: item.path, // placeholder — updated when ready
          isReady: false,
          isStale: false,
          lastError: null,
        });
        queued += 1;

        // Fire and forget — normalization queue manages concurrency
        void ensureElectronPlayablePath(item.path)
          .then((normalizedPath) => {
            bootstrapPoolRepository.upsertProfileVariant({
              poolItemId: item.poolItemId,
              profile,
              playablePath: normalizedPath,
              isReady: true,
              isStale: false,
              lastPreparedAt: Math.floor(Date.now() / 1000),
              lastValidationAt: Math.floor(Date.now() / 1000),
            });
            console.log(
              `[BootstrapPrewarm] Variant ready poolItemId=${item.poolItemId} profile=${profile}`,
            );
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            bootstrapPoolRepository.upsertProfileVariant({
              poolItemId: item.poolItemId,
              profile,
              playablePath: item.path,
              isReady: false,
              isStale: false,
              lastError: message,
            });
            console.error(
              `[BootstrapPrewarm] Variant failed poolItemId=${item.poolItemId} profile=${profile}: ${message}`,
            );
          });

        console.log(
          `[BootstrapPrewarm] Queued normalization poolItemId=${item.poolItemId} profile=${profile}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[BootstrapPrewarm] Processing error poolItemId=${item.poolItemId} profile=${profile}: ${message}`,
        );
        failed += 1;
      }
    }
  }

  console.log(
    `[BootstrapPrewarm] Dispatch complete queued=${queued} reused=${reused} failed=${failed}`,
  );

  return { queued, reused, failed };
}
