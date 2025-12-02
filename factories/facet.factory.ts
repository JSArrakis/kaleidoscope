import { randomUUID } from "crypto";

/**
 * Factory function to create a Facet with constructor-style parameters
 */
export function createFacet(
  facetId?: string,
  genreTagId?: string,
  aestheticTagId?: string,
  genre?: Tag,
  aesthetic?: Tag,
  distanceFromGenre?: number,
  distanceFromAesthetic?: number
): Facet {
  const id = facetId ?? randomUUID();
  return {
    facetId: id,
    genreTagId: genreTagId ?? randomUUID(),
    aestheticTagId: aestheticTagId ?? randomUUID(),
    genre,
    aesthetic,
    distanceFromGenre: distanceFromGenre ?? 0,
    distanceFromAesthetic: distanceFromAesthetic ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}