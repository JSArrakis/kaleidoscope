import * as refract from '../../../src/prisms/refract';
import { facetRepository } from '../../../src/repositories/facetRepository';

describe('chooseControlledChaosRelationship', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null when no distances', () => {
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue([] as any);
    expect(refract.chooseControlledChaosRelationship('x')).toBeNull();
  });

  it('filters distances by range and returns a valid choice', () => {
    const distances = [
      { targetFacetId: 't1', distance: 0.01 }, // Too close (below minDistance 0.05)
      { targetFacetId: 't2', distance: 0.3 }, // Valid
      { targetFacetId: 't3', distance: 0.8 }, // Too far (above maxDistance 0.7)
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);

    const chosen = refract.chooseControlledChaosRelationship('src');
    expect(chosen).toEqual({ targetFacetId: 't2', distance: 0.3 });
  });

  it('falls back to closest when no distances in range', () => {
    const distances = [
      { targetFacetId: 't1', distance: 0.01 }, // Too close
      { targetFacetId: 't2', distance: 0.9 }, // Too far
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);

    const chosen = refract.chooseControlledChaosRelationship('src');
    expect(chosen).toEqual({ targetFacetId: 't1', distance: 0.01 }); // Closest fallback
  });

  it('uses custom distance ranges', () => {
    const distances = [
      { targetFacetId: 't1', distance: 0.1 },
      { targetFacetId: 't2', distance: 0.5 },
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);

    const options = { minDistance: 0.4, maxDistance: 0.6 };
    const chosen = refract.chooseControlledChaosRelationship('src', options);
    expect(chosen).toEqual({ targetFacetId: 't2', distance: 0.5 });
  });

  it('ignores malformed distance entries', () => {
    const distances = [
      { targetFacetId: 't1', distance: 'x' },
      { targetFacetId: 't2', distance: 0.3 },
    ];
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(distances as any);

    const chosen = refract.chooseControlledChaosRelationship('src');
    expect(chosen).toEqual({ targetFacetId: 't2', distance: 0.3 });
  });

  it('returns null when findAllDistancesFrom returns undefined', () => {
    jest
      .spyOn(facetRepository, 'findAllDistancesFrom')
      .mockReturnValue(undefined as any);
    const chosen = refract.chooseControlledChaosRelationship('src');
    expect(chosen).toBeNull();
  });
});
