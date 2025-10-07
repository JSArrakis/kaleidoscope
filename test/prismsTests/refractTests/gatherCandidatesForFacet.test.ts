import * as refract from '../../../src/prisms/refract';
import { movieRepository } from '../../../src/repositories/movieRepository';
import { showRepository } from '../../../src/repositories/showRepository';
import { makeTag } from '../../utils/tagFactory';

describe('gatherCandidatesForFacet', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns empty when facet missing', () => {
    expect(refract.gatherCandidatesForFacet(null as any)).toEqual([]);
  });

  it('collects movies and shows matching facet tags', () => {
    const movies = [
      {
        mediaItemId: 'm1',
        title: 'M1',
        tags: [makeTag('g1'), makeTag('a1')],
      },
      { mediaItemId: 'm2', title: 'M2', tags: [makeTag('g2')] },
    ];
    const shows = [
      {
        mediaItemId: 's1',
        title: 'S1',
        tags: [makeTag('g1'), makeTag('a1')],
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue(shows as any);

    const facet = { genre: 'g1', aesthetic: 'a1' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result.map(r => r.mediaItemId).sort()).toEqual(['m1', 's1'].sort());
  });

  it('returns empty when no movie/show tags match', () => {
    const movies = [
      { mediaItemId: 'm1', title: 'M1', tags: [makeTag('other')] },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const facet = { genre: 'gX', aesthetic: 'aY' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('tolerates malformed tag entries', () => {
    const movies = [{ mediaItemId: 'm1', tags: [{ n: 'g1' }] }];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const facet = { genre: 'g1', aesthetic: 'a1' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('ignores malformed show tag entries', () => {
    const shows = [{ mediaItemId: 's1', tags: [{ n: 'x' }] }];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue([] as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue(shows as any);

    const facet = { genre: 'x', aesthetic: 'y' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('handles null/primitive tags from shows', () => {
    const shows = [{ mediaItemId: 's1', tags: [null, 'str'] }];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue([] as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue(shows as any);

    const facet = { genre: 'x', aesthetic: 'y' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('does not include movies that match only genre (aesthetic missing)', () => {
    const movies = [
      { mediaItemId: 'mG', tags: [makeTag('g1'), makeTag('other')] },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const facet = { genre: 'g1', aesthetic: 'a1' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('does not include movies that match only aesthetic (genre missing)', () => {
    const movies = [
      { mediaItemId: 'mA', tags: [makeTag('other'), makeTag('a1')] },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const facet = { genre: 'g1', aesthetic: 'a1' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result).toEqual([]);
  });

  it('handles falsy and empty-object tags in movies/shows list', () => {
    const movies = [
      {
        mediaItemId: 'mZ',
        tags: [null, undefined, {}, makeTag('gZ'), makeTag('aZ')],
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const facet = { genre: 'gZ', aesthetic: 'aZ' };
    const result = refract.gatherCandidatesForFacet(facet as any);
    expect(result.length).toBe(1);
    expect(result[0].mediaItemId).toBe('mZ');
  });
});
