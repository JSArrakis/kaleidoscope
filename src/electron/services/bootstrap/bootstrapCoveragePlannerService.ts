import { randomUUID } from "crypto";
import {
  bootstrapPoolRepository,
  BootstrapProfile,
  BootstrapMissingReason,
} from "../../repositories/bootstrapPoolRepository.js";
import { normalizationDefaults } from "../normalization/normalizationDefaults.js";

// ── Config defaults ────────────────────────────────────────────────────────

const BOOTSTRAP_PROFILES: BootstrapProfile[] = ["native", "plex", "jellyfin"];

// ── Types ──────────────────────────────────────────────────────────────────

export type BootstrapCoveragePlanResult = {
  runId: string;
  representedTags: number;
  coveredTags: number;
  missingTags: Array<{
    tagId: string;
    tagType: "Genre" | "Aesthetic";
    reason: BootstrapMissingReason;
  }>;
  selectedPoolItems: number;
  queuedVariantJobs: number;
  durationMs: number;
};

interface SelectedPoolItem {
  poolItemId: string;
  mediaItemId: string;
  mediaType: "Movie" | "Episode";
  coveredTagIds: string[];
  path: string;
}

// ── Rebuild lock: prevent concurrent runs ─────────────────────────────────

let isRebuilding = false;

// ── Main planner ──────────────────────────────────────────────────────────

/**
 * Rebuilds the bootstrap coverage pool.
 *
 * Algorithm:
 * 1. Build the set of all represented genre/aesthetic tags (attached to ≥1 anchor)
 * 2. Greedy selection: while uncovered tags remain, pick one tag and randomly
 *    select an eligible anchor media item that covers it; mark all tags on that
 *    item as covered.
 * 3. Persist pool and tag coverage mapping to DB.
 * 4. Return counts for diagnostics/IPC.
 *
 * Profiles scope is fixed to ["native", "plex", "jellyfin"] by default.
 * Profile-specific prewarm is handled separately in bootstrapVariantPrewarmService.
 */
export async function rebuildBootstrapCoveragePool(input?: {
  profiles?: BootstrapProfile[];
  seed?: number;
}): Promise<BootstrapCoveragePlanResult> {
  if (isRebuilding) {
    throw new Error(
      "[BootstrapPlanner] A rebuild is already in progress; skipping concurrent request",
    );
  }

  isRebuilding = true;
  const startMs = Date.now();
  const { runId } = bootstrapPoolRepository.beginCoverageRun();

  try {
    const profiles = input?.profiles ?? BOOTSTRAP_PROFILES;
    const result = await runPlannerCycle(runId, profiles, startMs);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    bootstrapPoolRepository.failCoverageRun(runId, message);
    console.error(`[BootstrapPlanner] Rebuild failed: ${message}`);
    throw error;
  } finally {
    isRebuilding = false;
  }
}

export function isBootstrapRebuildInProgress(): boolean {
  return isRebuilding;
}

// ── Internal planner cycle ────────────────────────────────────────────────

async function runPlannerCycle(
  runId: string,
  profiles: BootstrapProfile[],
  startMs: number,
): Promise<BootstrapCoveragePlanResult> {
  console.log(`[BootstrapPlanner] Starting coverage run runId=${runId}`);

  // Step 1: Fetch represented tags from DB (derived query, no counter drift)
  const representedTagRows = bootstrapPoolRepository.findRepresentedTags();
  const representedTagCount = representedTagRows.length;

  console.log(
    `[BootstrapPlanner] Found ${representedTagCount} represented genre/aesthetic tags`,
  );

  if (representedTagCount === 0) {
    // No anchor-associated tags at all — pool is vacuously covered
    bootstrapPoolRepository.clearPool();
    bootstrapPoolRepository.completeCoverageRun({
      runId,
      completedAt: Math.floor(Date.now() / 1000),
      durationMs: Date.now() - startMs,
      representedTagCount: 0,
      coveredTagCount: 0,
      missingTagCount: 0,
      selectedItemCount: 0,
      queuedVariantJobs: 0,
    });
    return {
      runId,
      representedTags: 0,
      coveredTags: 0,
      missingTags: [],
      selectedPoolItems: 0,
      queuedVariantJobs: 0,
      durationMs: Date.now() - startMs,
    };
  }

  // Step 2: Greedy coverage selection
  const uncoveredTagIds = new Set(representedTagRows.map((r) => r.tagId));
  const selectedItems: SelectedPoolItem[] = [];
  const selectedMediaIds = new Set<string>();
  const missingTags: Array<{
    tagId: string;
    tagType: "Genre" | "Aesthetic";
    reason: BootstrapMissingReason;
  }> = [];

  for (const tagRow of representedTagRows) {
    if (!uncoveredTagIds.has(tagRow.tagId)) {
      // Already covered by a previously selected item
      continue;
    }

    const candidate = bootstrapPoolRepository.findRandomEligibleAnchorByTag({
      tagId: tagRow.tagId,
      excludedMediaItemIds: [...selectedMediaIds],
    });

    if (!candidate) {
      // No eligible anchor exists for this tag (all excluded or none present)
      missingTags.push({
        tagId: tagRow.tagId,
        tagType: tagRow.tagType,
        reason: "no_anchor_association",
      });
      uncoveredTagIds.delete(tagRow.tagId);
      continue;
    }

    const poolItemId = randomUUID();
    const coveredTagIds = candidate.tags
      .filter((t) => t.type === "Genre" || t.type === "Aesthetic")
      .map((t) => t.tagId);

    selectedItems.push({
      poolItemId,
      mediaItemId: candidate.mediaItemId,
      mediaType: candidate.mediaType,
      coveredTagIds,
      path: candidate.path,
    });

    selectedMediaIds.add(candidate.mediaItemId);

    // Mark all tags on this item as covered
    for (const coveredTagId of coveredTagIds) {
      uncoveredTagIds.delete(coveredTagId);
    }

    console.log(
      `[BootstrapPlanner] Selected ${candidate.mediaType} mediaItemId=${candidate.mediaItemId} covering ${coveredTagIds.length} tag(s)`,
    );
  }

  const coveredTagCount =
    representedTagCount - uncoveredTagIds.size - missingTags.length;

  // Step 3: Persist pool
  bootstrapPoolRepository.clearPool();

  for (const item of selectedItems) {
    bootstrapPoolRepository.upsertPoolItem({
      poolItemId: item.poolItemId,
      mediaItemId: item.mediaItemId,
      mediaType: item.mediaType,
    });

    bootstrapPoolRepository.replacePoolItemTags(
      item.poolItemId,
      item.coveredTagIds.map((tagId) => {
        const tagRow = representedTagRows.find((r) => r.tagId === tagId);
        return {
          tagId,
          tagType: tagRow?.tagType ?? "Genre",
        };
      }),
    );
  }

  // Step 4: Record missing tags
  bootstrapPoolRepository.replaceMissingTags(runId, missingTags);

  // Variant jobs will be queued by bootstrapVariantPrewarmService separately.
  // Count = pool items × active profiles as planned work.
  const queuedVariantJobs = selectedItems.length * profiles.length;

  const durationMs = Date.now() - startMs;
  const completedAt = Math.floor(Date.now() / 1000);

  bootstrapPoolRepository.completeCoverageRun({
    runId,
    completedAt,
    durationMs,
    representedTagCount,
    coveredTagCount:
      coveredTagCount +
      (representedTagCount - coveredTagCount - uncoveredTagIds.size),
    missingTagCount: missingTags.length,
    selectedItemCount: selectedItems.length,
    queuedVariantJobs,
  });

  console.log(
    `[BootstrapPlanner] Run complete runId=${runId} represented=${representedTagCount} covered=${coveredTagCount} missing=${missingTags.length} poolItems=${selectedItems.length} durationMs=${durationMs}`,
  );

  return {
    runId,
    representedTags: representedTagCount,
    coveredTags: coveredTagCount,
    missingTags,
    selectedPoolItems: selectedItems.length,
    queuedVariantJobs,
    durationMs,
  };
}

// Expose defaults for callers
export { BOOTSTRAP_PROFILES };
export { normalizationDefaults };
