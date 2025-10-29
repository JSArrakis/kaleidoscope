import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';
import { movieRepository } from '../../../src/repositories/movieRepository';
import { showRepository } from '../../../src/repositories/showRepository';
import { recentlyUsedMediaRepository } from '../../../src/repositories/recentlyUsedMediaRepository';

// Helper function to create tag objects
const makeTag = (name: string) => ({ name });

describe('logBridge integration', () => {
  afterEach(() => jest.restoreAllMocks());

  it('calls logBridge with expected payload during refractFromMedia', async () => {
    // Mock source and target facets
    const sourceFacets = [
      { facetId: 'f1', genre: 'Action', aesthetic: 'Gritty' },
    ];
    const targetFacet = { facetId: 't1', genre: 'Thriller', aesthetic: 'Dark' };

    jest.spyOn(facetRepository, 'findAll').mockReturnValue(sourceFacets as any);
    jest
      .spyOn(facetRepository, 'findByFacetId')
      .mockReturnValue(targetFacet as any);
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 't1', distance: 0.3 }] as any);

    // Mock recently used media (empty)
    jest
      .spyOn(recentlyUsedMediaRepository, 'getRecentlyUsedMediaIds')
      .mockReturnValue([]);
    jest.spyOn(recentlyUsedMediaRepository, 'recordUsage').mockImplementation();

    const movies = [
      {
        mediaItemId: 'm1',
        title: 'Dark Thriller Movie',
        tags: [makeTag('Thriller'), makeTag('Dark')],
        alias: 'thriller-movie',
        durationMinutes: 120,
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    jest.spyOn(Math, 'random').mockReturnValue(0.0);

    const spy = jest.fn();

    const media = {
      mediaItemId: 'src1',
      title: 'Action Gritty Movie',
      tags: [makeTag('Action'), makeTag('Gritty')],
    } as any;

    const options = { usageContext: 'main_content' as const };
    const result = await refract.refractFromMedia(media, options, spy);

    expect(spy).toHaveBeenCalledTimes(1);
    const calledWith = spy.mock.calls[0][0] as any;
    expect(typeof calledWith.timestamp).toBe('string');
    expect(calledWith.sourceFacet).toBe('f1');
    expect(calledWith.targetFacet).toBe('t1');
    expect(calledWith.chosenRelationship).toEqual({
      targetFacetId: 't1',
      distance: 0.3,
    });
    expect(calledWith.distance).toBe(0.3);
    expect(calledWith.chosenMediaId).toBe('m1');
    expect(calledWith.chosenMediaTitle).toBe('Dark Thriller Movie');
    expect(calledWith.candidateCount).toBe(1);
    expect(calledWith.movieCandidates).toBe(1);
    expect(calledWith.showCandidates).toBe(0);
    expect(typeof calledWith.selectionReason).toBe('string');

    // Validate result unchanged
    expect(result.sourceFacetId).toBe('f1');
    expect(result.selectedMedia?.mediaItemId).toBe('m1');
  });

  it('does not crash when media has no title (logging still occurs)', async () => {
    const sourceFacets = [
      { facetId: 'fX', genre: 'Comedy', aesthetic: 'Light' },
    ];
    const targetFacet = {
      facetId: 'tX',
      genre: 'Romance',
      aesthetic: 'Bright',
    };

    jest.spyOn(facetRepository, 'findAll').mockReturnValue(sourceFacets as any);
    jest
      .spyOn(facetRepository, 'findByFacetId')
      .mockReturnValue(targetFacet as any);
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([{ targetFacetId: 'tX', distance: 0.4 }] as any);

    // Mock recently used media (empty)
    jest
      .spyOn(recentlyUsedMediaRepository, 'getRecentlyUsedMediaIds')
      .mockReturnValue([]);
    jest.spyOn(recentlyUsedMediaRepository, 'recordUsage').mockImplementation();

    const movies = [
      {
        mediaItemId: 'm1',
        title: 'Bright Romance Movie',
        tags: [makeTag('Romance'), makeTag('Bright')],
        alias: 'romance-movie',
        durationMinutes: 90,
      },
    ];
    jest.spyOn(movieRepository, 'findAll').mockReturnValue(movies as any);
    jest.spyOn(showRepository, 'findAll').mockReturnValue([] as any);

    const spy = jest.fn();
    const media = {
      mediaItemId: 'srcX',
      tags: [makeTag('Comedy'), makeTag('Light')],
    } as any; // no title

    const result = await refract.refractFromMedia(media, {}, spy);
    expect(spy).toHaveBeenCalledTimes(1);
    const calledWith = spy.mock.calls[0][0] as any;
    expect(calledWith.mediaAnalyzed).toEqual({
      mediaItemId: 'srcX',
      title: undefined,
    });
    expect(result.selectedMedia).not.toBeNull();
  });
});
