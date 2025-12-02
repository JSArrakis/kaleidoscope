import { randomUUID } from "crypto";

/**
 * Factory function to create a Tag with constructor-style parameters
 */
export function createTag(
  name?: string,
  tagId?: string,
  type?: TagType,
  seasonStartDate?: string,
  seasonEndDate?: string,
  explicitlyHoliday?: boolean,
  sequence?: number,
  holidayDates?: string[],
  exclusionTagIds?: string[]
): Tag {
  const id = tagId ?? randomUUID();
  return {
    tagId: id,
    name: name ?? `Test Tag ${id.substring(0, 8)}`,
    type: type ?? TagType.Genre,
    seasonStartDate,
    seasonEndDate,
    explicitlyHoliday: explicitlyHoliday ?? false,
    sequence,
    holidayDates,
    exclusionTagIds,
  };
}