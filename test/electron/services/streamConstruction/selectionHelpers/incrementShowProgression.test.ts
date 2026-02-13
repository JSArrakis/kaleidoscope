import { incrementShowProgression } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("incrementShowProgression", () => {
  it("should increment the episode number for a show", () => {
    const show: Show = {
      mediaItemId: "show-1",
      title: "Test Show",
      episodes: [
        { mediaItemId: "ep-1", duration: 1800 },
        { mediaItemId: "ep-2", duration: 1800 },
        { mediaItemId: "ep-3", duration: 1800 },
      ],
      episodeCount: 3,
    } as any;

    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 1);

    incrementShowProgression(show, progressionMap);

    expect(progressionMap.get("show-1")).toBe(2);
  });

  it("should wrap around to the first episode after the last one", () => {
    const show: Show = {
      mediaItemId: "show-1",
      title: "Test Show",
      episodes: [
        { mediaItemId: "ep-1", duration: 1800 },
        { mediaItemId: "ep-2", duration: 1800 },
        { mediaItemId: "ep-3", duration: 1800 },
      ],
      episodeCount: 3,
    } as any;

    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-1", 3);

    incrementShowProgression(show, progressionMap);

    expect(progressionMap.get("show-1")).toBe(1);
  });

  it("should handle a show with no episodes gracefully", () => {
    const show: Show = {
      mediaItemId: "show-no-eps",
      title: "Empty Show",
      episodes: [],
      episodeCount: 0,
    } as any;

    const progressionMap = new Map<string, number | undefined>();
    incrementShowProgression(show, progressionMap);

    expect(progressionMap.get("show-no-eps")).toBe(1);
  });

  it("should always return 1 for a show with a single episode", () => {
    const show: Show = {
      mediaItemId: "show-one-ep",
      title: "Single Episode Show",
      episodes: [{ mediaItemId: "ep-1", duration: 1800 }],
      episodeCount: 1,
    } as any;

    const progressionMap = new Map<string, number | undefined>();
    progressionMap.set("show-one-ep", 1);
    incrementShowProgression(show, progressionMap);

    expect(progressionMap.get("show-one-ep")).toBe(1);
  });

  it("should start progression if show is not in the map", () => {
    const show: Show = {
      mediaItemId: "show-new",
      title: "New Show",
      episodes: [
        { mediaItemId: "ep-1", duration: 1800 },
        { mediaItemId: "ep-2", duration: 1800 },
      ],
      episodeCount: 2,
    } as any;

    const progressionMap = new Map<string, number | undefined>();
    incrementShowProgression(show, progressionMap);

    expect(progressionMap.get("show-new")).toBe(2);
  });
});
