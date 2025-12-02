import { randomUUID } from "crypto";

/**
 * Factory function to create a Promo with constructor-style parameters
 */
export function createPromo(
  title?: string,
  mediaItemId?: string,
  duration?: number,
  path?: string,
  type?: MediaType,
  tags?: any[]
): Promo {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Promo ${id.substring(0, 8)}`,
    path: path ?? `/media/promos/test-${id.substring(0, 8)}.mp4`,
    duration: duration ?? 60,
    type: type ?? MediaType.Promo,
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}