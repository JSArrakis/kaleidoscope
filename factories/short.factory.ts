import { randomUUID } from "crypto";

/**
 * Factory function to create a Short with constructor-style parameters
 */
export function createShort(
  title?: string,
  mediaItemId?: string,
  duration?: number,
  path?: string,
  type?: MediaType,
  tags?: any[]
): Short {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Short ${id.substring(0, 8)}`,
    path: path ?? `/media/shorts/test-${id.substring(0, 8)}.mp4`,
    duration: duration ?? 300,
    type: type ?? MediaType.Short,
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}