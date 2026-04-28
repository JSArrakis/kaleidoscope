import { jest } from "@jest/globals";

const mockMovieRepository = {
  findRandomMovieUnderDurationExcluding: jest.fn(),
  findRandomMovieUnderDuration: jest.fn(),
  findByTagsAndAgeGroupsUnderDuration: jest.fn(),
  findByTags: jest.fn(),
};

const mockShowRepository = {
  findAllShowsUnderDuration: jest.fn(),
  findByEpisodeTags: jest.fn(),
};

const mockHolidayIntentCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  canAddMoreContent: jest.fn(),
  trackSelectedMinutes: jest.fn(),
};

const mockFacets = {
  selectFacetRelationship: jest.fn(),
  findMatchingFacets: jest.fn(),
};

const mockSelectionHelpers = {
  getEpisodeFromShowCandidates: jest.fn(),
  selectMovieOrShow: jest.fn(),
};

const mockStreamManager = {
  getActiveRecentlyUsedMovieIds: jest.fn(),
};

jest.mock("../../../../src/electron/repositories/movieRepository.js", () => ({
  movieRepository: mockMovieRepository,
}));

jest.mock("../../../../src/electron/repositories/showRepository.js", () => ({
  showRepository: mockShowRepository,
}));

jest.mock(
  "../../../../src/electron/services/holidayIntentCacheManager.js",
  () => ({ holidayIntentCacheManager: mockHolidayIntentCacheManager }),
);

jest.mock("../../../../src/electron/prisms/facets.js", () => mockFacets);

jest.mock(
  "../../../../src/electron/services/streamConstruction/selectionHelpers.js",
  () => mockSelectionHelpers,
);

jest.mock(
  "../../../../src/electron/services/streamManager.js",
  () => mockStreamManager,
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
  selectRandomShowOrMovie,
  selectMediaWithHolidayTag,
  selectSpecialtyAdjacentMedia,
  selectFacetAdjacentMedia,
  selectThemedMedia,
} = require("../../../../src/electron/services/streamConstruction/mediaSelector");

describe("mediaSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamManager.getActiveRecentlyUsedMovieIds.mockReturnValue([]);
  });

  describe("selectRandomShowOrMovie", () => {
    it("defaults to show path for short durations", () => {
      const episode = { mediaItemId: "ep-1", type: MediaType.Episode };
      mockShowRepository.findAllShowsUnderDuration.mockReturnValue([
        { id: "s1" },
      ]);
      mockSelectionHelpers.getEpisodeFromShowCandidates.mockReturnValue(
        episode,
      );

      const result = selectRandomShowOrMovie(1000, 1800, []);

      expect(mockShowRepository.findAllShowsUnderDuration).toHaveBeenCalledWith(
        1800,
      );
      expect(
        mockSelectionHelpers.getEpisodeFromShowCandidates,
      ).toHaveBeenCalled();
      expect(result).toBe(episode);
    });

    it("uses movie-excluding query first when coin flip chooses movie", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
      const movie = { mediaItemId: "m-1", type: MediaType.Movie };
      mockMovieRepository.findRandomMovieUnderDurationExcluding.mockReturnValue(
        movie,
      );

      const result = selectRandomShowOrMovie(2000, 6000, []);

      expect(
        mockMovieRepository.findRandomMovieUnderDurationExcluding,
      ).toHaveBeenCalled();
      expect(result).toBe(movie);

      randomSpy.mockRestore();
    });

    it("falls back to non-excluding movie query when first movie query misses", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
      const movie = { mediaItemId: "m-2", type: MediaType.Movie };

      mockMovieRepository.findRandomMovieUnderDurationExcluding.mockReturnValue(
        null,
      );
      mockMovieRepository.findRandomMovieUnderDuration.mockReturnValue(movie);

      const result = selectRandomShowOrMovie(3000, 6000, []);

      expect(
        mockMovieRepository.findRandomMovieUnderDuration,
      ).toHaveBeenCalled();
      expect(result).toBe(movie);

      randomSpy.mockRestore();
    });

    it("falls back to show when movie path has no movies", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
      const episode = { mediaItemId: "ep-fallback", type: MediaType.Episode };

      mockMovieRepository.findRandomMovieUnderDurationExcluding.mockReturnValue(
        null,
      );
      mockMovieRepository.findRandomMovieUnderDuration.mockReturnValue(null);
      mockShowRepository.findAllShowsUnderDuration.mockReturnValue([
        { id: "s2" },
      ]);
      mockSelectionHelpers.getEpisodeFromShowCandidates.mockReturnValue(
        episode,
      );

      const result = selectRandomShowOrMovie(4000, 6000, []);

      expect(result).toBe(episode);
      randomSpy.mockRestore();
    });
  });

  describe("selectMediaWithHolidayTag", () => {
    it("returns null when no holiday-tagged media exists", () => {
      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue(
        [],
      );
      mockShowRepository.findByEpisodeTags.mockReturnValue([]);

      const result = selectMediaWithHolidayTag("holiday-x", 3600);
      expect(result).toBeNull();
    });

    it("selects from movie pool when weighted pick lands on movies", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
      const movie = { mediaItemId: "m-holiday", type: MediaType.Movie };

      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        movie,
      ]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([
        {
          episodes: [
            {
              mediaItemId: "ep-holiday",
              duration: 1200,
              tags: [makeTag("holiday-x")],
              type: MediaType.Episode,
            },
          ],
        },
      ]);

      const result = selectMediaWithHolidayTag("holiday-x", 3600);
      expect(result).toBe(movie);

      randomSpy.mockRestore();
    });

    it("selects from episode pool when weighted pick lands on episodes", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.95);
      const movie = { mediaItemId: "m-holiday", type: MediaType.Movie };
      const episode = {
        mediaItemId: "ep-holiday",
        duration: 1200,
        tags: [makeTag("holiday-x")],
        type: MediaType.Episode,
      };

      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        movie,
      ]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([
        { episodes: [episode] },
      ]);

      const result = selectMediaWithHolidayTag("holiday-x", 3600);
      expect((result as any).mediaItemId).toBe("ep-holiday");

      randomSpy.mockRestore();
    });

    it("filters out shows without valid tagged episodes before choosing from the episode pool", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.95);

      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue(
        [],
      );
      mockShowRepository.findByEpisodeTags.mockReturnValue([
        { episodes: undefined },
        {
          episodes: [
            {
              mediaItemId: "ep-too-long",
              duration: 5000,
              tags: [makeTag("holiday-x")],
              type: MediaType.Episode,
            },
            {
              mediaItemId: "ep-wrong-tag",
              duration: 1200,
              tags: [makeTag("other-tag")],
              type: MediaType.Episode,
            },
            {
              mediaItemId: "ep-valid",
              duration: 1200,
              tags: [makeTag("holiday-x")],
              type: MediaType.Episode,
            },
          ],
        },
      ]);

      const result = selectMediaWithHolidayTag("holiday-x", 3600);

      expect((result as Episode).mediaItemId).toBe("ep-valid");
      randomSpy.mockRestore();
    });
  });

  describe("adjacent media helpers", () => {
    it("selectSpecialtyAdjacentMedia delegates to selectMovieOrShow", () => {
      const movie = { mediaItemId: "m-spec", type: MediaType.Movie };
      mockSelectionHelpers.selectMovieOrShow.mockReturnValue(movie);

      const result = selectSpecialtyAdjacentMedia(
        [makeTag("spec-1")],
        [],
        5400,
        999,
      );

      expect(mockSelectionHelpers.selectMovieOrShow).toHaveBeenCalledWith(
        [makeTag("spec-1")],
        [],
        5400,
        999,
      );
      expect(result).toBe(movie);
    });

    it("selectFacetAdjacentMedia retries with remaining relationships when first fails", () => {
      const firstRel = {
        distance: 0.1,
        genre: { tagId: "g1" },
        aesthetic: { tagId: "a1" },
      };
      const secondRel = {
        distance: 0.2,
        genre: { tagId: "g2" },
        aesthetic: { tagId: "a2" },
      };

      mockFacets.findMatchingFacets.mockReturnValue([
        { facetRelationships: [firstRel, secondRel] },
      ]);

      mockFacets.selectFacetRelationship
        .mockReturnValueOnce(firstRel)
        .mockReturnValueOnce(secondRel);

      mockSelectionHelpers.selectMovieOrShow
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ mediaItemId: "ep-2", type: MediaType.Episode });

      const result = selectFacetAdjacentMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g-seed")],
          aestheticTags: [makeTag("a-seed")],
        }),
        3600,
        1234,
      );

      expect(mockSelectionHelpers.selectMovieOrShow).toHaveBeenCalledTimes(2);
      expect((result as any).mediaItemId).toBe("ep-2");
    });

    it("selectFacetAdjacentMedia returns null when matched facets have no relationships", () => {
      mockFacets.findMatchingFacets.mockReturnValue([
        { facetRelationships: [] },
      ]);

      const result = selectFacetAdjacentMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
        }),
        3600,
        1234,
      );

      expect(result).toBeNull();
      expect(mockSelectionHelpers.selectMovieOrShow).not.toHaveBeenCalled();
    });

    it("selectFacetAdjacentMedia returns null when no matched facets at all", () => {
      mockFacets.findMatchingFacets.mockReturnValue([]);

      const result = selectFacetAdjacentMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
        }),
        3600,
        1234,
      );

      expect(result).toBeNull();
      expect(mockSelectionHelpers.selectMovieOrShow).not.toHaveBeenCalled();
    });

    it("selectFacetAdjacentMedia keeps the lower-distance relationship when two facets share the same genre/aesthetic pair", () => {
      const closer = {
        distance: 0.1,
        genre: { tagId: "g1" },
        aesthetic: { tagId: "a1" },
      };
      const farther = {
        distance: 0.9,
        genre: { tagId: "g1" },
        aesthetic: { tagId: "a1" },
      };

      mockFacets.findMatchingFacets.mockReturnValue([
        { facetRelationships: [closer] },
        { facetRelationships: [farther] },
      ]);
      mockFacets.selectFacetRelationship.mockReturnValue(closer);
      mockSelectionHelpers.selectMovieOrShow.mockReturnValue({
        mediaItemId: "m-dedup",
        type: MediaType.Movie,
      });

      const result = selectFacetAdjacentMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
        }),
        3600,
        1234,
      );

      // Only one unique relationship remains after dedup; it should be called with the closer one
      expect(mockFacets.selectFacetRelationship).toHaveBeenCalledWith([closer]);
      expect((result as Movie).mediaItemId).toBe("m-dedup");
    });

    it("selectFacetAdjacentMedia returns null when all relationships are tried without finding media", () => {
      const rel1 = {
        distance: 0.2,
        genre: { tagId: "g1" },
        aesthetic: { tagId: "a1" },
      };
      const rel2 = {
        distance: 0.3,
        genre: { tagId: "g2" },
        aesthetic: { tagId: "a2" },
      };

      mockFacets.findMatchingFacets.mockReturnValue([
        { facetRelationships: [rel1, rel2] },
      ]);
      mockFacets.selectFacetRelationship
        .mockReturnValueOnce(rel1)
        .mockReturnValueOnce(rel2);
      mockSelectionHelpers.selectMovieOrShow.mockReturnValue(null);

      const result = selectFacetAdjacentMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          aestheticTags: [makeTag("a1")],
        }),
        3600,
        1234,
      );

      expect(result).toBeNull();
      expect(mockSelectionHelpers.selectMovieOrShow).toHaveBeenCalledTimes(2);
    });
  });

  describe("selectThemedMedia", () => {
    it("on holiday date applies smart-shuffle and prefers opposite of previous movie", () => {
      const randomSpy = jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.0);

      mockMovieRepository.findByTags.mockReturnValue([
        { mediaItemId: "m-holiday-1", duration: 7200, type: MediaType.Movie },
      ]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([
        {
          episodes: [
            {
              mediaItemId: "ep-holiday-1",
              duration: 1800,
              type: MediaType.Episode,
              tags: [makeTag("holiday-1")],
            },
          ],
        },
      ]);

      const result = selectThemedMedia(
        makeSegmentedTags(),
        1000,
        1800,
        [makeTag("holiday-1")],
        true,
        false,
        "2026-12-25",
        MediaType.Movie,
      );

      expect((result as Episode).mediaItemId).toBe("ep-holiday-1");
      randomSpy.mockRestore();
    });

    it("during holiday season tracks selected minutes when budget allows", () => {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
      mockHolidayIntentCacheManager.canAddMoreContent.mockReturnValue(true);
      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        { mediaItemId: "m-season", duration: 1250, type: MediaType.Movie },
      ]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([]);

      const result = selectThemedMedia(
        makeSegmentedTags(),
        1000,
        3600,
        [makeTag("holiday-season")],
        false,
        true,
        "2026-12-10",
      );

      expect((result as Movie).mediaItemId).toBe("m-season");
      expect(
        mockHolidayIntentCacheManager.canAddMoreContent,
      ).toHaveBeenCalledWith("holiday-season", "2026-12-10");
      expect(
        mockHolidayIntentCacheManager.trackSelectedMinutes,
      ).toHaveBeenCalledWith("holiday-season", 20, "2026-12-10");
      randomSpy.mockRestore();
    });

    it("uses direct genre/aesthetic tags when facet path is not applicable", () => {
      mockSelectionHelpers.selectMovieOrShow.mockReturnValue({
        mediaItemId: "m-direct-tags",
        type: MediaType.Movie,
      });

      const result = selectThemedMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          ageGroupTags: [makeTag("ag1")],
        }),
        1000,
        3600,
        [],
        false,
        false,
        "2026-04-24",
      );

      expect(mockSelectionHelpers.selectMovieOrShow).toHaveBeenCalledWith(
        [makeTag("g1")],
        [makeTag("ag1")],
        3600,
        1000,
      );
      expect((result as Movie).mediaItemId).toBe("m-direct-tags");
    });

    it("falls back to random show/movie when no themed path returns media", () => {
      mockHolidayIntentCacheManager.canAddMoreContent.mockReturnValue(false);
      mockSelectionHelpers.selectMovieOrShow.mockReturnValue(null);
      mockShowRepository.findAllShowsUnderDuration.mockReturnValue([
        { id: "show-random" },
      ]);
      mockSelectionHelpers.getEpisodeFromShowCandidates.mockReturnValue({
        mediaItemId: "ep-random-fallback",
        type: MediaType.Episode,
      });

      const result = selectThemedMedia(
        makeSegmentedTags({
          genreTags: [makeTag("g1")],
          ageGroupTags: [makeTag("ag1")],
        }),
        1000,
        1200,
        [makeTag("holiday-season")],
        false,
        true,
        "2026-11-20",
      );

      expect(mockShowRepository.findAllShowsUnderDuration).toHaveBeenCalledWith(
        1200,
      );
      expect((result as Episode).mediaItemId).toBe("ep-random-fallback");
    });

    it("on holiday date falls through to later selection logic when holiday content is absent", () => {
      mockMovieRepository.findByTags.mockReturnValue([]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([]);
      mockShowRepository.findAllShowsUnderDuration.mockReturnValue([
        { id: "show-fallback" },
      ]);
      mockSelectionHelpers.getEpisodeFromShowCandidates.mockReturnValue({
        mediaItemId: "ep-holiday-fallback",
        type: MediaType.Episode,
      });

      const result = selectThemedMedia(
        makeSegmentedTags(),
        1000,
        1800,
        [makeTag("holiday-none")],
        true,
        false,
        "2026-12-25",
      );

      expect((result as Episode).mediaItemId).toBe("ep-holiday-fallback");
    });

    it("on holiday date chooses an episode when both pools exist and weighted pick skips movies", () => {
      const randomSpy = jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.95)
        .mockReturnValueOnce(0.0);

      mockMovieRepository.findByTags.mockReturnValue([
        {
          mediaItemId: "m-holiday-both",
          duration: 7200,
          type: MediaType.Movie,
        },
      ]);
      mockShowRepository.findByEpisodeTags.mockReturnValue([
        {
          episodes: [
            {
              mediaItemId: "ep-holiday-both",
              duration: 1800,
              type: MediaType.Episode,
              tags: [makeTag("holiday-both")],
            },
          ],
        },
      ]);

      const result = selectThemedMedia(
        makeSegmentedTags(),
        1000,
        1800,
        [makeTag("holiday-both")],
        true,
        false,
        "2026-12-25",
      );

      expect((result as Episode).mediaItemId).toBe("ep-holiday-both");
      randomSpy.mockRestore();
    });
  });
});

describe("mediaSelector – additional edge branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamManager.getActiveRecentlyUsedMovieIds.mockReturnValue([]);
    mockHolidayIntentCacheManager.canAddMoreContent.mockReturnValue(false);
  });

  it("selectSpecialtyAdjacentMedia returns null when specialty tags are empty", () => {
    const result = selectSpecialtyAdjacentMedia([], [], 3600, 1000);
    expect(result).toBeNull();
    expect(mockSelectionHelpers.selectMovieOrShow).not.toHaveBeenCalled();
  });

  it("selectMediaWithHolidayTag falls back to movie when episodes are empty but movies present", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.99);
    const movie = { mediaItemId: "m-only", type: MediaType.Movie };

    mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
      movie,
    ]);
    mockShowRepository.findByEpisodeTags.mockReturnValue([]);

    const result = selectMediaWithHolidayTag("holiday-x", 3600);
    expect((result as Movie).mediaItemId).toBe("m-only");
    randomSpy.mockRestore();
  });

  it("selectThemedMedia returns specialty-adjacent media when coin flip passes", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
    mockSelectionHelpers.selectMovieOrShow.mockReturnValue({
      mediaItemId: "m-spec-adj",
      type: MediaType.Movie,
    });

    const result = selectThemedMedia(
      makeSegmentedTags({ specialtyTags: [makeTag("spec-1")] }),
      1000,
      3600,
      [],
      false,
      false,
      "2026-04-25",
    );

    expect((result as Movie).mediaItemId).toBe("m-spec-adj");
    randomSpy.mockRestore();
  });

  it("selectThemedMedia returns facet-adjacent media when genre and aesthetic tags both present", () => {
    mockFacets.findMatchingFacets.mockReturnValue([
      {
        facetRelationships: [
          { distance: 0.1, genre: { tagId: "g2" }, aesthetic: { tagId: "a2" } },
        ],
      },
    ]);
    mockFacets.selectFacetRelationship.mockReturnValue({
      distance: 0.1,
      genre: { tagId: "g2" },
      aesthetic: { tagId: "a2" },
    });
    mockSelectionHelpers.selectMovieOrShow.mockReturnValue({
      mediaItemId: "ep-facet-adj",
      type: MediaType.Episode,
    });

    const result = selectThemedMedia(
      makeSegmentedTags({
        genreTags: [makeTag("g1")],
        aestheticTags: [makeTag("a1")],
      }),
      1000,
      3600,
      [],
      false,
      false,
      "2026-04-25",
    );

    expect((result as Episode).mediaItemId).toBe("ep-facet-adj");
  });

  it("selectThemedMedia PATH 1 returns movie when useMovie is true on holiday date", () => {
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.1) // useMovie = 0.1 < movieChance → true
      .mockReturnValueOnce(0.0); // pick index 0 from movies array

    mockMovieRepository.findByTags.mockReturnValue([
      { mediaItemId: "m-hd-1", duration: 7200, type: MediaType.Movie },
    ]);
    mockShowRepository.findByEpisodeTags.mockReturnValue([]);

    const result = selectThemedMedia(
      makeSegmentedTags(),
      1000,
      3600,
      [makeTag("holiday-1")],
      true,
      false,
      "2026-12-25",
    );

    expect((result as Movie).mediaItemId).toBe("m-hd-1");
    randomSpy.mockRestore();
  });

  it("selectThemedMedia PATH 1 falls back to movie when useMovie is false but episodes empty", () => {
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9) // useMovie = 0.9 < movieChance → false
      .mockReturnValueOnce(0.0); // pick index 0 in fallback movie array

    mockMovieRepository.findByTags.mockReturnValue([
      { mediaItemId: "m-hd-fallback", duration: 7200, type: MediaType.Movie },
    ]);
    mockShowRepository.findByEpisodeTags.mockReturnValue([]);

    const result = selectThemedMedia(
      makeSegmentedTags(),
      1000,
      3600,
      [makeTag("holiday-1")],
      true,
      false,
      "2026-12-25",
    );

    expect((result as Movie).mediaItemId).toBe("m-hd-fallback");
    randomSpy.mockRestore();
  });

  it("selectThemedMedia PATH 1 biases toward movies when previous anchor was episode", () => {
    // previousAnchorType = Episode → movieChance = 0.8; random = 0.5 → useMovie = true
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.0);

    mockMovieRepository.findByTags.mockReturnValue([
      { mediaItemId: "m-ep-bias", duration: 3600, type: MediaType.Movie },
    ]);
    mockShowRepository.findByEpisodeTags.mockReturnValue([
      {
        episodes: [
          {
            mediaItemId: "ep-hd-2",
            duration: 1800,
            type: MediaType.Episode,
            tags: [makeTag("holiday-2")],
          },
        ],
      },
    ]);

    const result = selectThemedMedia(
      makeSegmentedTags(),
      1000,
      3600,
      [makeTag("holiday-2")],
      true,
      false,
      "2026-12-26",
      MediaType.Episode,
    );

    expect((result as Movie).mediaItemId).toBe("m-ep-bias");
    randomSpy.mockRestore();
  });
});
