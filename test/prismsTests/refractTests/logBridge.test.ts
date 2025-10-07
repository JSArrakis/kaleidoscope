import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';
import { movieRepository } from '../../../src/repositories/movieRepository';
import { showRepository } from '../../../src/repositories/showRepository';
import { makeTag } from '../../utils/tagFactory';

describe('logBridge integration', () => {
  afterEach(() => jest.restoreAllMocks());

  it('calls logBridge with expected payload during refractFromMedia', () => {
    const facets = [{ facetId: 'f1', genre: 'g1', aesthetic: 'a1' }];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 't1', distance: 1 }] as any);

    const movies = [
      {
        mediaItemId: 'm1',
        title: 'M1',
        tags: [makeTag('g1'), makeTag('a1')],
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    jest.spyOn(Math, 'random').mockReturnValue(0.0);

    const spy = jest.fn();

    const media = {
      mediaItemId: 'src1',
      title: 'SRC',
      tags: [makeTag('g1'), makeTag('a1')],
    } as any;
    const result = refract.refractFromMedia(media, spy);

    expect(spy).toHaveBeenCalledTimes(1);
    const calledWith = spy.mock.calls[0][0] as any;
    expect(typeof calledWith.timestamp).toBe('string');
    expect(calledWith.sourceFacet).toBe('f1');
    expect(calledWith.chosenRelationship).toEqual({
      targetFacetId: 't1',
      distance: 1,
    });
    expect(calledWith.chosenMediaId).toBe('m1');
    expect(calledWith.chosenMediaTitle).toBe('M1');

    // Validate result unchanged
    expect(result.sourceFacetId).toBe('f1');
  });

  it('does not crash when media has no title (logging still occurs)', () => {
    const facets = [{ facetId: 'fX', genre: 'gX', aesthetic: 'aX' }];
    jest.spyOn(facetRepository, 'findAll').mockReturnValue(facets as any);
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 'tX', distance: 1 }] as any);
    const movies = [
      {
        mediaItemId: 'm1',
        title: 'M1',
        tags: [makeTag('gX'), makeTag('aX')],
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const spy = jest.fn();
    const media = {
      mediaItemId: 'srcX',
      tags: [makeTag('gX'), makeTag('aX')],
    } as any; // no title
    const result = refract.refractFromMedia(media, spy);
    expect(spy).toHaveBeenCalledTimes(1);
    const calledWith = spy.mock.calls[0][0] as any;
    expect(calledWith.mediaAnalyzed).toEqual({
      mediaItemId: 'srcX',
      title: undefined,
    });
    expect(result.selectedMedia).not.toBeNull();
  });
});
