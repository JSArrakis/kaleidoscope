import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';
import { movieRepository } from '../../../src/repositories/movieRepository';
import { showRepository } from '../../../src/repositories/showRepository';
import { makeTag } from '../../utils/tagFactory';

describe('refractFromMedia', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns nulls when media has no tags', () => {
    const result = refract.refractFromMedia({
      mediaItemId: 'x',
      title: 'X',
      tags: [],
    } as any);
    expect(result.selectedMedia).toBeNull();
    expect(result.chosenRelationship).toBeNull();
  });

  it('orchestrates selection end-to-end', () => {
    // Mock facets
    const facets = [{ facetId: 'f1', genre: 'g1', aesthetic: 'a1' }];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);
    // Mock distances
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 't1', distance: 1 }] as any);
    // Mock movies/shows
    const movies = [
      {
        mediaItemId: 'm1',
        title: 'M1',
        tags: [makeTag('g1'), makeTag('a1')],
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);
    // Force deterministic picks
    jest.spyOn(Math, 'random').mockReturnValue(0.0);

    const media = {
      mediaItemId: 'src1',
      title: 'SRC',
      tags: [makeTag('g1'), makeTag('a1')],
    } as any;
    const result = refract.refractFromMedia(media);

    expect(result.sourceFacetId).toBe('f1');
    expect(result.chosenRelationship).toEqual({
      targetFacetId: 't1',
      distance: 1,
    });
    expect(result.selectedMedia && result.selectedMedia.mediaItemId).toBe('m1');
  });

  it('returns null selectedMedia when no candidate media matches the selected facet', () => {
    // Mock facets
    const facets = [{ facetId: 'f2', genre: 'gX', aesthetic: 'aY' }];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);
    // Mock distances to return a relationship
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 'tX', distance: 10 }] as any);

    // Movies/shows exist but don't match facet tags
    const movies = [
      { mediaItemId: 'mX', title: 'MX', tags: [makeTag('other')] },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);
    // Deterministic
    jest.spyOn(Math, 'random').mockReturnValue(0.0);

    const media = {
      mediaItemId: 'src2',
      title: 'SRC2',
      tags: [makeTag('gX'), makeTag('aY')],
    } as any;
    const result = refract.refractFromMedia(media);

    expect(result.sourceFacetId).toBe('f2');
    // No candidate found, selectedMedia should be null
    expect(result.selectedMedia).toBeNull();
    // chosenRelationship may still be present (distance lookup ran) — allow either
    // but selectedMedia is the key assertion for no candidate
  });

  it('returns null chosenRelationship when no distances found', () => {
    const facets = [{ facetId: 'f3', genre: 'g3', aesthetic: 'a3' }];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([] as any);
    jest.spyOn(movieRepository, 'findAll').mockReturnValue([] as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);
    const media = {
      mediaItemId: 's3',
      title: 'S3',
      tags: [makeTag('g3'), makeTag('a3')],
    } as any;
    const result = refract.refractFromMedia(media);
    expect(result.chosenRelationship).toBeNull();
  });

  it('does not call logger when no facet is selected', () => {
    // No facets at all
    jest.spyOn(facetRepository, 'findAll').mockReturnValue([] as any);
    const spyLogger = jest.fn();
    const media = {
      mediaItemId: 's4',
      title: 'S4',
      tags: [makeTag('gZ'), makeTag('aZ')],
    } as any;
    const result = refract.refractFromMedia(media, spyLogger);
    expect(result.sourceFacetId).toBeUndefined();
    expect(spyLogger).not.toHaveBeenCalled();
  });
});
