import { randomUUID } from "crypto";

/**
 * Factory function to create EpisodeProgression with default values
 */
export function createEpisodeProgression(
  overrides?: Partial<EpisodeProgression>,
): EpisodeProgression {
  return {
    id: overrides?.id,
    showItemId: overrides?.showItemId ?? randomUUID(),
    streamType: overrides?.streamType ?? "Cont",
    currentEpisodeNumber: overrides?.currentEpisodeNumber ?? 1,
    lastPlayedTimestamp: overrides?.lastPlayedTimestamp ?? Date.now(),
    nextEpisodeDurationLimit: overrides?.nextEpisodeDurationLimit ?? 0,
    nextEpisodeOverDuration: overrides?.nextEpisodeOverDuration ?? false,
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
  };
}
