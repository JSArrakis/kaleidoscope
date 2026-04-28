import { facetRepository } from "../repositories/facetRepository.js";
import { randomUUID } from "crypto";

export function getFacetsHandler(): Facet[] {
  return facetRepository.findAll();
}

export function createFacetHandler(
  genre: Tag | null,
  aesthetic: Tag | null,
): { message: string; status: number } {
  try {
    const newFacet: Facet = {
      facetId: randomUUID(),
      genre,
      aesthetic,
      facetRelationships: [],
    };
    facetRepository.create(newFacet);
    const genreLabel = genre?.name ?? "Default";
    const aestheticLabel = aesthetic?.name ?? "Default";
    return {
      message: `Facet "${genreLabel} + ${aestheticLabel}" created`,
      status: 200,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteFacetHandler(facetId: string): {
  message: string;
  status: number;
} {
  try {
    const deleted = facetRepository.delete(facetId);
    if (!deleted) {
      return { message: "Facet not found", status: 404 };
    }
    return { message: "Facet deleted", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function addFacetRelationshipHandler(
  request: FacetRelationshipRequest,
): { message: string; status: number } {
  try {
    facetRepository.addRelationship(
      request.sourceFacetId,
      request.targetFacetId,
      request.distance,
    );
    return { message: "Relationship added", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}

export function deleteFacetRelationshipHandler(
  request: FacetRelationshipDeleteRequest,
): { message: string; status: number } {
  try {
    facetRepository.deleteRelationship(
      request.sourceFacetId,
      request.targetFacetId,
    );
    return { message: "Relationship deleted", status: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { message: errorMessage, status: 400 };
  }
}
