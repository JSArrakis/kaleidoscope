import { BaseMedia } from '../models/mediaInterface';
import { MediaTag, TagType } from '../models/const/tagTypes';
import { Facet } from '../models/facet';
import { Tag } from '../models/tag';
import { FacetRepository } from '../repositories/facetRepository';
import { CommercialRepository } from '../repositories/commercialRepository';
import { ShortRepository } from '../repositories/shortRepository';
import { MusicRepository } from '../repositories/musicRepository';

/**
 * Buffer Media Pre-Filter Service
 *
 * This service pre-filters buffer media based on:
 * 1. Facet distance relationships (close facets get priority)
 * 2. Specialty tag matching (exact specialty tag matches)
 * 3. Repository-level exclusion (recently used filtering)
 *
 * The goal is to bring in buffer media that's contextually relevant
 * before passing it to the spectrum for final selection.
 */

export interface BufferFilterContext {
  // The main media we're creating buffers for
  mainMedia: BaseMedia;
  // Maximum facet distance to include (0 = exact match, higher = more distant)
  maxFacetDistance?: number;
  // Hours to look back for exclusion
  exclusionHours?: number;
  // Whether to include specialty tag matches even if facet distance is high
  includeSpecialtyMatches?: boolean;
}

export interface FilteredBufferMedia {
  // Media organized by selection priority
  exactFacetMatches: BaseMedia[];
  nearFacetMatches: BaseMedia[];
  distantFacetMatches: BaseMedia[];
  specialtyMatches: BaseMedia[];
  fallbackMedia: BaseMedia[];
  // Metadata about the filtering
  sourceGenre?: string;
  sourceAesthetic?: string;
  sourceSpecialtyTags: string[];
}

/**
 * Pre-filters buffer media based on facet distance and specialty tag matching
 */
export async function preFilterBufferMedia(
  context: BufferFilterContext,
): Promise<FilteredBufferMedia> {
  const facetRepo = new FacetRepository();
  const commercialRepo = new CommercialRepository();
  const shortRepo = new ShortRepository();
  const musicRepo = new MusicRepository();

  // Extract facet information from main media
  const mainFacetData = extractMainMediaFacetData(context.mainMedia);
  const specialtyTags = extractSpecialtyTags(context.mainMedia);

  const result: FilteredBufferMedia = {
    exactFacetMatches: [],
    nearFacetMatches: [],
    distantFacetMatches: [],
    specialtyMatches: [],
    fallbackMedia: [],
    sourceGenre: mainFacetData?.genre,
    sourceAesthetic: mainFacetData?.aesthetic,
    sourceSpecialtyTags: specialtyTags,
  };

  // 1. Handle exact facet matches (distance = 0)
  if (mainFacetData) {
    const exactFacet = await findFacetByGenreAesthetic(
      facetRepo,
      mainFacetData.genre,
      mainFacetData.aesthetic,
    );

    if (exactFacet) {
      const exactMatches = await getBufferMediaForFacet(
        exactFacet,
        commercialRepo,
        shortRepo,
        musicRepo,
        context.exclusionHours || 2,
      );
      result.exactFacetMatches = exactMatches;

      // 2. Get related facets through distance relationships
      const relatedFacets = await getRelatedFacetsByDistance(
        facetRepo,
        exactFacet.facetId,
        context.maxFacetDistance || 3,
      );

      for (const { facet, distance } of relatedFacets) {
        const relatedMedia = await getBufferMediaForFacet(
          facet,
          commercialRepo,
          shortRepo,
          musicRepo,
          context.exclusionHours || 2,
        );

        // Categorize by distance
        if (distance <= 1) {
          result.nearFacetMatches.push(...relatedMedia);
        } else {
          result.distantFacetMatches.push(...relatedMedia);
        }
      }
    }
  }

  // 3. Handle specialty tag matches
  if (context.includeSpecialtyMatches !== false && specialtyTags.length > 0) {
    const specialtyMatches = await getBufferMediaBySpecialtyTags(
      specialtyTags,
      commercialRepo,
      shortRepo,
      musicRepo,
      context.exclusionHours || 2,
    );
    result.specialtyMatches = specialtyMatches;
  }

  // 4. Fallback media (random selection from available buffer media)
  const fallbackMedia = await getRandomBufferMedia(
    commercialRepo,
    shortRepo,
    musicRepo,
    context.exclusionHours || 2,
    100, // Limit fallback selection
  );
  result.fallbackMedia = fallbackMedia;

  return result;
}

/**
 * Extracts genre and aesthetic information from main media
 */
function extractMainMediaFacetData(
  mainMedia: BaseMedia,
): { genre: string; aesthetic: string } | null {
  if (!mainMedia.tags) return null;

  let genre = '';
  let aesthetic = '';

  for (const tag of mainMedia.tags) {
    const tagName = getTagName(tag);
    const tagType = getTagType(tag);

    if (tagType === TagType.Genre) {
      genre = tagName;
    } else if (tagType === TagType.Aesthetic) {
      aesthetic = tagName;
    }

    if (genre && aesthetic) break;
  }

  return genre && aesthetic ? { genre, aesthetic } : null;
}

/**
 * Extracts specialty tags from main media
 */
function extractSpecialtyTags(mainMedia: BaseMedia): string[] {
  if (!mainMedia.tags) return [];

  return mainMedia.tags
    .filter(tag => getTagType(tag) === TagType.Specialty)
    .map(tag => getTagName(tag));
}

/**
 * Finds a facet by genre and aesthetic combination
 */
async function findFacetByGenreAesthetic(
  facetRepo: FacetRepository,
  genre: string,
  aesthetic: string,
): Promise<Facet | null> {
  // For now, we'll need to get all facets and filter
  // In the future, you might want to add a specific query method to FacetRepository
  const allFacets = facetRepo.findAll();
  return (
    allFacets.find(
      f => f.genre.name === genre && f.aesthetic.name === aesthetic,
    ) || null
  );
}

/**
 * Gets related facets by distance relationships
 */
async function getRelatedFacetsByDistance(
  facetRepo: FacetRepository,
  sourceFacetId: string,
  maxDistance: number,
): Promise<Array<{ facet: Facet; distance: number }>> {
  const distances = facetRepo.findAllDistancesFrom(sourceFacetId);
  const results: Array<{ facet: Facet; distance: number }> = [];

  for (const { targetFacetId, distance } of distances) {
    if (distance <= maxDistance) {
      const facet = facetRepo.findByFacetId(targetFacetId);
      if (facet) {
        results.push({ facet, distance });
      }
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Gets buffer media for a specific facet
 */
async function getBufferMediaForFacet(
  facet: Facet,
  commercialRepo: CommercialRepository,
  shortRepo: ShortRepository,
  musicRepo: MusicRepository,
  exclusionHours: number,
): Promise<BaseMedia[]> {
  const tags = [facet.genre.name, facet.aesthetic.name];
  const bufferMedia: BaseMedia[] = [];

  // Get buffer media from each repository
  const commercials = commercialRepo.findBufferCommercialsByTags(
    tags,
    exclusionHours,
  );
  const shorts = shortRepo.findBufferShortsByTags(tags, exclusionHours);

  // Note: Music repository might not have the same method yet
  // const music = musicRepo.findBufferMusicByTags(tags, exclusionHours);

  bufferMedia.push(...commercials, ...shorts);
  return bufferMedia;
}

/**
 * Gets buffer media by specialty tags
 */
async function getBufferMediaBySpecialtyTags(
  specialtyTags: string[],
  commercialRepo: CommercialRepository,
  shortRepo: ShortRepository,
  musicRepo: MusicRepository,
  exclusionHours: number,
): Promise<BaseMedia[]> {
  const bufferMedia: BaseMedia[] = [];

  // Get media that matches any of the specialty tags
  for (const tag of specialtyTags) {
    const commercials = commercialRepo.findBufferCommercialsByTags(
      [tag],
      exclusionHours,
    );
    const shorts = shortRepo.findBufferShortsByTags([tag], exclusionHours);

    bufferMedia.push(...commercials, ...shorts);
  }

  // Remove duplicates
  const uniqueMedia = removeDuplicateMedia(bufferMedia);
  return uniqueMedia;
}

/**
 * Gets random buffer media as fallback
 */
async function getRandomBufferMedia(
  commercialRepo: CommercialRepository,
  shortRepo: ShortRepository,
  musicRepo: MusicRepository,
  exclusionHours: number,
  limit: number,
): Promise<BaseMedia[]> {
  const bufferMedia: BaseMedia[] = [];

  // Get random buffer media (without specific tag filtering)
  // This would need new repository methods that don't filter by tags
  // For now, we'll use empty tag arrays which should return random results
  const commercials = commercialRepo.findBufferCommercialsByTags(
    [],
    exclusionHours,
  );
  const shorts = shortRepo.findBufferShortsByTags([], exclusionHours);

  bufferMedia.push(...commercials, ...shorts);

  // Shuffle and limit
  const shuffled = shuffleArray(bufferMedia);
  return shuffled.slice(0, limit);
}

/**
 * Removes duplicate media items based on mediaItemId
 */
function removeDuplicateMedia(media: BaseMedia[]): BaseMedia[] {
  const seen = new Set<string>();
  return media.filter(item => {
    if (seen.has(item.mediaItemId)) {
      return false;
    }
    seen.add(item.mediaItemId);
    return true;
  });
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a prioritized list of buffer media for spectrum processing
 */
export function createPrioritizedBufferList(
  filtered: FilteredBufferMedia,
): BaseMedia[] {
  const prioritized: BaseMedia[] = [];

  // Priority order: exact -> near -> specialty -> distant -> fallback
  prioritized.push(...filtered.exactFacetMatches);
  prioritized.push(...filtered.nearFacetMatches);
  prioritized.push(...filtered.specialtyMatches);
  prioritized.push(...filtered.distantFacetMatches);
  prioritized.push(...filtered.fallbackMedia);

  // Remove duplicates while preserving order
  return removeDuplicateMedia(prioritized);
}

/**
 * Utility function to get tag name regardless of whether it's a string or Tag object
 */
function getTagName(tag: MediaTag): string {
  return typeof tag === 'string' ? tag : (tag as Tag).name;
}

/**
 * Utility function to get tag type
 */
function getTagType(tag: MediaTag): TagType | null {
  return typeof tag === 'string' ? null : (tag as Tag).type;
}
