import { getEpisodeFromShowCandidates } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("getEpisodeFromShowCandidates", () => {
  let mathRandomSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock Math.random to ensure predictable shuffling
    mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    // Restore the original implementation
    mathRandomSpy.mockRestore();
  });

  const shows: Show[] = [
    {
      mediaItemId: "show-1",
      title: "Short Show",
      episodes: [
        { mediaItemId: "s1e1", duration: 600 }, // 10 mins
        { mediaItemId: "s1e2", duration: 600 },
      ],
      episodeCount: 2,
    } as any,
    {
      mediaItemId: "show-2",
      title: "Long Show",
      episodes: [
        { mediaItemId: "s2e1", duration: 2400 }, // 40 mins
        { mediaItemId: "s2e2", duration: 2400 },
      ],
      episodeCount: 2,
    } as any,
    {
      mediaItemId: "show-3",
      title: "Medium Show",
      episodes: [
        { mediaItemId: "s3e1", duration: 1200 }, // 20 mins
        { mediaItemId: "s3e2", duration: 1200 },
      ],
      episodeCount: 2,
    } as any,
  ];

  it("should select an episode that fits the duration and increment progression", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-3", 1); // Next is s3e1 (20 mins)
    const duration = 1800; // 30 mins available

    const result = getEpisodeFromShowCandidates(
      shows,
      progressionMap,
      duration,
    );

    // It should pick s3e1 from "Medium Show"
    expect(result).not.toBeNull();
    expect(result?.mediaItemId).toBe("s3e1");
    // It should also have incremented the progression for that show
    expect(progressionMap.get("show-3")).toBe(2);
  });

  it("should return null if no episodes fit the available duration", () => {
    const progressionMap = new Map<string, number | undefined>();
    const duration = 500; // 8.3 mins available, too short for any episode

    const result = getEpisodeFromShowCandidates(
      shows,
      progressionMap,
      duration,
    );

    expect(result).toBeNull();
  });

  it("should skip shows whose next episode doesn't fit and pick one that does", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-2", 1); // Next is s2e1 (40 mins)
    const duration = 1800; // 30 mins available

    const result = getEpisodeFromShowCandidates(
      shows,
      progressionMap,
      duration,
    );

    // It can't pick "Long Show", so it must pick from "Short Show" or "Medium Show"
    expect(result).not.toBeNull();
    expect(result?.duration).toBeLessThanOrEqual(duration);
    // The progression for the long show should not have been incremented
    expect(progressionMap.get("show-2")).toBe(1);
  });

  it("should select the first episode if a show has no progression", () => {
    const singleShow = [shows[2]]; // Just "Medium Show"
    const progressionMap = new Map<string, number | undefined>();
    const duration = 1800; // 30 mins

    const result = getEpisodeFromShowCandidates(
      singleShow,
      progressionMap,
      duration,
    );

    expect(result).not.toBeNull();
    expect(result?.mediaItemId).toBe("s3e1");
    expect(progressionMap.get("show-3")).toBe(2);
  });

  it("should return null when given an empty array of shows", () => {
    const progressionMap = new Map<string, number | undefined>();
    const duration = 3000;

    const result = getEpisodeFromShowCandidates([], progressionMap, duration);
    expect(result).toBeNull();
  });

  it("should return null if all candidate shows have no episodes", () => {
    const showsWithNoEpisodes: Show[] = [
      {
        mediaItemId: "show-4",
        title: "Empty Show 1",
        episodes: [],
        episodeCount: 0,
      } as any,
      {
        mediaItemId: "show-5",
        title: "Empty Show 2",
        episodes: [],
        episodeCount: 0,
      } as any,
    ];
    const progressionMap = new Map<string, number | undefined>();
    const duration = 3000;

    const result = getEpisodeFromShowCandidates(
      showsWithNoEpisodes,
      progressionMap,
      duration,
    );
    expect(result).toBeNull();
  });

  it("should return null when the available duration is zero", () => {
    const progressionMap = new Map<string, number | undefined>();
    const duration = 0;

    const result = getEpisodeFromShowCandidates(
      shows,
      progressionMap,
      duration,
    );
    expect(result).toBeNull();
  });
});
