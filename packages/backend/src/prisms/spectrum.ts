import { BaseMedia } from '../models/mediaInterface';
import { SegmentedTags } from '../models/segmentedTags';
import { Tag } from '../models/tag';
import { Commercial } from '../models/commercial';
import { Short } from '../models/short';
import { Music } from '../models/music';
import { commercialRepository } from '../repositories/commercialRepository';
import { shortRepository } from '../repositories/shortRepository';
import { recentlyUsedMediaRepository } from '../repositories/recentlyUsedMediaRepository';
import { Holidays } from '../models/const/holidays';
import * as core from './core';

/**
 * Hierarchical Buffer Media Selection with Graceful Degradation
 *
 * Priority Hierarchy:
 * 1. Age Group Adjacency (Most Important) - with jitter tolerance
 * 2. Holiday/Seasonal (Second Most Important)
 * 3. Specialties (Third Most Important) - Star Wars, Marvel, etc.
 * 4. Genre + Aesthetic Combinations (Fourth Most Important)
 * 5. Era (Least Important for buffers)
 *
 * Strategy: Progressive tag removal while maintaining age group adjacency
 * Include untagged media as fallback options
 */

export interface BufferMediaSelectionResult {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
  selectionStats: {
    totalFound: number;
    perfectMatches: number;
    goodMatches: number;
    decentMatches: number;
    fallbackMatches: number;
    emergencyMatches: number;
    reusageApplied: boolean;
    reusageReason?: string;
    durationFilled: number;
    targetDuration: number;
  };
}

export function selectBufferMedia(
  tags: SegmentedTags,
  duration: number,
): BufferMediaSelectionResult {
  const stats = {
    totalFound: 0,
    perfectMatches: 0,
    goodMatches: 0,
    decentMatches: 0,
    fallbackMatches: 0,
    emergencyMatches: 0,
    reusageApplied: false,
    reusageReason: undefined as string | undefined,
    durationFilled: 0,
    targetDuration: duration,
  };

  console.log(
    `[Spectrum] Selecting buffer media for ${duration}s with Age Groups: ${tags.ageGroupTags.length}, Specialties: ${tags.specialtyTags.length}, Genres: ${tags.genreTags.length}, Eras: ${tags.eraTags.length}`,
  );

  // Calculate age group adjacency with jitter tolerance
  const ageAdjacencyTags = getAgeGroups(tags.ageGroupTags);

  // Check if we're in a holiday period
  const isHolidayPeriod = tags.holidayTags.length > 0;

  // Start with empty results
  let selectedCommercials: Commercial[] = [];
  let selectedShorts: Short[] = [];
  let selectedMusic: Music[] = [];

  // Phase 1: Perfect Matches (Age + Holiday + Specialty + Genre + Aesthetic + Era)
  if (
    isHolidayPeriod &&
    tags.specialtyTags.length > 0 &&
    tags.genreTags.length > 0
  ) {
    const perfectResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      tags.holidayTags,
      tags.specialtyTags,
      tags.genreTags,
      tags.eraTags,
      'perfect',
      duration * 0.3, // Allocate 30% to perfect matches
    );

    selectedCommercials.push(...perfectResults.commercials);
    selectedShorts.push(...perfectResults.shorts);
    selectedMusic.push(...perfectResults.music);
    stats.perfectMatches = perfectResults.totalCount;
  }

  // Phase 2: Good Matches (Age + Holiday + Specialty + Genre)
  const currentDuration = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration = duration - currentDuration;

  if (
    remainingDuration > 0 &&
    (isHolidayPeriod || tags.specialtyTags.length > 0)
  ) {
    const goodResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      isHolidayPeriod ? tags.holidayTags : [],
      tags.specialtyTags,
      tags.genreTags, // Remove aesthetics and era
      [],
      'good',
      remainingDuration * 0.4,
    );

    selectedCommercials.push(...goodResults.commercials);
    selectedShorts.push(...goodResults.shorts);
    selectedMusic.push(...goodResults.music);
    stats.goodMatches = goodResults.totalCount;
  }

  // Phase 3: Decent Matches (Age + Genre/Aesthetic combinations)
  const currentDuration2 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration2 = duration - currentDuration2;

  if (remainingDuration2 > 0 && tags.genreTags.length > 0) {
    const decentResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      [], // Remove holiday requirement
      [], // Remove specialty requirement
      tags.genreTags, // Keep genre, remove other combinations
      [],
      'decent',
      remainingDuration2 * 0.5,
    );

    selectedCommercials.push(...decentResults.commercials);
    selectedShorts.push(...decentResults.shorts);
    selectedMusic.push(...decentResults.music);
    stats.decentMatches = decentResults.totalCount;
  }

  // Phase 4: Fallback Matches (Age + Any single tag)
  const currentDuration3 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration3 = duration - currentDuration3;

  if (remainingDuration3 > 0) {
    const allTags = [...tags.genreTags, ...tags.specialtyTags];
    const fallbackResults = selectMediaByHierarchy(
      ageAdjacencyTags,
      [],
      [],
      allTags.length > 0 ? [allTags[0]] : [], // Use just one tag if available
      [],
      'fallback',
      remainingDuration3 * 0.6,
    );

    selectedCommercials.push(...fallbackResults.commercials);
    selectedShorts.push(...fallbackResults.shorts);
    selectedMusic.push(...fallbackResults.music);
    stats.fallbackMatches = fallbackResults.totalCount;
  }

  // Phase 5: Emergency Matches (Age + Untagged + Reusage)
  const currentDuration4 = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);
  const remainingDuration4 = duration - currentDuration4;

  if (remainingDuration4 > 0) {
    const emergencyResults = selectEmergencyMedia(
      ageAdjacencyTags,
      remainingDuration4,
    );

    selectedCommercials.push(...emergencyResults.commercials);
    selectedShorts.push(...emergencyResults.shorts);
    selectedMusic.push(...emergencyResults.music);
    stats.emergencyMatches = emergencyResults.totalCount;

    if (emergencyResults.reusageApplied) {
      stats.reusageApplied = true;
      stats.reusageReason = emergencyResults.reusageReason;
    }
  }

  // Calculate final stats
  stats.totalFound =
    selectedCommercials.length + selectedShorts.length + selectedMusic.length;
  stats.durationFilled = core.sumMediaDuration([
    ...selectedCommercials,
    ...selectedShorts,
    ...selectedMusic,
  ]);

  console.log(
    `[Spectrum] Selection complete: ${stats.totalFound} items filling ${stats.durationFilled}/${stats.targetDuration}s (Perfect: ${stats.perfectMatches}, Good: ${stats.goodMatches}, Decent: ${stats.decentMatches}, Fallback: ${stats.fallbackMatches}, Emergency: ${stats.emergencyMatches})`,
  );

  if (stats.reusageApplied) {
    console.log(`[Spectrum] Reusage applied: ${stats.reusageReason}`);
  }

  return {
    commercials: selectedCommercials,
    shorts: selectedShorts,
    music: selectedMusic,
    selectionStats: stats,
  };
}

/**
 * Calculate age group adjacency with jitter tolerance
 * Kids (1) ↔ Family (2) ↔ Young Adult (3) ↔ Mature (4)
 * Allows +/- 1 step in sequence, with special rules
 */
function getAgeGroups(ageGroupTags: Tag[]): string[] {
  if (ageGroupTags.length === 0) {
    return ['Kids', 'Family', 'Young Adult', 'Mature']; // Accept any age group if none specified
  }

  const adjacencyTags: string[] = [];
  const tagNames = ageGroupTags.map(tag => core.getTagName(tag));

  tagNames.forEach(tagName => {
    if (tagName) {
      adjacencyTags.push(tagName); // Always include exact match

      // Add adjacent age groups based on sequence
      switch (tagName) {
        case 'Kids':
          adjacencyTags.push('Family'); // Kids can jitter to Family
          break;
        case 'Family':
          adjacencyTags.push('Kids', 'Young Adult'); // Family can jitter both ways
          break;
        case 'Young Adult':
          adjacencyTags.push('Family', 'Mature'); // Young Adult can jitter both ways
          break;
        case 'Mature':
          adjacencyTags.push('Young Adult'); // Mature can jitter to Young Adult
          break;
      }
    }
  });

  // Remove duplicates and return
  return Array.from(new Set(adjacencyTags));
}

function selectMediaByHierarchy(
  ageGroupTags: string[],
  holidayTags: Tag[],
  specialtyTags: Tag[],
  genreAestheticTags: Tag[],
  eraTags: Tag[],
  matchLevel: 'perfect' | 'good' | 'decent' | 'fallback',
  targetDuration: number,
): {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
  totalCount: number;
} {
  if (targetDuration <= 0) {
    return { commercials: [], shorts: [], music: [], totalCount: 0 };
  }

  try {
    // Build tag list for repository query
    const queryTags: Tag[] = [
      ...holidayTags,
      ...specialtyTags,
      ...genreAestheticTags,
      ...eraTags,
    ];

    // Get media from repositories
    let availableCommercials: Commercial[] = [];
    let availableShorts: Short[] = [];

    if (queryTags.length > 0) {
      availableCommercials = commercialRepository.findBufferCommercialsByTags(
        queryTags,
        2,
      );
      availableShorts = shortRepository.findBufferShortsByTags(queryTags, 2);
    } else {
      // If no tags, get all media (for fallback scenarios)
      availableCommercials = commercialRepository.findAll().slice(0, 50); // Limit for performance
      availableShorts = shortRepository.findAll().slice(0, 50);
    }

    // Filter by age group adjacency
    const ageFilteredCommercials = filterByAgeGroup(
      availableCommercials,
      ageGroupTags,
    );
    const ageFilteredShorts = filterByAgeGroup(availableShorts, ageGroupTags);

    // Select media to fill target duration
    const selectedCommercials: Commercial[] = [];
    const selectedShorts: Short[] = [];
    let currentDuration = 0;

    // Prioritize commercials for gap filling (they're usually shorter)
    for (const commercial of ageFilteredCommercials) {
      if (currentDuration + commercial.duration <= targetDuration) {
        selectedCommercials.push(commercial as Commercial);
        currentDuration += commercial.duration;
      }
      if (currentDuration >= targetDuration * 0.8) break; // Leave room for shorts
    }

    // Add shorts for variety
    for (const short of ageFilteredShorts) {
      if (currentDuration + short.duration <= targetDuration) {
        selectedShorts.push(short as Short);
        currentDuration += short.duration;
      }
      if (currentDuration >= targetDuration) break;
    }

    const totalCount = selectedCommercials.length + selectedShorts.length;
    console.log(
      `[Spectrum] ${matchLevel} matches: ${totalCount} items (${selectedCommercials.length} commercials, ${selectedShorts.length} shorts) filling ${currentDuration}s`,
    );

    return {
      commercials: selectedCommercials,
      shorts: selectedShorts,
      music: [], // Music handled separately by mosaic system
      totalCount,
    };
  } catch (error) {
    console.error(`[Spectrum] Error selecting ${matchLevel} matches:`, error);
    return { commercials: [], shorts: [], music: [], totalCount: 0 };
  }
}

function filterByAgeGroup(
  media: BaseMedia[],
  allowedAgeGroups: string[],
): BaseMedia[] {
  if (allowedAgeGroups.length === 0) {
    return media; // No age group restrictions
  }

  return media.filter(item => {
    const mediaTags = item.tags.map(tag => core.getTagName(tag));

    // Check if media has any allowed age group
    const hasAllowedAgeGroup = allowedAgeGroups.some(ageGroup =>
      mediaTags.includes(ageGroup),
    );

    // Also include media with no age group tags (untagged content)
    const hasAnyAgeGroup = mediaTags.some(
      tagName =>
        tagName &&
        ['Kids', 'Family', 'Young Adult', 'Mature'].includes(tagName),
    );

    return hasAllowedAgeGroup || !hasAnyAgeGroup;
  });
}

function selectEmergencyMedia(
  ageGroupTags: string[],
  targetDuration: number,
): {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
  totalCount: number;
  reusageApplied: boolean;
  reusageReason?: string;
} {
  let reusageApplied = false;
  let reusageReason: string | undefined;

  try {
    // Get all available media without tag restrictions
    const allCommercials = commercialRepository.findAll();
    const allShorts = shortRepository.findAll();

    // Filter by age group (maintain this even in emergency)
    const ageFilteredCommercials = filterByAgeGroup(
      allCommercials,
      ageGroupTags,
    );
    const ageFilteredShorts = filterByAgeGroup(allShorts, ageGroupTags);

    // Apply reusage filtering for emergency situation
    const commercialIds = ageFilteredCommercials.map(c => c.mediaItemId);
    const shortIds = ageFilteredShorts.map(s => s.mediaItemId);

    const commercialReusageResult =
      recentlyUsedMediaRepository.filterAvailableMedia(
        commercialIds,
        'commercial',
        'buffer',
        true, // Allow reusage in emergency
      );

    const shortReusageResult = recentlyUsedMediaRepository.filterAvailableMedia(
      shortIds,
      'short',
      'buffer',
      true, // Allow reusage in emergency
    );

    const availableCommercials = ageFilteredCommercials.filter(c =>
      commercialReusageResult.filteredIds.includes(c.mediaItemId),
    );
    const availableShorts = ageFilteredShorts.filter(s =>
      shortReusageResult.filteredIds.includes(s.mediaItemId),
    );

    if (
      commercialReusageResult.strategy !== 'fresh' ||
      shortReusageResult.strategy !== 'fresh'
    ) {
      reusageApplied = true;
      reusageReason = `Emergency reusage - Commercials: ${commercialReusageResult.reason}, Shorts: ${shortReusageResult.reason}`;
    }

    // Select emergency media up to target duration
    const selectedCommercials: Commercial[] = [];
    const selectedShorts: Short[] = [];
    let currentDuration = 0;

    // Mix commercials and shorts randomly for variety
    const allEmergencyMedia = [
      ...availableCommercials,
      ...availableShorts,
    ].sort(() => Math.random() - 0.5);

    for (const media of allEmergencyMedia) {
      if (currentDuration + media.duration <= targetDuration) {
        if (media instanceof Commercial) {
          selectedCommercials.push(media);
        } else {
          selectedShorts.push(media as Short);
        }
        currentDuration += media.duration;
      }
      if (currentDuration >= targetDuration) break;
    }

    const totalCount = selectedCommercials.length + selectedShorts.length;
    console.log(
      `[Spectrum] Emergency selection: ${totalCount} items filling ${currentDuration}s${reusageApplied ? ' (with reusage)' : ''}`,
    );

    return {
      commercials: selectedCommercials,
      shorts: selectedShorts,
      music: [],
      totalCount,
      reusageApplied,
      reusageReason,
    };
  } catch (error) {
    console.error('[Spectrum] Error in emergency media selection:', error);
    return {
      commercials: [],
      shorts: [],
      music: [],
      totalCount: 0,
      reusageApplied: false,
    };
  }
}
