// Define the values first
export const TAG_TYPES = ['Aesthetic', 'Era', 'Genre', 'Specialty'] as const;

// Derive the type from the values
export type TagType = (typeof TAG_TYPES)[number];

// Type guard function that validates against the union type
export function isValidTagType(value: string): value is TagType {
  return TAG_TYPES.includes(value as TagType);
}
