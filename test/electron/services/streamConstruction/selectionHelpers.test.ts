import { jest } from "@jest/globals";
import {
  alien1979,
  bao2018,
  default1,
  default2,
  onePiece,
  takeOnMe,
  xFiles,
} from "../../../testData/media";
import { holidayTags } from "../../../testData/tags";

const mockEpisodeProgressionRepository = {
  findByStreamType: jest.fn(),
};

const mockMovieRepository = {
  findByTagsAndAgeGroupsUnderDuration: jest.fn(),
};

const mockShowRepository = {
  findByTagsAndAgeGroupsUnderDuration: jest.fn(),
};

const mockStreamManager = {
  getProgressionMap: jest.fn(),
  isRandomEpisodeStart: jest.fn(),
  updateProgression: jest.fn(),
  getRecentlyUsedCommercials: jest.fn(),
  removeRecentlyUsedCommercial: jest.fn(),
  getRecentlyUsedShorts: jest.fn(),
  removeRecentlyUsedShort: jest.fn(),
  getRecentlyUsedMusic: jest.fn(),
  removeRecentlyUsedMusic: jest.fn(),
  getRecentlyUsedMovies: jest.fn(),
  removeRecentlyUsedMovie: jest.fn(),
};

jest.mock(
  "../../../../src/electron/repositories/episodeProgressionRepository.js",
  () => ({
    episodeProgressionRepository: mockEpisodeProgressionRepository,
  }),
);

jest.mock("../../../../src/electron/repositories/movieRepository.js", () => ({
  movieRepository: mockMovieRepository,
}));

jest.mock("../../../../src/electron/repositories/showRepository.js", () => ({
  showRepository: mockShowRepository,
}));

jest.mock("../../../../src/electron/services/streamManager.js", () => ({
  ...mockStreamManager,
}));

function makeTag(tagId: string, overrides: Partial<Tag> = {}): Tag {
  return {
    tagId,
    name: tagId,
    type: "test",
    ...overrides,
  } as Tag;
}

function makeShow(overrides: Partial<Show> = {}): Show {
  return {
    mediaItemId: "show-test",
    title: "Test Show",
    durationLimit: 0,
    firstEpisodeOverDuration: false,
    episodeCount: 0,
    episodes: [],
    tags: [],
    type: MediaType.Show,
    ...overrides,
  } as Show;
}

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    mediaItemId: "episode-test",
    showItemId: "show-test",
    title: "Test Episode",
    path: "test-path",
    duration: 0,
    episodeNumber: 1,
    type: MediaType.Episode,
    tags: [],
    ...overrides,
  } as Episode;
}

const {
  doesNextEpisodeFitDuration,
  filterRecentlyUsedCommercials,
  filterRecentlyUsedMovies,
  filterRecentlyUsedMusic,
  filterRecentlyUsedShorts,
  getDateString,
  getEpisodeFromShowCandidates,
  getProgressionsByStreamType,
  isHolidayDate,
  isHolidaySeason,
  selectMovieOrShow,
} = require("../../../../src/electron/services/streamConstruction/selectionHelpers");

describe("selectionHelpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStreamManager.getProgressionMap.mockReturnValue(new Map());
    mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

    mockStreamManager.getRecentlyUsedCommercials.mockReturnValue(new Map());
    mockStreamManager.getRecentlyUsedShorts.mockReturnValue(new Map());
    mockStreamManager.getRecentlyUsedMusic.mockReturnValue(new Map());
    mockStreamManager.getRecentlyUsedMovies.mockReturnValue(new Map());
  });

  describe("date/holiday helpers", () => {
    it("isHolidayDate returns true for exact holiday MM-DD match", () => {
      const halloween = {
        ...holidayTags.halloween,
        holidayDates: ["10-31"],
      } as Tag;
      const ts = Math.floor(new Date(2026, 9, 31, 12, 0).getTime() / 1000);

      expect(isHolidayDate(ts, [halloween])).toBe(true);
    });

    it("isHolidaySeason returns true for in-range seasonal date", () => {
      const christmasSeason = {
        ...holidayTags.christmas,
        seasonStartDate: "12-01",
        seasonEndDate: "12-31",
      } as Tag;
      const dec2 = Math.floor(new Date(2026, 11, 2, 12, 0).getTime() / 1000);

      expect(isHolidaySeason(dec2, [christmasSeason])).toBe(true);
    });

    it("isHolidaySeason handles year-wrap ranges", () => {
      const wrappedSeason = {
        ...holidayTags.christmas,
        seasonStartDate: "11-15",
        seasonEndDate: "01-05",
      } as Tag;
      const jan2 = Math.floor(new Date(2026, 0, 2, 12, 0).getTime() / 1000);

      expect(isHolidaySeason(jan2, [wrappedSeason])).toBe(true);
    });

    it("getDateString returns local YYYY-MM-DD", () => {
      const ts = Math.floor(new Date(2026, 3, 22, 8, 5).getTime() / 1000);
      expect(getDateString(ts)).toBe("2026-04-22");
    });

    it("isHolidayDate returns false when date does not match", () => {
      const halloween = makeTag("h1", { holidayDates: ["10-31"] });
      const ts = Math.floor(new Date(2026, 9, 30, 12, 0).getTime() / 1000);
      expect(isHolidayDate(ts, [halloween])).toBe(false);
    });

    it("isHolidaySeason returns false when date is outside all season ranges", () => {
      const christmasSeason = makeTag("c1", {
        seasonStartDate: "12-01",
        seasonEndDate: "12-31",
      });
      const ts = Math.floor(new Date(2026, 3, 25, 12, 0).getTime() / 1000);
      expect(isHolidaySeason(ts, [christmasSeason])).toBe(false);
    });

    it("isHolidaySeason returns false when date outside year-wrap range", () => {
      const wrapped = makeTag("w1", {
        seasonStartDate: "11-15",
        seasonEndDate: "01-05",
      });
      const ts = Math.floor(new Date(2026, 5, 1, 12, 0).getTime() / 1000);
      expect(isHolidaySeason(ts, [wrapped])).toBe(false);
    });

    it("isHolidaySeason ignores tags missing one side of the season bounds", () => {
      const missingStart = makeTag("ms", { seasonEndDate: "12-31" });
      const missingEnd = makeTag("me", { seasonStartDate: "12-01" });
      const ts = Math.floor(new Date(2026, 11, 15, 12, 0).getTime() / 1000);

      expect(isHolidaySeason(ts, [missingStart, missingEnd])).toBe(false);
    });
  });

  describe("progression helpers", () => {
    it("getProgressionsByStreamType maps repository rows by showItemId", () => {
      mockEpisodeProgressionRepository.findByStreamType.mockReturnValue([
        { showItemId: "show-1", currentEpisodeNumber: 4 },
        { showItemId: "show-2", currentEpisodeNumber: 9 },
      ]);

      const map = getProgressionsByStreamType("Cont" as StreamType);

      expect(
        mockEpisodeProgressionRepository.findByStreamType,
      ).toHaveBeenCalledWith("Cont");
      expect(map.get("show-1")).toBe(4);
      expect(map.get("show-2")).toBe(9);
    });

    it("doesNextEpisodeFitDuration uses progression map when random start is disabled", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(
        new Map([[onePiece.mediaItemId, 2]]),
      );
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const epNum = doesNextEpisodeFitDuration(onePiece, 1800);
      expect(epNum).toBe(2);
    });

    it("doesNextEpisodeFitDuration selects random fitting episode for adhoc random start", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(true);

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);
      const epNum = doesNextEpisodeFitDuration(onePiece, 1800);

      expect(epNum).toBe(1);
      randomSpy.mockRestore();
    });

    it("doesNextEpisodeFitDuration returns null when random-start has no fitting episodes", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(true);

      const noFitShow = makeShow({
        mediaItemId: "show-no-fit",
        episodes: [makeEpisode({ episodeNumber: 1, duration: 5000 })],
      });

      const epNum = doesNextEpisodeFitDuration(noFitShow, 1800);
      expect(epNum).toBeNull();
    });

    it("doesNextEpisodeFitDuration wraps to episode 1 when progression exceeds episode count", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(
        new Map([[xFiles.mediaItemId, 99]]),
      );
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const epNum = doesNextEpisodeFitDuration(xFiles, 3600);
      expect(epNum).toBe(1);
    });

    it("doesNextEpisodeFitDuration returns null when show has no episodes", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const epNum = doesNextEpisodeFitDuration(
        makeShow({ mediaItemId: "empty-show", episodes: [] }),
        1800,
      );
      expect(epNum).toBeNull();
    });

    it("doesNextEpisodeFitDuration returns null for sparse episode arrays with no resolvable first episode", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const sparseEpisodes = new Array(1) as unknown as Episode[];
      const epNum = doesNextEpisodeFitDuration(
        makeShow({ mediaItemId: "sparse-show", episodes: sparseEpisodes }),
        1800,
      );

      expect(epNum).toBeNull();
    });

    it("getEpisodeFromShowCandidates updates progression for selected show", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);
      const episode = getEpisodeFromShowCandidates([xFiles], 3600);

      expect(episode).not.toBeNull();
      expect(mockStreamManager.updateProgression).toHaveBeenCalledWith(
        xFiles.mediaItemId,
        1,
      );
      randomSpy.mockRestore();
    });

    it("getEpisodeFromShowCandidates returns null when no candidate episodes fit", () => {
      const noFitShow = makeShow({
        mediaItemId: "show-no-fit-2",
        episodes: [makeEpisode({ episodeNumber: 1, duration: 5000 })],
      });

      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      const result = getEpisodeFromShowCandidates([noFitShow], 1800);
      expect(result).toBeNull();
      expect(mockStreamManager.updateProgression).not.toHaveBeenCalled();
    });

    it("getEpisodeFromShowCandidates shuffles multiple shows and picks a fitting one", () => {
      mockStreamManager.getProgressionMap.mockReturnValue(new Map());
      mockStreamManager.isRandomEpisodeStart.mockReturnValue(false);

      // deterministic: Math.random returns 0.0 so shuffle keeps original order
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);
      const result = getEpisodeFromShowCandidates([xFiles, onePiece], 3600);

      expect(result).not.toBeNull();
      expect(mockStreamManager.updateProgression).toHaveBeenCalledTimes(1);
      randomSpy.mockRestore();
    });
  });

  describe("recently used filters", () => {
    it("filterRecentlyUsedCommercials prunes old IDs and removes in-window IDs", () => {
      const now = Math.floor(Date.now() / 1000);
      const map = new Map<string, number>([
        ["old-commercial", now - 4 * 60 * 60],
        [default1.mediaItemId, now - 60],
      ]);
      mockStreamManager.getRecentlyUsedCommercials.mockReturnValue(map);

      const result = filterRecentlyUsedCommercials([default1, default2], now);

      expect(
        mockStreamManager.removeRecentlyUsedCommercial,
      ).toHaveBeenCalledWith("old-commercial");
      expect(result.map((c: Commercial) => c.mediaItemId)).toEqual([
        default2.mediaItemId,
      ]);
    });

    it("filterRecentlyUsedShorts prunes >24h and filters recent", () => {
      const now = Math.floor(Date.now() / 1000);
      const map = new Map<string, number>([
        ["old-short", now - 25 * 60 * 60],
        [bao2018.mediaItemId, now - 60],
      ]);
      mockStreamManager.getRecentlyUsedShorts.mockReturnValue(map);

      const result = filterRecentlyUsedShorts([bao2018], now);
      expect(mockStreamManager.removeRecentlyUsedShort).toHaveBeenCalledWith(
        "old-short",
      );
      expect(result).toEqual([]);
    });

    it("filterRecentlyUsedMusic prunes >24h and filters recent", () => {
      const now = Math.floor(Date.now() / 1000);
      const map = new Map<string, number>([
        ["old-music", now - 25 * 60 * 60],
        [takeOnMe.mediaItemId, now - 60],
      ]);
      mockStreamManager.getRecentlyUsedMusic.mockReturnValue(map);

      const result = filterRecentlyUsedMusic([takeOnMe], now);
      expect(mockStreamManager.removeRecentlyUsedMusic).toHaveBeenCalledWith(
        "old-music",
      );
      expect(result).toEqual([]);
    });

    it("filterRecentlyUsedMovies prunes >48h and filters recent", () => {
      const now = Math.floor(Date.now() / 1000);
      const map = new Map<string, number>([
        ["old-movie", now - 49 * 60 * 60],
        [alien1979.mediaItemId, now - 60],
      ]);
      mockStreamManager.getRecentlyUsedMovies.mockReturnValue(map);

      const result = filterRecentlyUsedMovies([alien1979], now);
      expect(mockStreamManager.removeRecentlyUsedMovie).toHaveBeenCalledWith(
        "old-movie",
      );
      expect(result).toEqual([]);
    });
  });

  describe("selectMovieOrShow", () => {
    it("returns movie first when coin flip prefers movie and one is available", () => {
      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        alien1979,
      ]);
      mockShowRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        onePiece,
      ]);

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);

      const result = selectMovieOrShow(
        [],
        [],
        9000,
        Math.floor(Date.now() / 1000),
      );

      expect(result?.type).toBe(MediaType.Movie);
      expect((result as Movie).mediaItemId).toBe(alien1979.mediaItemId);
      randomSpy.mockRestore();
    });

    it("falls back to episode when movie pool is empty", () => {
      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue(
        [],
      );
      mockShowRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        onePiece,
      ]);

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);
      const result = selectMovieOrShow(
        [],
        [],
        1800,
        Math.floor(Date.now() / 1000),
      );

      expect(result?.type).toBe(MediaType.Episode);
      randomSpy.mockRestore();
    });

    it("tries episode first and falls back to movie when no show candidates exist", () => {
      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        alien1979,
      ]);
      mockShowRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue(
        [],
      );

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);
      const result = selectMovieOrShow(
        [],
        [],
        9000,
        Math.floor(Date.now() / 1000),
      );

      expect(result?.type).toBe(MediaType.Movie);
      expect((result as Movie).mediaItemId).toBe(alien1979.mediaItemId);
      randomSpy.mockRestore();
    });

    it("randomizes among multiple movies when movie path has more than one candidate", () => {
      const movieA = {
        mediaItemId: "movie-a",
        type: MediaType.Movie,
        duration: 4000,
      } as Movie;
      const movieB = {
        mediaItemId: "movie-b",
        type: MediaType.Movie,
        duration: 3900,
      } as Movie;

      mockMovieRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue([
        movieA,
        movieB,
      ]);
      mockShowRepository.findByTagsAndAgeGroupsUnderDuration.mockReturnValue(
        [],
      );

      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.0);
      const result = selectMovieOrShow(
        [],
        [],
        5000,
        Math.floor(Date.now() / 1000),
      );

      expect(result?.type).toBe(MediaType.Movie);
      expect(["movie-a", "movie-b"]).toContain((result as Movie).mediaItemId);
      randomSpy.mockRestore();
    });
  });
});
