import * as refract from '../../../src/prisms/refract';
import { makeTag } from '../../utils/tagFactory';

describe('extractTagNames', () => {
  it('returns empty array for null/invalid media', () => {
    // @ts-ignore
    expect(refract.extractTagNames(null)).toEqual([]);
    // @ts-ignore
    expect(refract.extractTagNames(undefined)).toEqual([]);
    expect(refract.extractTagNames({ tags: null } as any)).toEqual([]);
  });

  it('extracts tag names from media', () => {
    const media: any = { tags: [makeTag('rock'), makeTag('classic')] };
    expect(refract.extractTagNames(media)).toEqual(['rock', 'classic']);
  });

  it('tolerates malformed tag objects (missing name)', () => {
    const media: any = { tags: [{ n: 'x' }, { name: 'ok' }] };
    expect(refract.extractTagNames(media) as any).toEqual([undefined, 'ok']);
  });

  it('handles null and primitive tag entries gracefully', () => {
    const media: any = { tags: [null, 'str', { name: 'ok2' }] };
    expect(refract.extractTagNames(media) as any).toEqual([
      undefined,
      'str',
      'ok2',
    ]);
  });
  it('returns empty array when tags is a primitive (not an array)', () => {
    const media: any = { tags: 'not-an-array' };
    expect(refract.extractTagNames(media)).toEqual([]);
  });

  it('handles many falsy and empty-object tag entries', () => {
    const media: any = {
      tags: [null, undefined, 0, false, '', {}, { name: 'yes' }],
    };
    expect(refract.extractTagNames(media) as any).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      '',
      undefined,
      'yes',
    ]);
  });
});
