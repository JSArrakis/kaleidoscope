/**
 * Universal test tags for Kaleidoscope testing
 * All tags are database-driven examples based on documentation
 */

export * from './ageGroups';
export * from './aesthetics';
export * from './eras';
export * from './genres';
export * from './holidays';
export * from './musicalGenres';
export * from './specialties';

// Re-export individual collections for convenience
import { ageGroupTags, ageGroupTagsList } from './ageGroups';
import { aestheticTags, aestheticTagsList } from './aesthetics';
import { eraTags, eraTagsList } from './eras';
import { genreTags, genreTagsList } from './genres';
import { holidayTags, holidayTagsList } from './holidays';
import { musicalGenreTags, musicalGenreTagsList } from './musicalGenres';
import { specialtyTags, specialtyTagsList } from './specialties';

export const allTestTags = {
  ageGroups: ageGroupTags,
  aesthetics: aestheticTags,
  eras: eraTags,
  genres: genreTags,
  holidays: holidayTags,
  musicalGenres: musicalGenreTags,
  specialties: specialtyTags,
};

export const allTestTagsList = [
  ...ageGroupTagsList,
  ...aestheticTagsList,
  ...eraTagsList,
  ...genreTagsList,
  ...holidayTagsList,
  ...musicalGenreTagsList,
  ...specialtyTagsList,
];

// TODO: Discuss how to handle media that does not have an age tag associated with it
// TODO: Design facets, mosaics, and era-age group prism relationships once basic tag system is established
