import { randomUUID } from "crypto";

/**
 * Factory function to create a Commercial with constructor-style parameters
 */
export function createCommercial(
  title?: string,
  mediaItemId?: string,
  duration?: number,
  path?: string,
  type?: MediaType,
  tags?: Tag[],
  isHolidayExclusive?: boolean,
): Commercial {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Commercial ${id.substring(0, 8)}`,
    duration: duration ?? 30,
    path: path ?? `/media/commercials/test-${id.substring(0, 8)}.mp4`,
    isHolidayExclusive: isHolidayExclusive ?? false,
    type: type ?? MediaType.Commercial,
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
