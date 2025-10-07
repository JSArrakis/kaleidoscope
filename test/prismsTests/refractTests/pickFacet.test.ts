import * as refract from '../../../src/prisms/refract';

describe('pickFacet', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null for empty input', () => {
    expect(refract.pickFacet([])).toBeNull();
    // @ts-ignore
    expect(refract.pickFacet(null)).toBeNull();
  });

  it('picks deterministic facet when Math.random mocked', () => {
    const facets = [{ facetId: 'a' }, { facetId: 'b' }, { facetId: 'c' }];
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.0); // pick index 0
    const picked = refract.pickFacet(facets as any);
    expect(picked.facetId).toBe('a');
    spy.mockRestore();
  });

  it('returns null for non-array or empty input', () => {
    // @ts-ignore
    expect(refract.pickFacet(undefined as any)).toBeNull();
    // @ts-ignore
    expect(refract.pickFacet(null as any)).toBeNull();
    expect(refract.pickFacet([])).toBeNull();
  });

  it('handles Math.random returning 1.0 (edge clamped) by selecting last', () => {
    const facets = [{ facetId: 'f1' }, { facetId: 'f2' }];
    const spy = jest.spyOn(Math, 'random').mockReturnValue(1.0 as any);
    const chosen = refract.pickFacet(facets as any);
    expect(chosen).toBe(facets[facets.length - 1]);
    spy.mockRestore();
  });

  it('picks last facet when Math.random near 1', () => {
    const facets = [{ facetId: 'a' }, { facetId: 'b' }, { facetId: 'c' }];
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9999);
    const picked = refract.pickFacet(facets as any);
    expect(picked.facetId).toBe('c');
    spy.mockRestore();
  });

  it('handles non-array input defensively', () => {
    // @ts-ignore
    expect(refract.pickFacet(undefined)).toBeNull();
  });
});
