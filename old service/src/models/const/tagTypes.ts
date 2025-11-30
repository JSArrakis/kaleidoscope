import { AgeGroup } from '../ageGroup';
import { Holiday } from '../holiday';
import { Tag } from '../tag';

// Enum for better readability and type safety
export enum TagType {
  Aesthetic = 'Aesthetic',
  Era = 'Era',
  Genre = 'Genre',
  Specialty = 'Specialty',
  Holiday = 'Holiday',
  AgeGroup = 'AgeGroup',
  MusicalGenre = 'MusicalGenre',
}

// Array of all tag types (for iteration, validation, etc.)
export const TAG_TYPES = Object.values(TagType);

// Type guard function that validates against the enum
export function isValidTagType(value: string): value is TagType {
  return Object.values(TagType).includes(value as TagType);
}

// All tags are now just Tag objects with different types

// TEMPORARY: MediaTag alias for backward compatibility during refactoring
// TODO: Remove this once all MediaTag usages are converted to Tag
export type MediaTag = Tag;
