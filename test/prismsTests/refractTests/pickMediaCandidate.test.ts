import * as refract from '../../../src/prisms/refract';

describe('pickMediaCandidate', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null for empty list', () => {
    expect(refract.pickMediaCandidate([])).toBeNull();
  });

  it('picks deterministic candidate when Math.random mocked', () => {
    const candidates = [
      { mediaItemId: 'a' },
      { mediaItemId: 'b' },
      { mediaItemId: 'c' },
    ];
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99); // pick last
    const picked = refract.pickMediaCandidate(candidates as any);
    expect(picked).not.toBeNull();
    // @ts-ignore - runtime checked above
    expect(picked.mediaItemId).toBe('c');
    spy.mockRestore();
  });

  it('handles Math.random returning 1.0 by selecting last candidate', () => {
    const candidates = [{ mediaItemId: 'x' }, { mediaItemId: 'y' }];
    const spy = jest.spyOn(Math, 'random').mockReturnValue(1.0 as any);
    const picked = refract.pickMediaCandidate(candidates as any) as any;
    expect(picked.mediaItemId).toBe(
      candidates[candidates.length - 1].mediaItemId,
    );
    spy.mockRestore();
  });
});
