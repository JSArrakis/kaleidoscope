// ============================================================================
// ENUMS
// ============================================================================

enum StreamType {
  Cont = "Cont", // Continuous 24/7 stream
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
  musicalGenreTags: Tag[];
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
  isHolidayExclusive: boolean;
  type: MediaType;
  tags: Tag[];
  collections: MovieCollectionEntry[];
  createdAt?: string;
  updatedAt?: string;
};

type MovieCollectionEntry = {
  collectionId: string;
  name: string;
  sequence: number;
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
  isHolidayExclusive: boolean;
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
  isHolidayExclusive: boolean;
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
  isHolidayExclusive: boolean;
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

type ProgrammingBlockType = "ShowOrder" | "TagThemed" | "CuratedMovieMarathon";

type ProgrammingBlockRecurrence =
  | "OneTime"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly";

type ProgrammingBlockSchedule = {
  recurrence: ProgrammingBlockRecurrence;
  // Required for OneTime schedules.
  year?: number;
  // Required for OneTime and Yearly schedules.
  month?: number; // 1-12
  // Required for OneTime, Yearly, and Monthly schedules.
  dayOfMonth?: number; // 1-31
  // Required for Weekly schedules.
  daysOfWeek?: number[]; // 0-6 (Sun-Sat)
  // 24-hour wall clock time in HH:mm format, constrained to :00 or :30.
  timeOfDay: string;
};

type ProgrammingBlockDefinition = {
  programmingBlockId: string;
  name: string;
  type: ProgrammingBlockType;
  durationMinutes: number; // 30-minute multiples; generally 30 to 1440
  schedule: ProgrammingBlockSchedule;
  active: boolean;
  specialtyTagId?: string;
};

type ProgrammingBlockMovieMode = "Movie" | "Show" | "MovieAndShow";

type ProgrammingBlockBufferPriorityRule = {
  specialtyFirst: boolean;
  holidayCanOverrideOnlyWhenSpecialtyAlsoMatches: boolean;
};

type ProgrammingBlockBumperConfig = {
  blockStartBumperIds: string[];
  blockEndBumperIds: string[];
};

type ShowOrderBlockConfig = {
  showItemIdsInOrder: string[];
  // ShowOrder blocks require cadenced streams and use block-scoped episode progression.
  cadencedOnly: true;
};

type TagThemedBlockConfig = {
  mode: ProgrammingBlockMovieMode;
  tagIds: string[];
  // Movie cooldown policy is derived from recurrence cadence and selected weekdays.
  // Daily: 3 days, Weekly (1-2 days): 3 weeks, Weekly (3+ days): 1 week.
  movieCooldownPolicy: "AutoBySchedule";
  // Collection-aware ordering checks prior 2 days and attempts sequence continuity.
  collectionLookbackDays: 2;
};

type CuratedMovieMarathonBlockConfig = {
  orderedMovieIds: string[];
};

type ScheduledBlock = {
  scheduledBlockId: string;
  programmingBlockId?: string;
  title: string;
  type?: ProgrammingBlockType;
  scheduledStartTime: number;
  scheduledEndTime: number;
  cadenceCompatibility?: "CadencedOnly" | "MatchStreamMode";
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

type FacetRelationshipRequest = {
  sourceFacetId: string;
  targetFacetId: string;
  distance: number;
};

type FacetRelationshipDeleteRequest = {
  sourceFacetId: string;
  targetFacetId: string;
};

// ============================================================================
// RECENTLY USED MEDIA TYPES
// ============================================================================

type RecentlyUsedMedia = {
  recentlyUsedMediaId: string;
  mediaItemId: string;
  mediaType: MediaType;
  lastUsedDate: string;
  expirationDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Mosaic = {
  mosaicId: string;
  facetId: string;
  musicalGenres: string[]; // tagIds of MusicalGenre tags
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ============================================================================
// EPISODE PROGRESSION TYPES
// ============================================================================

type EpisodeProgression = {
  id?: number;
  showItemId: string;
  streamType: StreamType;
  currentEpisodeNumber?: number;
  lastPlayedTimestamp?: number;
  nextEpisodeDurationLimit?: number;
  nextEpisodeOverDuration?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CollectionMovieProgression = {
  id?: number;
  scopeKey: string;
  scopeType: "Stream" | "ProgrammingBlock";
  collectionId: string;
  lastMovieItemId: string;
  lastPlayedTimestamp: number;
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

type MediaProbeResult = {
  filePath: string;
  isPlayable: boolean;
  container?: string;
  durationSeconds?: number;
  bitrate?: number;
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  errorMessage?: string;
};

type PlayerQueueItem = {
  queueItemId: string;
  mediaItemId?: string;
  title: string;
  filePath: string;
  mediaType?: MediaType;
  startTime: number;
  blockStartTime: number;
  positionInBlock: number;
  isBuffer: boolean;
  sourceContext?: MediaBlockSourceContext;
};

type ElectronPlayerState = {
  playerType: "vlc" | "electron" | "web" | "ffmpeg-plex";
  isInitialized: boolean;
  currentIndex: number;
  queue: PlayerQueueItem[];
  updatedAt: number;
};

type AdhocPlayerTestResult = {
  status: number;
  blockCount: number;
  message: string;
};

// ============================================================================
// MEDIA BLOCK AND STREAM TYPES
// ============================================================================

interface MediaBlockData {
  buffer: any[]; // Array of buffer/filler media
  anchorMedia?: Movie | Episode; // Primary media content
  startTime: number; // Unix timestamp when block starts
  sourceContext?: MediaBlockSourceContext;
}

type MediaBlockSourceContext = {
  streamType: StreamType;
  programmingBlockId?: string;
};

type MediaBlock = {
  buffer: (Promo | Music | Short | Commercial | Bumper)[];
  anchorMedia?: Movie | Episode;
  startTime: number;
  sourceContext?: MediaBlockSourceContext;
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
  AdhocStartFromBeginning?: boolean;
}

interface StreamConstructionOptions {
  Cadence: boolean;
  Themed: boolean;
  StreamType: StreamType;
  AdhocStartFromBeginning?: boolean;
}

interface StreamInitializationData {
  activeHolidayTags: Tag[];
  progressionMap: Map<string, number | undefined>;
  startingTimepoint: number;
  iterationDuration: number;
  endOfTimeWindow: number;
  selectedFirstMedia: Episode | Movie | null;
  firstAnchorRequiresPreparation?: boolean;
  firstAnchorEstimatedNormalizeSeconds?: number | null;
  firstAnchorAdmissionReason?: string;
  nextScheduledBlock: ScheduledBlock | null;
  activeScheduledBlock?: ScheduledBlock | null;
  activeScheduledDefinition?: ProgrammingBlockDefinition | null;
}

type NormalizationQueueStatus = {
  queuedCount: number;
  activeCount: number;
  normalizedCount: number;
  failedCount: number;
};

type NormalizationCacheStatus = {
  cacheRoot: string;
  totalBytes: number;
  maxBytes: number;
  usageRatio: number;
  freeDiskBytes: number | null;
};

type NormalizationFailureStatus = {
  sourcePath: string;
  message: string;
  timestamp: number;
};

type NormalizationEvictionStatus = {
  deletedCount: number;
  deletedBytes: number;
  usageRatioBefore: number;
  usageRatioAfter: number;
  aggressive: boolean;
  timestamp: number;
};

type NormalizationStatusSnapshot = {
  queue: NormalizationQueueStatus;
  cache: NormalizationCacheStatus;
  recentFailures: NormalizationFailureStatus[];
  lastEviction: NormalizationEvictionStatus | null;
};

type StartupReadinessCheckStatus = {
  passed: boolean;
  detail: string;
};

type StartupReadinessSnapshot = {
  completedAt: number;
  anchorContent: StartupReadinessCheckStatus;
  facetWalkability: StartupReadinessCheckStatus;
  cadenceBuffer: StartupReadinessCheckStatus;
  warnings: string[];
};

// ============================================================================
// IPC EVENT PAYLOAD MAPPINGS
// ============================================================================

type EventPayloadMapping = {
  openFileDialog: Promise<string[]>;
  probeMediaMetadata: Promise<MediaProbeResult>;
  resolveElectronPlayablePath: Promise<string>;
  getPlayerState: Promise<ElectronPlayerState>;
  getNormalizationStatus: Promise<NormalizationStatusSnapshot>;
  runStartupReadinessChecks: Promise<StartupReadinessSnapshot>;
  getAnchorContentReadinessStatus: Promise<StartupReadinessCheckStatus | null>;
  getFacetWalkabilityReadinessStatus: Promise<StartupReadinessCheckStatus | null>;
  getCadenceBufferReadinessStatus: Promise<StartupReadinessCheckStatus | null>;
  getStartupReadinessStatus: Promise<StartupReadinessSnapshot | null>;
  replacePlayerQueue: Promise<ElectronPlayerState>;
  playerSelectQueueItem: Promise<ElectronPlayerState>;
  playerPlayPrevious: Promise<ElectronPlayerState>;
  playerPlayNext: Promise<ElectronPlayerState>;
  runAdhocPlayerTest: Promise<AdhocPlayerTestResult>;
  getCollections: Promise<Collection[]>;
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
  getFacets: Promise<Facet[]>;
  createFacet: Promise<{ message: string; status: number }>;
  deleteFacet: Promise<{ message: string; status: number }>;
  addFacetRelationship: Promise<{ message: string; status: number }>;
  deleteFacetRelationship: Promise<{ message: string; status: number }>;
  getMosaics: Promise<Mosaic[]>;
  createMosaic: Promise<{ message: string; status: number }>;
  updateMosaic: Promise<{ message: string; status: number }>;
  deleteMosaic: Promise<{ message: string; status: number }>;
};

interface Window {
  electron: {
    openFileDialogHandler: () => Promise<string[]>;
    probeMediaMetadataHandler: (filePath: string) => Promise<MediaProbeResult>;
    resolveElectronPlayablePathHandler: (filePath: string) => Promise<string>;
    getPlayerStateHandler: () => Promise<ElectronPlayerState>;
    getNormalizationStatusHandler: () => Promise<NormalizationStatusSnapshot>;
    runStartupReadinessChecksHandler: () => Promise<StartupReadinessSnapshot>;
    getAnchorContentReadinessStatusHandler: () => Promise<StartupReadinessCheckStatus | null>;
    getFacetWalkabilityReadinessStatusHandler: () => Promise<StartupReadinessCheckStatus | null>;
    getCadenceBufferReadinessStatusHandler: () => Promise<StartupReadinessCheckStatus | null>;
    getStartupReadinessStatusHandler: () => Promise<StartupReadinessSnapshot | null>;
    replacePlayerQueueHandler: (
      filePaths: string[],
    ) => Promise<ElectronPlayerState>;
    playerSelectQueueItemHandler: (
      index: number,
    ) => Promise<ElectronPlayerState>;
    playerPlayPreviousHandler: () => Promise<ElectronPlayerState>;
    playerPlayNextHandler: () => Promise<ElectronPlayerState>;
    runAdhocPlayerTestHandler: (
      cadence: boolean,
    ) => Promise<AdhocPlayerTestResult>;
    getCollectionsHandler: () => Promise<Collection[]>;
    createCollectionHandler: (
      collection: Collection,
    ) => Promise<{ message: string; status: number }>;
    deleteCollectionHandler: (
      collection: Collection,
    ) => Promise<{ message: string; status: number }>;
    updateCollectionHandler: (
      collection: Collection,
    ) => Promise<{ message: string; status: number }>;
    getMoviesHandler: () => Promise<Movie[]>;
    createMovieHandler: (
      movie: Movie,
    ) => Promise<{ message: string; status: number }>;
    deleteMovieHandler: (
      movie: Movie,
    ) => Promise<{ message: string; status: number }>;
    updateMovieHandler: (
      movie: Movie,
    ) => Promise<{ message: string; status: number }>;
    getShowsHandler: () => Promise<Show[]>;
    createShowHandler: (
      show: Show,
    ) => Promise<{ message: string; status: number }>;
    deleteShowHandler: (
      show: Show,
    ) => Promise<{ message: string; status: number }>;
    updateShowHandler: (
      show: Show,
    ) => Promise<{ message: string; status: number }>;
    getShortsHandler: () => Promise<Short[]>;
    createShortHandler: (
      short: Short,
    ) => Promise<{ message: string; status: number }>;
    deleteShortHandler: (
      short: Short,
    ) => Promise<{ message: string; status: number }>;
    updateShortHandler: (
      short: Short,
    ) => Promise<{ message: string; status: number }>;
    getMusicHandler: () => Promise<Music[]>;
    createMusicHandler: (
      music: Music,
    ) => Promise<{ message: string; status: number }>;
    deleteMusicHandler: (
      music: Music,
    ) => Promise<{ message: string; status: number }>;
    updateMusicHandler: (
      music: Music,
    ) => Promise<{ message: string; status: number }>;
    getCommercialsHandler: () => Promise<Commercial[]>;
    createCommercialHandler: (
      commercial: Commercial,
    ) => Promise<{ message: string; status: number }>;
    deleteCommercialHandler: (
      commercial: Commercial,
    ) => Promise<{ message: string; status: number }>;
    updateCommercialHandler: (
      commercial: Commercial,
    ) => Promise<{ message: string; status: number }>;
    getPromosHandler: () => Promise<Promo[]>;
    createPromoHandler: (
      promo: Promo,
    ) => Promise<{ message: string; status: number }>;
    deletePromoHandler: (
      promo: Promo,
    ) => Promise<{ message: string; status: number }>;
    updatePromoHandler: (
      promo: Promo,
    ) => Promise<{ message: string; status: number }>;
    getBumpersHandler: () => Promise<Bumper[]>;
    createBumperHandler: (
      bumper: Bumper,
    ) => Promise<{ message: string; status: number }>;
    deleteBumperHandler: (
      bumper: Bumper,
    ) => Promise<{ message: string; status: number }>;
    updateBumperHandler: (
      bumper: Bumper,
    ) => Promise<{ message: string; status: number }>;
    getAestheticTagsHandler: () => Promise<Tag[]>;
    createAestheticTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteAestheticTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getEraTagsHandler: () => Promise<Tag[]>;
    createEraTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteEraTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getGenreTagsHandler: () => Promise<Tag[]>;
    createGenreTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteGenreTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getSpecialtyTagsHandler: () => Promise<Tag[]>;
    createSpecialtyTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteSpecialtyTagHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getAgeGroupsHandler: () => Promise<Tag[]>;
    createAgeGroupHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteAgeGroupHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    updateAgeGroupHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getHolidaysHandler: () => Promise<Tag[]>;
    createHolidayHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteHolidayHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    updateHolidayHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getMusicGenresHandler: () => Promise<Tag[]>;
    createMusicGenreHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    deleteMusicGenreHandler: (
      tag: Tag,
    ) => Promise<{ message: string; status: number }>;
    getFacetsHandler: () => Promise<Facet[]>;
    createFacetHandler: (
      genre: Tag | null,
      aesthetic: Tag | null,
    ) => Promise<{ message: string; status: number }>;
    deleteFacetHandler: (
      facetId: string,
    ) => Promise<{ message: string; status: number }>;
    addFacetRelationshipHandler: (
      request: FacetRelationshipRequest,
    ) => Promise<{ message: string; status: number }>;
    deleteFacetRelationshipHandler: (
      request: FacetRelationshipDeleteRequest,
    ) => Promise<{ message: string; status: number }>;
    getMosaicsHandler: () => Promise<Mosaic[]>;
    createMosaicHandler: (
      mosaic: Omit<Mosaic, "mosaicId" | "createdAt" | "updatedAt">,
    ) => Promise<{ message: string; status: number }>;
    updateMosaicHandler: (
      mosaic: Mosaic,
    ) => Promise<{ message: string; status: number }>;
    deleteMosaicHandler: (
      mosaicId: string,
    ) => Promise<{ message: string; status: number }>;
  };
}

declare module "ffprobe-static" {
  const ffprobeStatic:
    | string
    | {
        path: string;
      };

  export default ffprobeStatic;
}
