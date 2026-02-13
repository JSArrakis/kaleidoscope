import { doesNextEpisodeFitDuration } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("doesNextEpisodeFitDuration", () => {
  const show: Show = {
    mediaItemId: "show-1",
    title: "Test Show",
    episodes: [
      { mediaItemId: "ep-1", duration: 1200 }, // 20 mins
      { mediaItemId: "ep-2", duration: 1800 }, // 30 mins
      { mediaItemId: "ep-3", duration: 2400 }, // 40 mins
    ],
    episodeCount: 3,
  } as any;

  it("should return true if the next episode fits in the available duration", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 2); // Next episode is ep-2 (30 mins)
    const availableDuration = 2000; // ~33 mins

    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(true);
  });

  it("should return true if the next episode duration is exactly the available duration", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 2); // Next episode is ep-2 (30 mins)
    const availableDuration = 1800; // 30 mins

    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(true);
  });

  it("should return false if the next episode is longer than the available duration", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 3); // Next episode is ep-3 (40 mins)
    const availableDuration = 2000; // ~33 mins

    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(false);
  });

  it("should check the first episode if show is not in progression map", () => {
    const progressionMap = new Map<string, number | undefined>();
    const availableDuration = 1500; // 25 mins

    // ep-1 is 20 mins, so it should fit
    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(true);
  });

  it("should return false for a show with no episodes", () => {
    const emptyShow: Show = {
      mediaItemId: "show-empty",
      title: "Empty Show",
      episodes: [],
      episodeCount: 0,
    } as any;
    const progressionMap = new Map<string, number | undefined>();
    const availableDuration = 3000;

    const result = doesNextEpisodeFitDuration(
      emptyShow,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(false);
  });

  it("should return false for an invalid progression number", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 5); // Out of bounds
    const availableDuration = 3000;

    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(false);
  });

  it("should return false if available duration is zero", () => {
    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 1);
    const availableDuration = 0;

    const result = doesNextEpisodeFitDuration(
      show,
      progressionMap,
      availableDuration,
    );
    expect(result).toBe(false);
  });
});
