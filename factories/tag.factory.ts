import { randomUUID } from "crypto";

/**
 * Factory function to create a Tag with constructor-style parameters
 */
export function createTag(
  name?: string,
  tagId?: string,
  type?: TagType,
  sequence?: number,
  holidayDates?: string[],
  exclusionTagIds?: string[],
  seasonStartDate?: string,
  seasonEndDate?: string
): Tag {
  const id = tagId ?? randomUUID();
  return {
    tagId: id,
    name: name ?? `Test Tag ${id.substring(0, 8)}`,
    type: type ?? TagType.Genre,
    seasonStartDate,
    seasonEndDate,
    sequence,
    holidayDates,
    exclusionTagIds,
  };
}
