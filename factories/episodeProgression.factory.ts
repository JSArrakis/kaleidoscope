import { randomUUID } from "crypto";

/**
 * Factory function to create EpisodeProgression with default values
 */
export function createEpisodeProgression(
  overrides?: Partial<EpisodeProgression>
): EpisodeProgression {
  const id = randomUUID();
  return {
    episodeProgressionId: overrides?.episodeProgressionId ?? id,
    showItemId: overrides?.showItemId ?? randomUUID(),
    streamType: overrides?.streamType ?? "Cont",
    currentEpisodeNumber: overrides?.currentEpisodeNumber ?? 1,
    totalEpisodes: overrides?.totalEpisodes ?? 10,
    lastPlayedDate: overrides?.lastPlayedDate ?? new Date().toISOString(),
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
  };
}