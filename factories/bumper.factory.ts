import { randomUUID } from "crypto";
import { createTags } from "./tag.factory.js";

/**
 * Factory function to create a Bumper with constructor-style parameters
 */
export function createBumper(
  title?: string,
  mediaItemId?: string,
  duration?: number,
  path?: string,
  tags?: any[]
): Bumper {
  const id = mediaItemId ?? randomUUID();
  return {
    mediaItemId: id,
    title: title ?? `Test Bumper ${id.substring(0, 8)}`,
    path: path ?? `/media/bumpers/test-${id.substring(0, 8)}.mp4`,
    duration: duration ?? 10,
    tags: tags ?? createTags(1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
