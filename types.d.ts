// ============================================================================
// ENUMS
// ============================================================================

enum StreamType {
  Cont = "Cont", // Continuous 24/7 stream
  Block = "Block", // Scheduled programming blocks
  Adhoc = "Adhoc", // One-off user-configured streams
}

enum MediaType {
  Show = "Show",
  Episode = "Episode",
  Movie = "Movie",
  Short = "Short",
  Music = "Music",
  Commercial = "Commercial",
  Promo = "Promo",
  Bumper = "Bumper",
}

enum TagType {
  Aesthetic = "Aesthetic",
  Era = "Era",
  Genre = "Genre",
  Specialty = "Specialty",
  Holiday = "Holiday",
  AgeGroup = "AgeGroup",
  MusicalGenre = "MusicalGenre",
}

// ============================================================================
// TAG AND RELATED TYPES
// ============================================================================

type Tag = {
  tagId: string;
  name: string;
  type: TagType;
  seasonStartDate?: string;
  seasonEndDate?: string;
  sequence?: number;
  holidayDates?: string[];
  exclusionTagIds?: string[];
};

type SegmentedTags = {
  genreTags: Tag[];
  aestheticTags: Tag[];
  eraTags: Tag[];
  specialtyTags: Tag[];
  ageGroupTags: Tag[];
};

type Subgenre = {
  tagId: string;
  name: string;
};

type HolidayIntent = {
  holidayTagId: string;
  totalAvailableMinutes: number; // Total runtime of all holiday content
  threeDayDistribution: [number, number, number]; // [day1, day2, day3] minutes to spread content
  currentRotationDay: 1 | 2 | 3; // Which day of the 3-day cycle we're on
  lastRotationDate: string; // ISO date when rotation was last calculated
  selectedMinutesToday: number; // Tracks how much we've selected for today
  lastResetDate: string; // ISO date when selectedMinutesToday was last reset
  calculatedAt: number; // Unix timestamp when intent was calculated
  stale: boolean; // Marked true on invalidation, recalculated on next access
};

// ============================================================================
// MEDIA TYPES (Repository-based interfaces)
// ============================================================================

type Movie = {
  mediaItemId: string;
  title: string;
  alias?: string;
  imdb?: string;
  path: string;
  duration: number;
  durationLimit: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Episode = {
  mediaItemId: string;
  showItemId: string;
  season?: string;
  episode?: string;
  episodeNumber: number;
  title: string;
  path: string;
  duration: number;
  durationLimit: number;
  overDuration: boolean;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Show = {
  mediaItemId: string;
  title: string;
  alias?: string;
  imdb?: string;
  durationLimit: number;
  firstEpisodeOverDuration: boolean;
  episodeCount: number;
  type: MediaType;
  tags: Tag[];
  secondaryTags: Tag[];
  episodes: Episode[];
  createdAt?: string;
  updatedAt?: string;
};

type Commercial = {
  mediaItemId: string;
  title: string;
  path: string;
  duration: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Short = {
  mediaItemId: string;
  title: string;
  path: string;
  duration: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Music = {
  mediaItemId: string;
  title: string;
  artist?: string;
  path: string;
  duration: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Promo = {
  mediaItemId: string;
  title: string;
  path: string;
  duration: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type Bumper = {
  mediaItemId: string;
  title: string;
  path: string;
  duration: number;
  type: MediaType;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

type BufferMedia = {
  commercials: Commercial[];
  shorts: Short[];
  music: Music[];
};

// ============================================================================
// SCHEDULED BLOCK TYPES
// ============================================================================

type ScheduledBlock = {
  scheduledBlockId: string;
  title: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
};

// ============================================================================
// COLLECTION TYPES
// ============================================================================

type Collection = {
  collectionId: string;
  title: string;
  description?: string;
  itemCount: number;
  items: CollectionItem[];
  createdAt?: string;
  updatedAt?: string;
};

type CollectionItem = {
  collectionItemId: string;
  collectionId: string;
  mediaItemId: string;
  sequence: number;
  title?: string;
  path?: string;
  duration?: number;
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
};

// ============================================================================
// FACET TYPES
// ============================================================================

type Facet = {
  facetId: string;
  genre: Tag | null;
  aesthetic: Tag | null;
  facetRelationships: FacetRelationshipItem[];
  createdAt?: string;
  updatedAt?: string;
};

type FacetRelationshipItem = {
  facetId: string;
  genre: Tag | null;
  aesthetic: Tag | null;
  distance: number;
};

// ============================================================================
// RECENTLY USED MEDIA TYPES
// ============================================================================

type RecentlyUsedMedia = {
  recentlyUsedMediaId: string;
  mediaItemId: string;
  mediaType: string;
  lastUsedDate: string;
  expirationDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Mosaic = {
  mosaicId: string;
  facetId: string;
  musicalGenres: string[];
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ============================================================================
// EPISODE PROGRESSION TYPES
// ============================================================================

type EpisodeProgression = {
  episodeProgressionId: string;
  showItemId: string;
  streamType: StreamType;
  currentEpisodeNumber?: number;
  totalEpisodes?: number;
  lastPlayedDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Interface for mosaic selection options
interface MosaicSelectionOptions {
  maxCandidates?: number; // Maximum number of mosaics to consider
  preferredGenres?: string[]; // Preferred musical genres to bias selection toward
  excludeGenres?: string[]; // Musical genres to exclude
  requireAllGenres?: boolean; // Whether selected mosaic must contain ALL preferred genres
}

// Result of mosaic selection with reasoning
interface MosaicSelectionResult {
  mosaic: Mosaic | null;
  selectedGenres: string[]; // Which musical genres were ultimately selected
  selectionReason: string; // Why this mosaic was chosen
  candidateCount: number; // How many mosaics were considered
}

type PrismCurationObj = {
  mediaItemId: string;
  title: string;
  description: string;
  items: PrismCurationItem[];
};

type PrismCurationItem = {
  sequence?: number;
  mediaItemTitle: string;
  mediaItemId: string;
};

type PrismCurationReference = {
  curationRefId: string;
  title: string;
  sequence: number;
};

// ============================================================================
// MEDIA BLOCK AND STREAM TYPES
// ============================================================================

interface MediaBlockData {
  buffer: any[]; // Array of buffer/filler media
  mainBlock?: Movie | Episode; // Primary media content
  startTime: number; // Unix timestamp when block starts
}

type MediaBlock = {
  buffer: (Promo | Music | Short | Commercial | Bumper)[];
  mainBlock?: Movie | Episode;
  startTime: number;
  duration: number; // Calculated duration in seconds
};

interface IStreamRequest {
  Title?: string;
  Env?: string;
  Password?: string;
  Tags?: string[] | any[];
  MultiTags?: string[] | any[];
  Movies?: string[];
  EndTime?: number;
  StartTime?: number;
}

interface StreamConstructionOptions {
  Cadence: boolean;
  Themed: boolean;
  StreamType: StreamType;
}

interface StreamInitializationData {
  activeHolidayTags: Tag[];
  progressionMap: Map<string, number | undefined>;
  startingTimepoint: number;
  iterationDuration: number;
  endOfTimeWindow: number;
  selectedFirstMedia: Episode | Movie | null;
  nextScheduledBlock: ScheduledBlock | null;
}

// ============================================================================
// IPC EVENT PAYLOAD MAPPINGS
// ============================================================================

type EventPayloadMapping = {
  openFileDialog: Promise<string[]>;
  getCollections: Promise<PrismCurationObj[]>;
  createCollection: Promise<{ message: string; status: number }>;
  deleteCollection: Promise<{ message: string; status: number }>;
  updateCollection: Promise<{ message: string; status: number }>;
  getMovies: Promise<Movie[]>;
  createMovie: Promise<{ message: string; status: number }>;
  deleteMovie: Promise<{ message: string; status: number }>;
  updateMovie: Promise<{ message: string; status: number }>;
  getShows: Promise<Show[]>;
  createShow: Promise<{ message: string; status: number }>;
  deleteShow: Promise<{ message: string; status: number }>;
  updateShow: Promise<{ message: string; status: number }>;
  getShorts: Promise<Short[]>;
  createShort: Promise<{ message: string; status: number }>;
  deleteShort: Promise<{ message: string; status: number }>;
  updateShort: Promise<{ message: string; status: number }>;
  getMusic: Promise<Music[]>;
  createMusic: Promise<{ message: string; status: number }>;
  deleteMusic: Promise<{ message: string; status: number }>;
  updateMusic: Promise<{ message: string; status: number }>;
  getCommercials: Promise<Commercial[]>;
  createCommercial: Promise<{ message: string; status: number }>;
  deleteCommercial: Promise<{ message: string; status: number }>;
  updateCommercial: Promise<{ message: string; status: number }>;
  getPromos: Promise<Promo[]>;
  createPromo: Promise<{ message: string; status: number }>;
  deletePromo: Promise<{ message: string; status: number }>;
  updatePromo: Promise<{ message: string; status: number }>;
  getBumpers: Promise<Bumper[]>;
  createBumper: Promise<{ message: string; status: number }>;
  deleteBumper: Promise<{ message: string; status: number }>;
  updateBumper: Promise<{ message: string; status: number }>;
  getAestheticTags: Promise<Tag[]>;
  createAestheticTag: Promise<{ message: string; status: number }>;
  deleteAestheticTag: Promise<{ message: string; status: number }>;
  getEraTags: Promise<Tag[]>;
  createEraTag: Promise<{ message: string; status: number }>;
  deleteEraTag: Promise<{ message: string; status: number }>;
  getGenreTags: Promise<Tag[]>;
  createGenreTag: Promise<{ message: string; status: number }>;
  deleteGenreTag: Promise<{ message: string; status: number }>;
  getSpecialtyTags: Promise<Tag[]>;
  createSpecialtyTag: Promise<{ message: string; status: number }>;
  deleteSpecialtyTag: Promise<{ message: string; status: number }>;
  getAgeGroups: Promise<Tag[]>;
  createAgeGroup: Promise<{ message: string; status: number }>;
  deleteAgeGroup: Promise<{ message: string; status: number }>;
  updateAgeGroup: Promise<{ message: string; status: number }>;
  getHolidays: Promise<Tag[]>;
  createHoliday: Promise<{ message: string; status: number }>;
  deleteHoliday: Promise<{ message: string; status: number }>;
  updateHoliday: Promise<{ message: string; status: number }>;
  getMusicGenres: Promise<Tag[]>;
  createMusicGenre: Promise<{ message: string; status: number }>;
  deleteMusicGenre: Promise<{ message: string; status: number }>;
};

interface Window {
  electron: {
    openFileDialogHandler: () => Promise<string[]>;
    getCollectionsHandler: () => Promise<PrismCurationObj[]>;
    createCollectionHandler: (
      collection: PrismCurationObj
    ) => Promise<{ message: string; status: number }>;
    deleteCollectionHandler: (
      collection: PrismCurationObj
    ) => Promise<{ message: string; status: number }>;
    updateCollectionHandler: (
      collection: PrismCurationObj
    ) => Promise<{ message: string; status: number }>;
    getMoviesHandler: () => Promise<Movie[]>;
    createMovieHandler: (
      movie: Movie
    ) => Promise<{ message: string; status: number }>;
    deleteMovieHandler: (
      movie: Movie
    ) => Promise<{ message: string; status: number }>;
    updateMovieHandler: (
      movie: Movie
    ) => Promise<{ message: string; status: number }>;
    getShowsHandler: () => Promise<Show[]>;
    createShowHandler: (
      show: Show
    ) => Promise<{ message: string; status: number }>;
    deleteShowHandler: (
      show: Show
    ) => Promise<{ message: string; status: number }>;
    updateShowHandler: (
      show: Show
    ) => Promise<{ message: string; status: number }>;
    getShortsHandler: () => Promise<Short[]>;
    createShortHandler: (
      short: Short
    ) => Promise<{ message: string; status: number }>;
    deleteShortHandler: (
      short: Short
    ) => Promise<{ message: string; status: number }>;
    updateShortHandler: (
      short: Short
    ) => Promise<{ message: string; status: number }>;
    getMusicHandler: () => Promise<Music[]>;
    createMusicHandler: (
      music: Music
    ) => Promise<{ message: string; status: number }>;
    deleteMusicHandler: (
      music: Music
    ) => Promise<{ message: string; status: number }>;
    updateMusicHandler: (
      music: Music
    ) => Promise<{ message: string; status: number }>;
    getCommercialsHandler: () => Promise<Commercial[]>;
    createCommercialHandler: (
      commercial: Commercial
    ) => Promise<{ message: string; status: number }>;
    deleteCommercialHandler: (
      commercial: Commercial
    ) => Promise<{ message: string; status: number }>;
    updateCommercialHandler: (
      commercial: Commercial
    ) => Promise<{ message: string; status: number }>;
    getPromosHandler: () => Promise<Promo[]>;
    createPromoHandler: (
      promo: Promo
    ) => Promise<{ message: string; status: number }>;
    deletePromoHandler: (
      promo: Promo
    ) => Promise<{ message: string; status: number }>;
    updatePromoHandler: (
      promo: Promo
    ) => Promise<{ message: string; status: number }>;
    getBumpersHandler: () => Promise<Bumper[]>;
    createBumperHandler: (
      bumper: Bumper
    ) => Promise<{ message: string; status: number }>;
    deleteBumperHandler: (
      bumper: Bumper
    ) => Promise<{ message: string; status: number }>;
    updateBumperHandler: (
      bumper: Bumper
    ) => Promise<{ message: string; status: number }>;
    getAestheticTagsHandler: () => Promise<Tag[]>;
    createAestheticTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteAestheticTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getEraTagsHandler: () => Promise<Tag[]>;
    createEraTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteEraTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getGenreTagsHandler: () => Promise<Tag[]>;
    createGenreTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteGenreTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getSpecialtyTagsHandler: () => Promise<Tag[]>;
    createSpecialtyTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteSpecialtyTagHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getAgeGroupsHandler: () => Promise<Tag[]>;
    createAgeGroupHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteAgeGroupHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    updateAgeGroupHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getHolidaysHandler: () => Promise<Tag[]>;
    createHolidayHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteHolidayHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    updateHolidayHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    getMusicGenresHandler: () => Promise<Tag[]>;
    createMusicGenreHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
    deleteMusicGenreHandler: (
      tag: Tag
    ) => Promise<{ message: string; status: number }>;
  };
}
