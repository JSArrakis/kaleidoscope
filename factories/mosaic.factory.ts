import { randomUUID } from "crypto";

/**
 * Factory function to create a Mosaic with constructor-style parameters
 */
export function createMosaic(
  name?: string,
  mosaicId?: string,
  facetId?: string,
  musicalGenres?: string[],
  description?: string,
): Mosaic {
  const id = mosaicId ?? randomUUID();
  return {
    mosaicId: id,
    facetId: facetId ?? randomUUID(),
    musicalGenres: musicalGenres ?? [
      "tag-jazz-001",
      "tag-blues-001",
      "tag-soul-001",
    ],
    name: name ?? `Test Mosaic ${id.substring(0, 8)}`,
    description: description ?? `Test mosaic description`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
