import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';

describe('chooseClosestRelationship', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null when no distances', () => {
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([] as any);
    expect(refract.chooseClosestRelationship('x')).toBeNull();
  });

  it('returns the smallest distance', () => {
    const distances = [
      { targetFacetId: 't1', distance: 5 },
      { targetFacetId: 't2', distance: 2 },
      { targetFacetId: 't3', distance: 9 },
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);

    const chosen = refract.chooseClosestRelationship('src');
    expect(chosen).toEqual({ targetFacetId: 't2', distance: 2 });
  });

  it('handles ties by picking the first smallest', () => {
    const distances = [
      { targetFacetId: 't1', distance: 2 },
      { targetFacetId: 't2', distance: 2 },
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);
    const chosen = refract.chooseClosestRelationship('src');
    // sorting preserves order for equal values so expect first
    expect(chosen).toEqual({ targetFacetId: 't1', distance: 2 });
  });

  it('ignores malformed distance entries (non-numeric) and returns null if none valid', () => {
    const distances = [
      { targetFacetId: 't1', distance: 'x' },
      { targetFacetId: 't2' },
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);
    const chosen = refract.chooseClosestRelationship('src');
    expect(chosen).toBeNull();
  });

  it('returns null when findAllDistancesFrom returns undefined', () => {
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(undefined as any);
    const chosen = refract.chooseClosestRelationship('src');
    expect(chosen).toBeNull();
  });
});
