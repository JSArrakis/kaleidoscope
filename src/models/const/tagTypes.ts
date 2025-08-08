import { AgeGroup } from '../ageGroup';
import { Holiday } from '../holiday';
import { Tag } from '../tag';

// Define the values first - now includes Holiday and AgeGroup
export const TAG_TYPES = [
  'Aesthetic',
  'Era',
  'Genre',
  'Specialty',
  'Holiday',
  'AgeGroup',
  'MusicalGenre',
] as const;

// Derive the type from the values
export type TagType = (typeof TAG_TYPES)[number];

// Type guard function that validates against the union type
export function isValidTagType(value: string): value is TagType {
  return TAG_TYPES.includes(value as TagType);
}

// All tags are now just Tag objects with different types
export type MediaTag = Tag;
