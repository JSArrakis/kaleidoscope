import {
  bootstrapPoolRepository,
  BootstrapProfile,
} from "../../repositories/bootstrapPoolRepository.js";
import { bootstrapLogger } from "./bootstrapLogger.js";

// ── Config ────────────────────────────────────────────────────────────────

/** Default cooldown before the same bootstrap item can be used again (6h). */
const DEFAULT_COOLDOWN_SECONDS = 6 * 60 * 60;

// ── Types ──────────────────────────────────────────────────────────────────

export interface BootstrapStartupCandidate {
  poolItemId: string;
  mediaItemId: string;
  mediaType: "Movie" | "Episode";
  playablePath: string;
}

// ── Selector ──────────────────────────────────────────────────────────────

/**
 * Returns a random bootstrap pool candidate that is ready for the requested
 * profile and not in cooldown.
 *
 * Rotation policy:
 * - Randomly selects from eligible items (ready, not in cooldown window).
 * - If all items are in cooldown, falls back to the least recently used item.
 * - Returns null if the pool is empty or no variants are ready.
 *
 * Caller is responsible for calling recordBootstrapFirstAnchorUsed() after
 * the item has been committed to a stream so that cooldown rotation is applied.
 */
export function selectBootstrapFirstAnchor(input: {
  profile: BootstrapProfile;
  now: number;
  cooldownSeconds?: number;
}): BootstrapStartupCandidate | null {
  const cooldownSeconds = input.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;

  bootstrapLogger.logBootstrapSelectionAttempt({
    profile: input.profile,
    cooldownSeconds,
  });

  // Try eligible candidates (ready + not in cooldown)
  const eligible = bootstrapPoolRepository.findStartupCandidates({
    profile: input.profile,
    cooldownSeconds,
    now: input.now,
  });

  if (eligible.length > 0) {
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    console.log(
      `[BootstrapSelector] Selected from eligible pool poolItemId=${chosen.poolItemId} profile=${input.profile} eligibleCount=${eligible.length}`,
    );

    bootstrapLogger.logBootstrapSelectionSuccess({
      poolItemId: chosen.poolItemId,
      mediaItemId: chosen.mediaItemId,
      mediaType: chosen.mediaType,
      playablePath: chosen.playablePath,
      requiresPreparation: false,
    });

    return {
      poolItemId: chosen.poolItemId,
      mediaItemId: chosen.mediaItemId,
      mediaType: chosen.mediaType,
      playablePath: chosen.playablePath,
    };
  }

  // Fallback: all items in cooldown — pick least recently used
  const lru = bootstrapPoolRepository.findLeastRecentlyUsedCandidate(
    input.profile,
  );

  if (lru) {
    console.log(
      `[BootstrapSelector] All items in cooldown; using LRU fallback poolItemId=${lru.poolItemId} profile=${input.profile}`,
    );

    bootstrapLogger.logBootstrapSelectionSuccess({
      poolItemId: lru.poolItemId,
      mediaItemId: lru.mediaItemId,
      mediaType: lru.mediaType,
      playablePath: lru.playablePath,
      requiresPreparation: false,
    });

    return {
      poolItemId: lru.poolItemId,
      mediaItemId: lru.mediaItemId,
      mediaType: lru.mediaType,
      playablePath: lru.playablePath,
    };
  }

  console.log(
    `[BootstrapSelector] No ready bootstrap candidates available for profile=${input.profile}`,
  );
  bootstrapLogger.logBootstrapSelectionFallback(
    "No ready candidates available in pool",
  );
  return null;
}

/**
 * Records that a bootstrap item was used as the first anchor for a stream.
 * Updates lastUsedAt for cooldown rotation tracking.
 */
export function recordBootstrapFirstAnchorUsed(
  poolItemId: string,
  now: number,
): void {
  bootstrapPoolRepository.setLastUsedAt(poolItemId, now);
  console.log(
    `[BootstrapSelector] Recorded usage poolItemId=${poolItemId} at=${now}`,
  );

  bootstrapLogger.logBootstrapAnchorUsageRecorded({
    poolItemId,
    timestamp: now,
  });
}
