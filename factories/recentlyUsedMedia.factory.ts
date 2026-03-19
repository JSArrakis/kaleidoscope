import { randomUUID } from "crypto";

/**
 * Factory function to create RecentlyUsedMedia with default values
 */
export function createRecentlyUsedMedia(
  overrides?: Partial<RecentlyUsedMedia>
): RecentlyUsedMedia {
  const id = randomUUID();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    recentlyUsedMediaId: overrides?.recentlyUsedMediaId ?? id,
    mediaItemId: overrides?.mediaItemId ?? randomUUID(),
    mediaType: overrides?.mediaType ?? "Movie",
    lastUsedDate: overrides?.lastUsedDate ?? now.toISOString(),
    usageCount: overrides?.usageCount ?? 1,
    expirationDate: overrides?.expirationDate ?? tomorrow.toISOString(),
    createdAt: overrides?.createdAt ?? now.toISOString(),
    updatedAt: overrides?.updatedAt ?? now.toISOString(),
  };
}