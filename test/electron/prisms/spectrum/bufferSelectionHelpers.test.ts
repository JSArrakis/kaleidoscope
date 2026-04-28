import { jest } from "@jest/globals";

const mockTagRepository = {
  findAgeGroupBySequence: jest.fn(),
};

const mockCommercialRepository = {
  findHolidayCommercials: jest.fn(),
  findBySpecialtyTags: jest.fn(),
  findByGenreAestheticAgeGroup: jest.fn(),
  findByAgeGroupOnly: jest.fn(),
  findByNoTags: jest.fn(),
  findRandomCommercialsByPoolDuration: jest.fn(),
};

const mockShortRepository = {
  findHolidayShorts: jest.fn(),
  findBySpecialtyTags: jest.fn(),
  findByGenreAestheticAgeGroup: jest.fn(),
  findByAgeGroupOnly: jest.fn(),
  findByNoTags: jest.fn(),
  findRandomShortsAndMusicByCount: jest.fn(),
};

const mockMusicRepository = {
  findHolidayMusic: jest.fn(),
  findBySpecialtyTags: jest.fn(),
  findByMusicalGenreTagIds: jest.fn(),
  findByAgeGroupOnly: jest.fn(),
  findByNoTags: jest.fn(),
};

const mockMosaicRepository = {
  findByFacetId: jest.fn(),
};

const mockFacetRepository = {
  findByGenreAndAestheticId: jest.fn(),
};

jest.mock("../../../../src/electron/repositories/tagsRepository.js", () => ({
  tagRepository: mockTagRepository,
}));

jest.mock(
  "../../../../src/electron/repositories/commercialRepository.js",
  () => ({ commercialRepository: mockCommercialRepository }),
);

jest.mock("../../../../src/electron/repositories/shortRepository.js", () => ({
  shortRepository: mockShortRepository,
}));

jest.mock("../../../../src/electron/repositories/musicRepository.js", () => ({
  musicRepository: mockMusicRepository,
}));

jest.mock("../../../../src/electron/repositories/mosaicRepository.js", () => ({
  mosaicRepository: mockMosaicRepository,
}));

jest.mock("../../../../src/electron/repositories/facetRepository.js", () => ({
  facetRepository: mockFacetRepository,
}));

jest.mock(
  "../../../../src/electron/services/streamConstruction/selectionHelpers.js",
  () => ({
    filterRecentlyUsedCommercials: jest.fn((x) => x),
    filterRecentlyUsedMusic: jest.fn((x) => x),
    filterRecentlyUsedShorts: jest.fn((x) => x),
  }),
);

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
    ageGroupTags: [],
    eraTags: [],
    specialtyTags: [],
    musicalGenreTags: [],
    ...overrides,
  } as SegmentedTags;
}

const {
  selectBufferMedia,
  getHolidayBufferMedia,
  getSpecialtyBufferMedia,
  getGenreAndAestheticBufferMedia,
  getAgeGroupOnlyBufferMedia,
  getUntaggedBufferMedia,
  getRandomBufferMedia,
} = require("../../../../src/electron/prisms/spectrum");

describe("spectrum buffer helper selectors", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
      { mediaItemId: "c1", duration: 30 },
    ]);
    mockShortRepository.findBySpecialtyTags.mockReturnValue([
      { mediaItemId: "s1", duration: 300 },
    ]);
    mockMusicRepository.findBySpecialtyTags.mockReturnValue([
      { mediaItemId: "m1", duration: 240 },
    ]);

    mockCommercialRepository.findByGenreAestheticAgeGroup.mockReturnValue([
      { mediaItemId: "c-ga", duration: 30 },
    ]);
    mockShortRepository.findByGenreAestheticAgeGroup.mockReturnValue([
      { mediaItemId: "s-ga", duration: 300 },
    ]);

    mockCommercialRepository.findHolidayCommercials.mockReturnValue([]);
    mockShortRepository.findHolidayShorts.mockReturnValue([]);
    mockMusicRepository.findHolidayMusic.mockReturnValue([]);

    mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([]);
    mockShortRepository.findByAgeGroupOnly.mockReturnValue([]);
    mockMusicRepository.findByAgeGroupOnly.mockReturnValue([]);

    mockCommercialRepository.findByNoTags.mockReturnValue([]);
    mockShortRepository.findByNoTags.mockReturnValue([]);
    mockMusicRepository.findByNoTags.mockReturnValue([]);

    mockShortRepository.findRandomShortsAndMusicByCount.mockReturnValue({
      shorts: [],
      music: [],
    });
    mockCommercialRepository.findRandomCommercialsByPoolDuration.mockReturnValue(
      [],
    );

    mockTagRepository.findAgeGroupBySequence.mockReturnValue(null);
  });

  describe("selectBufferMedia", () => {
    it("returns early with valid holiday pool without querying later gates", () => {
      mockCommercialRepository.findHolidayCommercials.mockReturnValue([
        { mediaItemId: "c-holiday", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
          specialtyTags: [makeTag("spec-1")],
        }),
        [makeTag("h1")],
        1800,
        3,
        1000,
      );

      expect(result.isValid).toBe(true);
      expect(result.commercials).toHaveLength(1);
      expect(
        mockCommercialRepository.findBySpecialtyTags,
      ).not.toHaveBeenCalled();
      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
    });

    it("deduplicates media items merged from multiple gates", () => {
      mockCommercialRepository.findHolidayCommercials.mockReturnValue([
        { mediaItemId: "c-dup", duration: 10 },
      ]);
      mockShortRepository.findHolidayShorts.mockReturnValue([
        { mediaItemId: "s-dup", duration: 120 },
      ]);
      mockMusicRepository.findHolidayMusic.mockReturnValue([
        { mediaItemId: "m-dup", duration: 120 },
      ]);

      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c-dup", duration: 10 },
        { mediaItemId: "c-new", duration: 7200 },
      ]);
      mockShortRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "s-dup", duration: 120 },
      ]);
      mockMusicRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "m-dup", duration: 120 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ specialtyTags: [makeTag("spec-1")] }),
        [makeTag("holiday-1")],
        1800,
        2,
        1000,
      );

      const commercialIds = result.commercials.map(
        (c: Commercial) => c.mediaItemId,
      );
      const shortIds = result.shorts.map((s: Short) => s.mediaItemId);
      const musicIds = result.music.map((m: Music) => m.mediaItemId);

      expect(commercialIds.filter((id: string) => id === "c-dup")).toHaveLength(
        1,
      );
      expect(shortIds.filter((id: string) => id === "s-dup")).toHaveLength(1);
      expect(musicIds.filter((id: string) => id === "m-dup")).toHaveLength(1);
      expect(commercialIds).toEqual(expect.arrayContaining(["c-new"]));
      expect(result.isValid).toBe(true);
    });

    it("uses random fallback when no tags are present and prior gates are insufficient", () => {
      mockCommercialRepository.findByNoTags.mockReturnValue([
        { mediaItemId: "c-untagged", duration: 10 },
      ]);
      mockCommercialRepository.findRandomCommercialsByPoolDuration.mockReturnValue(
        [{ mediaItemId: "c-random", duration: 7200 }],
      );

      const result = selectBufferMedia(makeSegmentedTags(), [], 1800, 2, 1000);

      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).toHaveBeenCalledWith(1800);
      expect(
        mockShortRepository.findRandomShortsAndMusicByCount,
      ).toHaveBeenCalledWith(2, 1800);
      expect(result.isValid).toBe(true);
      expect(result.commercials.map((c: Commercial) => c.mediaItemId)).toEqual(
        expect.arrayContaining(["c-untagged", "c-random"]),
      );
    });

    it("returns early with valid specialty pool when holiday gate is insufficient", () => {
      // holiday gate returns nothing → specialty gate gets a large commercial pool
      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c-spec-big", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ specialtyTags: [makeTag("spec-1")] }),
        [],
        1800,
        2,
        1000,
      );

      expect(result.isValid).toBe(true);
      expect(result.commercials[0].mediaItemId).toBe("c-spec-big");
      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
    });

    it("continues to specialty gate when holiday gate pool is invalid", () => {
      mockCommercialRepository.findHolidayCommercials.mockReturnValue([
        { mediaItemId: "c-holiday-small", duration: 5 },
      ]);
      mockShortRepository.findHolidayShorts.mockReturnValue([]);
      mockMusicRepository.findHolidayMusic.mockReturnValue([]);

      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c-spec-big-after-holiday", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ specialtyTags: [makeTag("spec-1")] }),
        [makeTag("holiday-1")],
        1800,
        2,
        1000,
      );

      expect(
        mockCommercialRepository.findHolidayCommercials,
      ).toHaveBeenCalled();
      expect(mockCommercialRepository.findBySpecialtyTags).toHaveBeenCalled();
      expect(result.isValid).toBe(true);
      expect(result.commercials.map((c: Commercial) => c.mediaItemId)).toEqual(
        expect.arrayContaining(["c-spec-big-after-holiday"]),
      );
    });

    it("returns early with valid genre/aesthetic pool when specialty gate is insufficient", () => {
      // specialty gate returns tiny commercials → genre/aesthetic gate provides valid pool
      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c-spec-small", duration: 5 },
      ]);
      mockCommercialRepository.findByGenreAestheticAgeGroup.mockReturnValue([
        { mediaItemId: "c-ga-big", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          specialtyTags: [makeTag("spec-1")],
        }),
        [],
        1800,
        2,
        1000,
      );

      expect(result.isValid).toBe(true);
      expect(result.commercials.map((c: Commercial) => c.mediaItemId)).toEqual(
        expect.arrayContaining(["c-ga-big"]),
      );
      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
    });

    it("continues to age-group fallback when genre/aesthetic gate pool is invalid", () => {
      mockCommercialRepository.findByGenreAestheticAgeGroup.mockReturnValue([
        { mediaItemId: "c-ga-small", duration: 5 },
      ]);
      mockShortRepository.findByGenreAestheticAgeGroup.mockReturnValue([]);
      mockMusicRepository.findByMusicalGenreTagIds.mockReturnValue([]);

      mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "c-age-fallback", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
          ageGroupTags: [makeTag("ag2", { sequence: 2 })],
        }),
        [],
        1800,
        2,
        1000,
      );

      expect(
        mockCommercialRepository.findByGenreAestheticAgeGroup,
      ).toHaveBeenCalled();
      expect(mockCommercialRepository.findByAgeGroupOnly).toHaveBeenCalled();
      expect(result.isValid).toBe(true);
      expect(result.commercials.map((c: Commercial) => c.mediaItemId)).toEqual(
        expect.arrayContaining(["c-age-fallback"]),
      );
    });

    it("returns invalid shuffled-halved pools when combined media is still insufficient", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);

      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c1", duration: 5 },
        { mediaItemId: "c2", duration: 5 },
        { mediaItemId: "c3", duration: 5 },
        { mediaItemId: "c4", duration: 5 },
      ]);
      mockShortRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "s1", duration: 120 },
        { mediaItemId: "s2", duration: 120 },
        { mediaItemId: "s3", duration: 120 },
        { mediaItemId: "s4", duration: 120 },
      ]);
      mockMusicRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "m1", duration: 120 },
        { mediaItemId: "m2", duration: 120 },
        { mediaItemId: "m3", duration: 120 },
        { mediaItemId: "m4", duration: 120 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ specialtyTags: [makeTag("spec-1")] }),
        [],
        1800,
        2,
        1000,
      );

      expect(result.isValid).toBe(false);
      expect(result.commercials.length).toBe(2);
      expect(result.shorts.length).toBe(2);
      expect(result.music.length).toBe(2);

      randomSpy.mockRestore();
    });

    it("expands age-group adjacency tags when age tags are present", () => {
      mockTagRepository.findAgeGroupBySequence
        .mockReturnValueOnce({ tagId: "ag1", sequence: 1 })
        .mockReturnValueOnce({ tagId: "ag3", sequence: 3 });
      mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "c-age", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          ageGroupTags: [makeTag("ag2", { sequence: 2 })],
        }),
        [],
        1800,
        2,
        1000,
      );

      expect(mockTagRepository.findAgeGroupBySequence).toHaveBeenCalledWith(1);
      expect(mockTagRepository.findAgeGroupBySequence).toHaveBeenCalledWith(3);
      expect(mockCommercialRepository.findByAgeGroupOnly).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ tagId: "ag2" }),
          expect.objectContaining({ tagId: "ag1" }),
          expect.objectContaining({ tagId: "ag3" }),
        ]),
        1800,
      );
      expect(result.isValid).toBe(true);
    });

    it("sorts multiple age group tags to find the lowest sequence and expands adjacency", () => {
      // Two age-group tags → sort comparator fires; lowest sequence is picked as base
      mockTagRepository.findAgeGroupBySequence.mockReturnValue(null);
      mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "c-sorted-age", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          ageGroupTags: [
            makeTag("ag4", { sequence: 4 }),
            makeTag("ag2", { sequence: 2 }),
          ],
        }),
        [],
        1800,
        2,
        1000,
      );

      // Base group should be sequence-2 tag; adjacent lookup uses sequence 1 and 3
      expect(mockTagRepository.findAgeGroupBySequence).toHaveBeenCalledWith(1);
      expect(mockTagRepository.findAgeGroupBySequence).toHaveBeenCalledWith(3);
      expect(result.isValid).toBe(true);
    });

    it("sort comparator handles tags with no sequence property using fallback 0", () => {
      // Tags without sequence → comparator evaluates `sequence || 0` fallback branches
      mockTagRepository.findAgeGroupBySequence.mockReturnValue(null);
      mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "c-noSeq", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({
          ageGroupTags: [makeTag("ag-x"), makeTag("ag-y")],
        }),
        [],
        1800,
        2,
        1000,
      );

      // Both tags sequence falls back to 0; lowerSequence = max(0-1, 1) = 1, higherSequence = 1
      expect(mockTagRepository.findAgeGroupBySequence).toHaveBeenCalledWith(1);
      expect(result.isValid).toBe(true);
    });

    it("random fallback is not triggered when only specialty tags are present", () => {
      // A=true (no ageGroups), B=false (specialtyTags present) → short-circuits AND
      mockCommercialRepository.findBySpecialtyTags.mockReturnValue([
        { mediaItemId: "c-spec-2", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ specialtyTags: [makeTag("spec-only")] }),
        [],
        1800,
        2,
        1000,
      );

      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    it("random fallback is not triggered when only genre tags are present", () => {
      // A=true, B=true (no specialty), C=false (genreTags present) → short-circuits AND
      mockCommercialRepository.findByGenreAestheticAgeGroup.mockReturnValue([
        { mediaItemId: "c-genre-only", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ genreTags: [makeTag("g1")] }),
        [],
        1800,
        2,
        1000,
      );

      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    it("random fallback is not triggered when only aesthetic tags are present", () => {
      // A=true, B=true, C=true (no genre), D=false (aestheticTags present)
      mockCommercialRepository.findByGenreAestheticAgeGroup.mockReturnValue([
        { mediaItemId: "c-aesthetic-only", duration: 7200 },
      ]);

      const result = selectBufferMedia(
        makeSegmentedTags({ aestheticTags: [makeTag("a1")] }),
        [],
        1800,
        2,
        1000,
      );

      expect(
        mockCommercialRepository.findRandomCommercialsByPoolDuration,
      ).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });
  });

  describe("buffer helper passthroughs", () => {
    it("getHolidayBufferMedia forwards all repository lookups", () => {
      mockCommercialRepository.findHolidayCommercials.mockReturnValue([
        { mediaItemId: "c-holiday", duration: 30 },
      ]);
      mockShortRepository.findHolidayShorts.mockReturnValue([
        { mediaItemId: "s-holiday", duration: 300 },
      ]);
      mockMusicRepository.findHolidayMusic.mockReturnValue([
        { mediaItemId: "m-holiday", duration: 240 },
      ]);

      const result = getHolidayBufferMedia(
        [makeTag("holiday-1")],
        [makeTag("ag1")],
        [makeTag("spec-1")],
        1800,
      );

      expect(
        mockCommercialRepository.findHolidayCommercials,
      ).toHaveBeenCalled();
      expect(mockShortRepository.findHolidayShorts).toHaveBeenCalled();
      expect(mockMusicRepository.findHolidayMusic).toHaveBeenCalled();
      expect(result.commercials[0].mediaItemId).toBe("c-holiday");
      expect(result.shorts[0].mediaItemId).toBe("s-holiday");
      expect(result.music[0].mediaItemId).toBe("m-holiday");
    });

    it("getAgeGroupOnlyBufferMedia, getUntaggedBufferMedia, and getRandomBufferMedia use their repositories", () => {
      mockCommercialRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "c-age", duration: 30 },
      ]);
      mockShortRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "s-age", duration: 300 },
      ]);
      mockMusicRepository.findByAgeGroupOnly.mockReturnValue([
        { mediaItemId: "m-age", duration: 240 },
      ]);

      mockCommercialRepository.findByNoTags.mockReturnValue([
        { mediaItemId: "c-none", duration: 30 },
      ]);
      mockShortRepository.findByNoTags.mockReturnValue([
        { mediaItemId: "s-none", duration: 300 },
      ]);
      mockMusicRepository.findByNoTags.mockReturnValue([
        { mediaItemId: "m-none", duration: 240 },
      ]);

      mockCommercialRepository.findRandomCommercialsByPoolDuration.mockReturnValue(
        [{ mediaItemId: "c-rand", duration: 30 }],
      );
      mockShortRepository.findRandomShortsAndMusicByCount.mockReturnValue({
        shorts: [{ mediaItemId: "s-rand", duration: 300 }],
        music: [{ mediaItemId: "m-rand", duration: 240 }],
      });

      const ageOnly = getAgeGroupOnlyBufferMedia([makeTag("ag1")], 1800);
      const untagged = getUntaggedBufferMedia(1800);
      const random = getRandomBufferMedia(1800, 2);

      expect(ageOnly.commercials[0].mediaItemId).toBe("c-age");
      expect(untagged.shorts[0].mediaItemId).toBe("s-none");
      expect(random.music[0].mediaItemId).toBe("m-rand");
      expect(
        mockShortRepository.findRandomShortsAndMusicByCount,
      ).toHaveBeenCalledWith(2, 1800);
    });
  });

  describe("getSpecialtyBufferMedia", () => {
    it("includes specialty music when coin flip passes", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.25);

      const result = getSpecialtyBufferMedia([makeTag("spec-1")], 1800);

      expect(mockMusicRepository.findBySpecialtyTags).toHaveBeenCalledWith(
        [makeTag("spec-1")],
        1800,
      );
      expect(result.music).toHaveLength(1);

      randomSpy.mockRestore();
    });

    it("skips specialty music when coin flip fails", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.75);

      const result = getSpecialtyBufferMedia([makeTag("spec-1")], 1800);

      expect(mockMusicRepository.findBySpecialtyTags).not.toHaveBeenCalled();
      expect(result.music).toEqual([]);

      randomSpy.mockRestore();
    });
  });

  describe("getGenreAndAestheticBufferMedia", () => {
    it("uses direct musical genre tags when present", () => {
      mockMusicRepository.findByMusicalGenreTagIds.mockReturnValue([
        { mediaItemId: "m-direct", duration: 210 },
      ]);

      const result = getGenreAndAestheticBufferMedia(
        [makeTag("g1")],
        [makeTag("a1")],
        [makeTag("ag1")],
        [makeTag("mg1"), makeTag("mg2")],
        1800,
      );

      expect(mockMusicRepository.findByMusicalGenreTagIds).toHaveBeenCalledWith(
        ["mg1", "mg2"],
        1800,
      );
      expect(
        mockFacetRepository.findByGenreAndAestheticId,
      ).not.toHaveBeenCalled();
      expect(result.music[0].mediaItemId).toBe("m-direct");
    });

    it("falls back to facet -> mosaic musical genre resolution when direct tags absent", () => {
      mockMusicRepository.findByMusicalGenreTagIds.mockReturnValue([
        { mediaItemId: "m-mosaic", duration: 222 },
      ]);

      mockFacetRepository.findByGenreAndAestheticId.mockReturnValue({
        facetId: "f-1",
      });
      mockMosaicRepository.findByFacetId.mockReturnValue([
        { musicalGenres: ["mg3", "mg4", "mg3"] },
      ]);

      const result = getGenreAndAestheticBufferMedia(
        [makeTag("g1")],
        [makeTag("a1")],
        [makeTag("ag1")],
        [],
        1800,
      );

      expect(
        mockFacetRepository.findByGenreAndAestheticId,
      ).toHaveBeenCalledWith("g1", "a1");
      expect(mockMosaicRepository.findByFacetId).toHaveBeenCalledWith("f-1");
      expect(
        mockMusicRepository.findByMusicalGenreTagIds,
      ).toHaveBeenLastCalledWith(expect.arrayContaining(["mg3", "mg4"]), 1800);
      expect(result.music[0].mediaItemId).toBe("m-mosaic");
    });

    it("returns no music when no matching facet exists for the genre/aesthetic pairing", () => {
      mockFacetRepository.findByGenreAndAestheticId.mockReturnValue(null);

      const result = getGenreAndAestheticBufferMedia(
        [makeTag("g1")],
        [makeTag("a1")],
        [makeTag("ag1")],
        [],
        1800,
      );

      expect(mockMosaicRepository.findByFacetId).not.toHaveBeenCalled();
      expect(
        mockMusicRepository.findByMusicalGenreTagIds,
      ).not.toHaveBeenCalled();
      expect(result.music).toEqual([]);
    });

    it("returns no music when facet mosaics contain no musical genre tags", () => {
      mockFacetRepository.findByGenreAndAestheticId.mockReturnValue({
        facetId: "f-empty",
      });
      mockMosaicRepository.findByFacetId.mockReturnValue([]);

      const result = getGenreAndAestheticBufferMedia(
        [makeTag("g1")],
        [makeTag("a1")],
        [makeTag("ag1")],
        [],
        1800,
      );

      expect(mockMosaicRepository.findByFacetId).toHaveBeenCalledWith(
        "f-empty",
      );
      expect(
        mockMusicRepository.findByMusicalGenreTagIds,
      ).not.toHaveBeenCalled();
      expect(result.music).toEqual([]);
    });
  });
});
