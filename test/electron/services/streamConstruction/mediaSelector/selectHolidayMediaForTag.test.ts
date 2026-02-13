import { selectHolidayMediaForTag } from "../../../../../src/electron/services/streamConstruction/mediaSelector.js";
import { movieRepository } from "../../../../../src/electron/repositories/movieRepository.js";
import { showRepository } from "../../../../../src/electron/repositories/showRepository.js";

jest.mock(
  "../../../../../src/electron/repositories/movieRepository.js",
  () => ({
    movieRepository: {
      findByTagsAndAgeGroupsUnderDuration: jest.fn(),
    },
  }),
);

jest.mock("../../../../../src/electron/repositories/showRepository.js", () => ({
  showRepository: {
    findByEpisodeTags: jest.fn(),
  },
}));

describe("selectHolidayMediaForTag", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should select movie when movie pool is preferred", () => {
    // Setup: 2 movies, 1 episode (66% chance for movie)
    const movies = [
      { mediaItemId: "m1", duration: 1800 } as unknown as Movie,
      { mediaItemId: "m2", duration: 1800 } as unknown as Movie,
    ];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Control Math.random to prefer movies (0.3 < 2/3)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(movies[Math.floor(0.5 * movies.length)]);
    expect(
      movieRepository.findByTagsAndAgeGroupsUnderDuration,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ tagId: "holiday1" })]),
      [],
      3000,
    );
  });

  it("should select episode when episode pool is preferred", () => {
    // Setup: 1 movie, 2 episodes (66% chance for episode)
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep2",
        duration: 1600,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Control Math.random to prefer episodes (0.8 > 1/3)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(episodes[Math.floor(0.5 * episodes.length)]);
    expect(showRepository.findByEpisodeTags).toHaveBeenCalledWith(["holiday1"]);
  });

  it("should filter episodes by duration and holiday tag", () => {
    // Setup: Episodes with different durations and tags
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep2",
        duration: 5000, // Too long, should be filtered out
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep3",
        duration: 1200,
        tags: [{ tagId: "other" }], // Wrong tag, should be filtered out
      } as unknown as Episode,
      {
        mediaItemId: "ep4",
        duration: 1400,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Control Math.random to prefer episodes (0.9 > 0/3)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Only ep1 and ep4 should be in the candidate pool (correct tag and duration)
    expect([episodes[0], episodes[3]]).toContain(result);
  });

  it("should fallback to movie when no episodes fit duration", () => {
    // Setup: Movies but no eligible episodes
    const movies = [
      { mediaItemId: "m1", duration: 1800 } as unknown as Movie,
      { mediaItemId: "m2", duration: 1800 } as unknown as Movie,
    ];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 5000, // Exceeds available duration
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Control Math.random: first says prefer episodes, but none exist so fallback to movie
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 2000);

    expect(movies).toContain(result);
  });

  it("should return null when no movies or eligible episodes available", () => {
    // Setup: Empty pools
    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue([]);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([]);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toBeNull();
  });

  it("should return null when shows have no matching episodes", () => {
    // Setup: Shows exist but episodes don't match the tag
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "other" }], // Wrong tag
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toBeNull();
  });

  it("should handle show with undefined episodes", () => {
    // Setup: Show without episodes array
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const show = {
      mediaItemId: "show1",
      episodes: undefined,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(movies[0]);
  });

  it("should handle multiple shows with matching episodes", () => {
    // Setup: Multiple shows with episodes
    const movies: Movie[] = [];
    const showEpisodes1 = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const showEpisodes2 = [
      {
        mediaItemId: "ep2",
        duration: 1600,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const shows = [
      { mediaItemId: "show1", episodes: showEpisodes1 } as unknown as Show,
      { mediaItemId: "show2", episodes: showEpisodes2 } as unknown as Show,
    ];

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue(shows);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.7);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Should select from combined pool of ep1 and ep2
    expect([showEpisodes1[0], showEpisodes2[0]]).toContain(result);
  });

  it("should handle episode with undefined tags array", () => {
    // Setup: Episode with no tags property
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: undefined, // No tags array
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Episode with undefined tags should be filtered out
    expect(result).toBeNull();
  });

  it("should handle episode with empty tags array", () => {
    // Setup: Episode with empty tags array
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [], // Empty tags array
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Episode without matching tag should be filtered, fallback to movie
    expect(result).toEqual(movies[0]);
  });

  it("should handle episode duration exactly at limit", () => {
    // Setup: Episode with duration exactly equal to available duration
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 3000, // Exactly matches available duration
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Episode at exact limit should be included
    expect(result).toEqual(episodes[0]);
  });

  it("should handle Math.random returning edge values (near 0)", () => {
    // Setup: Control randomness with very small values
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // First random: 0.001 (should strongly prefer movies)
    // Second random: 0 (first element)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.001)
      .mockReturnValueOnce(0);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(movies[0]);
  });

  it("should handle Math.random returning edge values (near 1)", () => {
    // Setup: Control randomness with values near 1
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // First random: 0.999 (should strongly prefer episodes)
    // Second random: 0.999 (last element)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.999)
      .mockReturnValueOnce(0.999);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(episodes[0]);
  });

  it("should handle single movie and single episode tie", () => {
    // Setup: Equal pool sizes (50% each)
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // First random: 0.49 (< 0.5, prefer movie)
    jest.spyOn(Math, "random").mockReturnValueOnce(0.49).mockReturnValueOnce(0);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(movies[0]);
  });

  it("should handle single movie and single episode tie (other way)", () => {
    // Setup: Equal pool sizes (50% each) - other path
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // First random: 0.51 (>= 0.5, prefer episode)
    jest.spyOn(Math, "random").mockReturnValueOnce(0.51).mockReturnValueOnce(0);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    expect(result).toEqual(episodes[0]);
  });

  it("should handle show with mixed valid and invalid episodes", () => {
    // Setup: Show with multiple episodes, only some match criteria
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep2",
        duration: 5000, // Too long
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep3",
        duration: 1200,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep4",
        duration: 2000, // Too long for this test
        tags: [{ tagId: "other" }], // Wrong tag
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Only ep1 and ep3 should be in candidate pool
    expect([episodes[0], episodes[2]]).toContain(result);
  });

  it("should handle episode with duration just under limit", () => {
    // Setup: Multiple episodes, some just under and some just over limit
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 2999, // Just under limit
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep2",
        duration: 3001, // Just over limit
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
      {
        mediaItemId: "ep3",
        duration: 3000, // Exactly at limit
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Only ep1 and ep3 should be included (ep2 exceeds duration)
    expect([episodes[0], episodes[2]]).toContain(result);
  });

  it("should handle many shows with only some having matching episodes", () => {
    // Setup: 5 shows, only 2 have matching episodes
    const movies: Movie[] = [];
    const matchingShow1Episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const matchingShow2Episodes = [
      {
        mediaItemId: "ep2",
        duration: 1600,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const nonMatchingShow1Episodes = [
      {
        mediaItemId: "ep3",
        duration: 1200,
        tags: [{ tagId: "other" }],
      } as unknown as Episode,
    ];
    const nonMatchingShow2Episodes = [
      {
        mediaItemId: "ep4",
        duration: 1400,
        tags: [{ tagId: "other" }],
      } as unknown as Episode,
    ];

    const shows = [
      {
        mediaItemId: "show1",
        episodes: matchingShow1Episodes,
      } as unknown as Show,
      {
        mediaItemId: "show2",
        episodes: nonMatchingShow1Episodes,
      } as unknown as Show,
      {
        mediaItemId: "show3",
        episodes: matchingShow2Episodes,
      } as unknown as Show,
      {
        mediaItemId: "show4",
        episodes: nonMatchingShow2Episodes,
      } as unknown as Show,
      { mediaItemId: "show5", episodes: [] } as unknown as Show,
    ];

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue(shows);

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Only ep1 and ep2 should be in candidate pool
    expect([matchingShow1Episodes[0], matchingShow2Episodes[0]]).toContain(
      result,
    );
  });

  it("should handle episode with multiple tags including the holiday tag", () => {
    // Setup: Episodes with multiple tags
    const movies: Movie[] = [];
    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [
          { tagId: "aesthetic1" },
          { tagId: "holiday1" },
          { tagId: "era1" },
        ],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    jest.spyOn(Math, "random").mockReturnValueOnce(0.9).mockReturnValueOnce(0);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Episode with holiday tag among others should still match
    expect(result).toEqual(episodes[0]);
  });

  it("should handle very large movie pool vs small episode pool", () => {
    // Setup: Asymmetrical pool sizes
    const movies = Array.from({ length: 100 }, (_, i) => ({
      mediaItemId: `m${i}`,
      duration: 1800,
    })) as unknown as Movie[];

    const episodes = [
      {
        mediaItemId: "ep1",
        duration: 1500,
        tags: [{ tagId: "holiday1" }],
      } as unknown as Episode,
    ];
    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Random value that strongly prefers movies (99 out of 101)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Should select from movie pool
    expect(result?.mediaItemId).toMatch(/^m\d+$/);
  });

  it("should handle very small episode pool vs large movie pool", () => {
    // Setup: Large episode pool vs small movie pool
    const movies = [{ mediaItemId: "m1", duration: 1800 } as unknown as Movie];

    const episodes = Array.from({ length: 50 }, (_, i) => ({
      mediaItemId: `ep${i}`,
      duration: 1500,
      tags: [{ tagId: "holiday1" }],
    })) as unknown as Episode[];

    const show = {
      mediaItemId: "show1",
      episodes,
    } as unknown as Show;

    (
      movieRepository.findByTagsAndAgeGroupsUnderDuration as jest.Mock
    ).mockReturnValue(movies);
    (showRepository.findByEpisodeTags as jest.Mock).mockReturnValue([show]);

    // Random value that strongly prefers episodes (50 out of 51)
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.98)
      .mockReturnValueOnce(0.5);

    const result = selectHolidayMediaForTag("holiday1", 3000);

    // Should select from episode pool
    expect(result?.mediaItemId).toMatch(/^ep\d+$/);
  });
});
