import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';

describe('findMatchingFacets', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns empty array when no facets match', () => {
    jest.spyOn(facetRepository, 'findAll').mockReturnValue([] as any);
    expect(refract.findMatchingFacets(['a', 'b'])).toEqual([]);
  });

  it('filters facets by genre and aesthetic', () => {
    const facets = [
      { facetId: 'f1', genre: 'rock', aesthetic: 'classic' },
      { facetId: 'f2', genre: 'pop', aesthetic: 'modern' },
    ];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);

    const result = refract.findMatchingFacets(['rock', 'classic', 'other']);
    expect(result.length).toBe(1);
    expect(result[0].facetId).toBe('f1');
  });

  it('is case sensitive and ignores malformed facet entries', () => {
    const facets = [
      // missing aesthetic
      { facetId: 'f3', genre: 'rock' },
      { facetId: 'f4', genre: 'Rock', aesthetic: 'Classic' },
    ];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);

    // original tags are lowercase so should not match 'Rock'/'Classic'
    const result = refract.findMatchingFacets(['rock', 'classic']);
    expect(result.length).toBe(0);
  });
});
