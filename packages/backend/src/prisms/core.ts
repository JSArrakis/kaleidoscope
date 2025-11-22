import { BaseMedia } from '../models/mediaInterface';
import { Tag } from '../models/tag';
import { tagRepository } from '../repositories/tagsRepository';

// Helper function to convert string array to Tag array

export function tagNamesFrom(tags: Tag[]): string[] {
  if (tags.length === 0) return [];

  // Check if it's Tag[] by checking if first element has name property
  if ('name' in tags[0] && typeof tags[0].name === 'string') {
    return (tags as Tag[]).map(t => t.name);
  }

  return (tags as Tag[])
    .map(t => (typeof t === 'string' ? t : (t as any)?.name))
    .filter(Boolean) as string[];
}

export function getTagName(tag: Tag): string | undefined {
  if (tag === null || tag === undefined) return undefined;
  if (typeof tag === 'string') return tag;
  return (tag as any).name;
}

export function sumMediaDuration(media: BaseMedia[]): number {
  return media.reduce((acc, val) => acc + val.duration, 0);
}