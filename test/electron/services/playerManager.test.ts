import {
  addMediaBlockToPlayer,
  getPlayerStateSnapshot,
  initializePlayer,
  playNextInPlayerQueue,
  playPreviousInPlayerQueue,
  replacePlayerQueueFromFilePaths,
  resetPlayerStateForTests,
  selectPlayerQueueItem,
  stopPlayer,
} from "../../../src/electron/services/playerManager";

describe("playerManager electron handoff", () => {
  beforeEach(() => {
    resetPlayerStateForTests();
  });

  it("auto-initializes electron player and flattens a media block into queue items", async () => {
    await addMediaBlockToPlayer({
      buffer: [
        {
          mediaItemId: "commercial-1",
          title: "Commercial 1",
          path: "C:/media/commercial-1.mp4",
          type: MediaType.Commercial,
        } as Commercial,
      ],
      anchorMedia: {
        mediaItemId: "movie-1",
        title: "Movie 1",
        path: "C:/media/movie-1.mp4",
        type: MediaType.Movie,
      } as Movie,
      startTime: 123,
    } as MediaBlock);

    const state = getPlayerStateSnapshot();
    expect(state.isInitialized).toBe(true);
    expect(state.queue).toHaveLength(2);
    expect(state.currentIndex).toBe(0);
    expect(state.queue[0]).toMatchObject({
      mediaItemId: "commercial-1",
      isBuffer: true,
      positionInBlock: 0,
    });
    expect(state.queue[1]).toMatchObject({
      mediaItemId: "movie-1",
      isBuffer: false,
      positionInBlock: 1,
    });
  });

  it("replaces manual file queue and supports queue navigation", async () => {
    await initializePlayer("electron");

    replacePlayerQueueFromFilePaths([
      "C:/media/one.mp4",
      "C:/media/two.mp4",
      "C:/media/three.mp4",
    ]);

    expect(getPlayerStateSnapshot().currentIndex).toBe(0);

    playNextInPlayerQueue();
    expect(getPlayerStateSnapshot().currentIndex).toBe(1);

    selectPlayerQueueItem(2);
    expect(getPlayerStateSnapshot().currentIndex).toBe(2);

    playPreviousInPlayerQueue();
    expect(getPlayerStateSnapshot().currentIndex).toBe(1);
  });

  it("clears queue when player stops", async () => {
    await initializePlayer("electron");
    replacePlayerQueueFromFilePaths(["C:/media/one.mp4"]);

    await stopPlayer();

    const state = getPlayerStateSnapshot();
    expect(state.isInitialized).toBe(false);
    expect(state.queue).toEqual([]);
    expect(state.currentIndex).toBe(-1);
  });
});
