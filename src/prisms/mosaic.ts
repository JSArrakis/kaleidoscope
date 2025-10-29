/**
 * Mosaic Prism - Music Video Selection with Facet-Based Tag Priority System
 *
 * This prism associates musical genres with different facets where:
 * - Facets → Mosaic Objects → Musical Genres → Music Videos
 * - Tag Priority: Explicit priority system (Age Group=1 → Holiday=2 → Specialty=3 → Musical Genre=4 → Era=5)
 * - Age Group Integration: Dynamically loads age groups from database with sequence support
 * - Era Integration: Dynamically loads eras from database (user-defined, no sequence)
 * - Holiday Integration: Matches music videos with same holiday tags as currently active holidays
 * - Type-Based Detection: Uses tag.type field for accurate categorization (no string matching)
 * - Musical Genre Detection: Processes musical genres (rock, pop, jazz) for music videos
 * - Facet Separation: Ignores cinematic genres and aesthetics (handled by facet-to-mosaic relationships)
 * - Controlled Chaos: Specialty matching probability prevents predictable selections
 * - Hard Migration: All tags must be Tag objects with type field (no legacy string support)
 *
 * Note: Age groups have sequence numbers for progression/regression between adjacent age groups
 */

import { mosaicRepository } from '../repositories/mosaicRepository';
import { musicRepository } from '../repositories/musicRepository';
import { recentlyUsedMediaRepository } from '../repositories/recentlyUsedMediaRepository';
import { tagRepository } from '../repositories/tagsRepository';
import { BaseMedia } from '../models/mediaInterface';
import { Mosaic } from '../models/mosaic';
import { TagType } from '../models/const/tagTypes';
import { getTagName } from './core';
import {
  getActiveHolidayNames,
  hasActiveHolidays,
} from '../services/holidayService';

export interface MosaicPrismOptions {
  maxDurationMinutes?: number; // Maximum duration for music videos
  usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer';
  streamSessionId?: string;
  specialtyMatchProbability?: number; // 0.0-1.0, chance to use specialty matches (default: 0.7)
}

export interface MosaicPrismResult {
  selectedMusic?: BaseMedia | null;
  mosaic?: Mosaic | null;
  selectedGenres: string[];
  selectionReason: string;
  tagPriorityUsed: string; // Which tag priority level was used for selection
}

// Priority order mapping for tag types (lower number = higher priority)
const TAG_TYPE_PRIORITY_ORDER: Record<TagType, number> = {
  [TagType.AgeGroup]: 1, // Highest priority
  [TagType.Holiday]: 2,
  [TagType.Specialty]: 3,
  [TagType.MusicalGenre]: 4,
  [TagType.Era]: 5, // Lowest priority
  [TagType.Genre]: 999, // Ignored (handled by facets)
  [TagType.Aesthetic]: 999, // Ignored (handled by facets)
};

// Get tag types in priority order from highest to lowest priority
export function getTagTypesInPriorityOrder(): TagType[] {
  return Object.entries(TAG_TYPE_PRIORITY_ORDER)
    .filter(([, priority]) => priority < 999) // Exclude ignored types
    .sort(([, a], [, b]) => a - b)
    .map(([tagType]) => tagType as TagType);
}

// Extract tags by priority from media
export function extractTagsByPriority(
  media: BaseMedia,
): Map<TagType, string[]> {
  const tagsByPriority = new Map<TagType, string[]>();

  if (!media.tags) return tagsByPriority;

  // Initialize all priority levels
  getTagTypesInPriorityOrder().forEach(tagType => {
    tagsByPriority.set(tagType, []);
  });

  // Categorize tags by their type field - all tags are now Tag objects
  media.tags.forEach(tag => {
    // All tags should be Tag objects with type field
    if (typeof tag === 'string') {
      throw new Error(
        `Legacy string tag found: "${tag}". All tags must be Tag objects with type field.`,
      );
    }

    const tagName = tag.name;
    if (!tagName) return; // Skip tags without names

    // Use the tag's type field to categorize
    switch (tag.type) {
      case TagType.AgeGroup:
        tagsByPriority.get(TagType.AgeGroup)!.push(tagName);
        break;
      case TagType.Holiday:
        // Only include if holiday is currently active
        if (hasActiveHolidays()) {
          const activeHolidayNames = getActiveHolidayNames();
          if (activeHolidayNames.includes(tag.name)) {
            tagsByPriority.get(TagType.Holiday)!.push(tagName);
          }
        }
        break;
      case TagType.Era:
        tagsByPriority.get(TagType.Era)!.push(tagName);
        break;
      case TagType.MusicalGenre:
        tagsByPriority.get(TagType.MusicalGenre)!.push(tagName);
        break;
      case TagType.Specialty:
        tagsByPriority.get(TagType.Specialty)!.push(tagName);
        break;
      case TagType.Genre:
      case TagType.Aesthetic:
        // Skip cinematic genres and aesthetics - handled by facets
        break;
      default:
        // Unknown tag types go to specialty
        tagsByPriority.get(TagType.Specialty)!.push(tagName);
        break;
    }
  });

  return tagsByPriority;
}

// Helper to get age groups with sequence for adjacency logic (if needed)
export function getAgeGroupsWithSequence(): Array<{
  name: string;
  sequence: number;
}> {
  const ageGroups = tagRepository.findAllAgeGroups();
  return ageGroups
    .map(ag => ({
      name: ag.name,
      sequence: ag.sequence || 0,
    }))
    .sort((a, b) => a.sequence - b.sequence);
}

// Find music videos that match the tag criteria with priority filtering
export async function findMusicVideosWithPriority(
  tagsByPriority: Map<TagType, string[]>,
  targetMusicalGenres: string[],
  options: MosaicPrismOptions = {},
): Promise<{ candidates: BaseMedia[]; priorityUsed: TagType | null }> {
  const { maxDurationMinutes, usageContext = 'main_content' } = options;

  // Get recently used music to exclude
  const recentMusicIds = recentlyUsedMediaRepository.getRecentlyUsedMediaIds(
    'music',
    usageContext,
    24, // hours back
  );

  const allMusic = musicRepository.findAll();
  let candidates: BaseMedia[] = [];
  let priorityUsed: TagType | null = null;

  // Try each priority level from most to least important
  const priorities = getTagTypesInPriorityOrder();

  for (const priority of priorities) {
    const tagsForPriority = tagsByPriority.get(priority) || [];
    if (tagsForPriority.length === 0) continue;

    // Find music that matches this priority level
    for (const music of allMusic) {
      // Skip recently used
      if (recentMusicIds.includes(music.mediaItemId)) continue;

      // Duration filter
      if (maxDurationMinutes && music.duration / 60 > maxDurationMinutes)
        continue;

      const musicTagNames = (music.tags || []).map(tag => getTagName(tag));

      // Must contain at least one musical genre from our target list
      const hasTargetGenre = targetMusicalGenres.some(genre =>
        musicTagNames.some(
          musicTag =>
            musicTag && musicTag.toLowerCase().includes(genre.toLowerCase()),
        ),
      );
      if (!hasTargetGenre) continue;

      // Check if this music matches the current priority level
      const matchesCurrentPriority = tagsForPriority.some(priorityTag =>
        musicTagNames.some(
          musicTag =>
            musicTag &&
            musicTag.toLowerCase().includes(priorityTag.toLowerCase()),
        ),
      );

      if (matchesCurrentPriority) {
        candidates.push(music as BaseMedia);
      }
    }

    // If we found candidates at this priority level, use them
    if (candidates.length > 0) {
      priorityUsed = priority;
      break;
    }
  }

  // If no priority-matched candidates, fall back to just musical genre matching
  if (candidates.length === 0) {
    for (const music of allMusic) {
      if (recentMusicIds.includes(music.mediaItemId)) continue;
      if (maxDurationMinutes && music.duration / 60 > maxDurationMinutes)
        continue;

      const musicTagNames = (music.tags || []).map(tag => getTagName(tag));

      const hasTargetGenre = targetMusicalGenres.some(genre =>
        musicTagNames.some(
          musicTag =>
            musicTag && musicTag.toLowerCase().includes(genre.toLowerCase()),
        ),
      );

      if (hasTargetGenre) {
        candidates.push(music as BaseMedia);
      }
    }
    priorityUsed = TagType.MusicalGenre; // Fallback priority
  }

  return { candidates, priorityUsed };
}

// Main mosaic prism function
export async function selectMusicFromFacets(
  facetIds: string[],
  adjacentMedia: BaseMedia[], // The media that will be adjacent to the selected music
  options: MosaicPrismOptions = {},
): Promise<MosaicPrismResult> {
  if (facetIds.length === 0) {
    return {
      selectedMusic: null,
      selectionReason: 'No facets provided',
      selectedGenres: [],
      tagPriorityUsed: 'none',
    };
  }

  // Find mosaics associated with the given facets
  const mosaics = mosaicRepository.findByFacetIds(facetIds);
  if (mosaics.length === 0) {
    return {
      selectedMusic: null,
      selectionReason: 'No mosaics found for provided facets',
      selectedGenres: [],
      tagPriorityUsed: 'none',
    };
  }

  // Select a mosaic (could be random or use some logic)
  const selectedMosaic = mosaics[Math.floor(Math.random() * mosaics.length)];

  // Extract tag priorities from adjacent media
  const allTagsByPriority = new Map<TagType, Set<string>>();

  // Initialize all priority levels
  getTagTypesInPriorityOrder().forEach(tagType => {
    allTagsByPriority.set(tagType, new Set());
  });

  // Aggregate tags from all adjacent media
  adjacentMedia.forEach(media => {
    const mediaTagsByPriority = extractTagsByPriority(media);
    mediaTagsByPriority.forEach((tags, priority) => {
      tags.forEach(tag => allTagsByPriority.get(priority)!.add(tag));
    });
  });

  // Convert sets back to arrays
  const tagsByPriority = new Map<TagType, string[]>();
  allTagsByPriority.forEach((tagSet, priority) => {
    tagsByPriority.set(priority, Array.from(tagSet));
  });

  // Find music videos that match
  const { candidates, priorityUsed } = await findMusicVideosWithPriority(
    tagsByPriority,
    selectedMosaic.musicalGenres,
    options,
  );

  if (candidates.length === 0) {
    return {
      selectedMusic: null,
      mosaic: selectedMosaic,
      selectionReason:
        'No music videos found matching criteria and tag priorities',
      selectedGenres: selectedMosaic.musicalGenres,
      tagPriorityUsed: priorityUsed || 'none',
    };
  }

  // Handle specialty matching probability for controlled chaos
  const { specialtyMatchProbability = 0.7 } = options;

  if (
    priorityUsed === TagType.Specialty &&
    Math.random() > specialtyMatchProbability
  ) {
    // Skip specialty match this time, try next priority level
    const nonSpecialtyCandidates = await findMusicVideosWithPriority(
      tagsByPriority,
      selectedMosaic.musicalGenres,
      options,
    );

    // Use musical genre level instead
    if (nonSpecialtyCandidates.candidates.length > 0) {
      const selectedMusic =
        nonSpecialtyCandidates.candidates[
          Math.floor(Math.random() * nonSpecialtyCandidates.candidates.length)
        ];

      // Record usage
      if (options.usageContext) {
        recentlyUsedMediaRepository.recordUsage(
          selectedMusic.mediaItemId,
          'music',
          options.usageContext,
          options.streamSessionId,
        );
      }

      return {
        selectedMusic,
        mosaic: selectedMosaic,
        selectionReason:
          'Selected via controlled chaos (avoided specialty match)',
        selectedGenres: selectedMosaic.musicalGenres,
        tagPriorityUsed:
          nonSpecialtyCandidates.priorityUsed || TagType.MusicalGenre,
      };
    }
  }

  // Select final music video
  const selectedMusic =
    candidates[Math.floor(Math.random() * candidates.length)];

  // Record usage
  if (options.usageContext) {
    recentlyUsedMediaRepository.recordUsage(
      selectedMusic.mediaItemId,
      'music',
      options.usageContext,
      options.streamSessionId,
    );
  }

  // Build selection reason
  const selectionReason = `Selected via ${priorityUsed} priority matching`;

  return {
    selectedMusic,
    mosaic: selectedMosaic,
    selectionReason,
    selectedGenres: selectedMosaic.musicalGenres,
    tagPriorityUsed: priorityUsed || 'musical-genre',
  };
}

export default {
  selectMusicFromFacets,
  extractTagsByPriority,
  findMusicVideosWithPriority,
  getTagTypesInPriorityOrder,
};
