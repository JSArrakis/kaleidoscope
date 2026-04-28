import { jest } from "@jest/globals";

const mockFacetRepository = {
  findByGenreAndAestheticId: jest.fn(),
};

jest.mock("../../../src/electron/repositories/facetRepository.js", () => ({
  facetRepository: mockFacetRepository,
}));

function makeTag(tagId: string, overrides: Partial<Tag> = {}): Tag {
  return {
    tagId,
    name: tagId,
    type: "test",
    ...overrides,
  } as Tag;
}

function makeSegmentedTags(
  overrides: Partial<SegmentedTags> = {},
): SegmentedTags {
  return {
    genreTags: [],
    aestheticTags: [],
    eraTags: [],
    specialtyTags: [],
    ageGroupTags: [],
    musicalGenreTags: [],
    ...overrides,
  } as SegmentedTags;
}

const {
  selectFacetRelationship,
  findMatchingFacets,
} = require("../../../src/electron/prisms/facets");

describe("facets prism helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("selectFacetRelationship", () => {
    it("selects lower-distance relationship for low random value", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.05);

      const relationships = [
        { distance: 0.1, id: "close" },
        { distance: 0.8, id: "far" },
      ] as unknown as FacetRelationshipItem[];

      const picked = selectFacetRelationship(relationships);
      expect((picked as any).id).toBe("close");

      randomSpy.mockRestore();
    });

    it("selects later relationship for high random value", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.95);

      const relationships = [
        { distance: 0.2, id: "first" },
        { distance: 0.2, id: "second" },
      ] as unknown as FacetRelationshipItem[];

      const picked = selectFacetRelationship(relationships);
      expect((picked as any).id).toBe("second");

      randomSpy.mockRestore();
    });

    it("falls back to last relationship when weighted selection cannot resolve", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

      const relationships = [
        { distance: Number.NaN, id: "first" },
        { distance: Number.NaN, id: "last" },
      ] as unknown as FacetRelationshipItem[];

      const picked = selectFacetRelationship(relationships);
      expect((picked as any).id).toBe("last");

      randomSpy.mockRestore();
    });
  });

  describe("findMatchingFacets", () => {
    it("returns empty when either genre or aesthetic tags are missing", () => {
      const none = findMatchingFacets(
        makeSegmentedTags({ aestheticTags: [makeTag("a1")] }),
      );

      expect(none).toEqual([]);
      expect(
        mockFacetRepository.findByGenreAndAestheticId,
      ).not.toHaveBeenCalled();
    });

    it("checks all genre/aesthetic pairings and returns found facets", () => {
      const facetA = { facetId: "f-a" };
      const facetB = { facetId: "f-b" };

      mockFacetRepository.findByGenreAndAestheticId.mockImplementation(
        (...args: unknown[]) => {
          const [genreId, aestheticId] = args as [string, string];
          if (genreId === "g1" && aestheticId === "a1") return facetA;
          if (genreId === "g2" && aestheticId === "a2") return facetB;
          return null;
        },
      );

      const matched = findMatchingFacets(
        makeSegmentedTags({
          genreTags: [makeTag("g1"), makeTag("g2")],
          aestheticTags: [makeTag("a1"), makeTag("a2")],
        }),
      );

      expect(
        mockFacetRepository.findByGenreAndAestheticId,
      ).toHaveBeenCalledTimes(4);
      expect(matched).toEqual([facetA, facetB]);
    });
  });
});
