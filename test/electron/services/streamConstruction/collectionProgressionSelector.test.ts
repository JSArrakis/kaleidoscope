import { jest } from "@jest/globals";

const mockCollectionRepository = {
  findItemsByCollectionId: jest.fn(),
};

const mockMovieRepository = {
  findByMediaItemId: jest.fn(),
};

const mockStreamManager = {
  getCollectionProgression: jest.fn(),
  setCollectionProgression: jest.fn(),
};

jest.mock(
  "../../../../src/electron/repositories/collectionRepository.js",
  () => ({
    collectionRepository: mockCollectionRepository,
  }),
);

jest.mock("../../../../src/electron/repositories/movieRepository.js", () => ({
  movieRepository: mockMovieRepository,
}));

jest.mock("../../../../src/electron/services/streamManager.js", () => ({
  ...mockStreamManager,
}));

function makeCollectionEntry(
  collectionId: string,
  sequence: number,
): MovieCollectionEntry {
  return {
    collectionId,
    name: collectionId,
    sequence,
  };
}

function makeMovie(
  mediaItemId: string,
  sequence: number,
  duration = 5400,
): Movie {
  return {
    mediaItemId,
    title: mediaItemId,
    path: `/movies/${mediaItemId}.mp4`,
    duration,
    durationLimit: duration,
    isHolidayExclusive: false,
    type: MediaType.Movie,
    tags: [],
    collections: [makeCollectionEntry("starwars", sequence)],
  } as Movie;
}

function makeEpisode(mediaItemId: string): Episode {
  return {
    mediaItemId,
    showItemId: "show-1",
    title: mediaItemId,
    path: `/shows/${mediaItemId}.mp4`,
    duration: 1800,
    durationLimit: 1800,
    overDuration: false,
    episodeNumber: 1,
    type: MediaType.Episode,
    tags: [],
  } as Episode;
}

const {
  resolveCollectionAwareAnchorSelection,
} = require("../../../../src/electron/services/streamConstruction/collectionProgressionSelector");

describe("collectionProgressionSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the first collection movie pick random when no progression exists yet", () => {
    const aNewHope = makeMovie("a-new-hope", 4);

    mockStreamManager.getCollectionProgression.mockReturnValue(undefined);

    const result = resolveCollectionAwareAnchorSelection({
      selectedAnchor: aNewHope,
      scopeKey: "stream:Cont",
      streamTimepoint: 1000,
      remainingDuration: 7200,
      selectFallbackMovieOutsideCollection: () => null,
      selectFallbackEpisode: () => null,
    });

    expect(result).toBe(aNewHope);
    expect(
      mockCollectionRepository.findItemsByCollectionId,
    ).not.toHaveBeenCalled();
    expect(mockMovieRepository.findByMediaItemId).not.toHaveBeenCalled();
    expect(mockStreamManager.setCollectionProgression).toHaveBeenCalledWith(
      "stream:Cont",
      "starwars",
      "a-new-hope",
      1000,
    );
  });

  it("forces the next movie in collection order once progression exists", () => {
    const aNewHope = makeMovie("a-new-hope", 4);
    const empire = makeMovie("empire-strikes-back", 5);

    mockStreamManager.getCollectionProgression.mockReturnValue({
      lastMovieItemId: "a-new-hope",
      lastPlayedTimestamp: 1000,
    });
    mockCollectionRepository.findItemsByCollectionId.mockReturnValue([
      {
        collectionItemId: "1",
        collectionId: "starwars",
        mediaItemId: "phantom-menace",
        sequence: 1,
      },
      {
        collectionItemId: "2",
        collectionId: "starwars",
        mediaItemId: "attack-of-the-clones",
        sequence: 2,
      },
      {
        collectionItemId: "3",
        collectionId: "starwars",
        mediaItemId: "revenge-of-the-sith",
        sequence: 3,
      },
      {
        collectionItemId: "4",
        collectionId: "starwars",
        mediaItemId: "a-new-hope",
        sequence: 4,
      },
      {
        collectionItemId: "5",
        collectionId: "starwars",
        mediaItemId: "empire-strikes-back",
        sequence: 5,
      },
    ]);
    mockMovieRepository.findByMediaItemId.mockReturnValue(empire);

    const result = resolveCollectionAwareAnchorSelection({
      selectedAnchor: aNewHope,
      scopeKey: "stream:Cont",
      streamTimepoint: 1500,
      remainingDuration: 7200,
      enforceWithinSeconds: 12 * 60 * 60,
      selectFallbackMovieOutsideCollection: () => null,
      selectFallbackEpisode: () => null,
    });

    expect(result).toBe(empire);
    expect(
      mockCollectionRepository.findItemsByCollectionId,
    ).toHaveBeenCalledWith("starwars");
    expect(mockMovieRepository.findByMediaItemId).toHaveBeenCalledWith(
      "empire-strikes-back",
    );
    expect(mockStreamManager.setCollectionProgression).toHaveBeenCalledWith(
      "stream:Cont",
      "starwars",
      "empire-strikes-back",
      1500,
    );
  });

  it("does not enforce old stream progression outside the 12-hour window", () => {
    const aNewHope = makeMovie("a-new-hope", 4);

    mockStreamManager.getCollectionProgression.mockReturnValue({
      lastMovieItemId: "revenge-of-the-sith",
      lastPlayedTimestamp: 1000,
    });

    const result = resolveCollectionAwareAnchorSelection({
      selectedAnchor: aNewHope,
      scopeKey: "stream:Cont",
      streamTimepoint: 1000 + 12 * 60 * 60 + 1,
      remainingDuration: 7200,
      enforceWithinSeconds: 12 * 60 * 60,
      selectFallbackMovieOutsideCollection: () => null,
      selectFallbackEpisode: () => null,
    });

    expect(result).toBe(aNewHope);
    expect(
      mockCollectionRepository.findItemsByCollectionId,
    ).not.toHaveBeenCalled();
    expect(mockMovieRepository.findByMediaItemId).not.toHaveBeenCalled();
  });

  it("falls back to an episode when the enforced next collection movie does not fit", () => {
    const aNewHope = makeMovie("a-new-hope", 4);
    const empireTooLong = makeMovie("empire-strikes-back", 5, 8000);
    const fallbackEpisode = makeEpisode("batman-episode-1");

    mockStreamManager.getCollectionProgression.mockReturnValue({
      lastMovieItemId: "a-new-hope",
      lastPlayedTimestamp: 1000,
    });
    mockCollectionRepository.findItemsByCollectionId.mockReturnValue([
      {
        collectionItemId: "4",
        collectionId: "starwars",
        mediaItemId: "a-new-hope",
        sequence: 4,
      },
      {
        collectionItemId: "5",
        collectionId: "starwars",
        mediaItemId: "empire-strikes-back",
        sequence: 5,
      },
    ]);
    mockMovieRepository.findByMediaItemId.mockReturnValue(empireTooLong);

    const result = resolveCollectionAwareAnchorSelection({
      selectedAnchor: aNewHope,
      scopeKey: "programmingBlock:block-1",
      streamTimepoint: 1500,
      remainingDuration: 3600,
      enforceWithinSeconds: Number.MAX_SAFE_INTEGER,
      selectFallbackMovieOutsideCollection: () => null,
      selectFallbackEpisode: () => fallbackEpisode,
    });

    expect(result).toBe(fallbackEpisode);
  });
});
