/// <reference types="electron" />

declare enum ServiceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  ERROR = 'error',
  STOPPED = 'stopped',
}

declare type ServiceStatusPayload = {
  status: ServiceStatus;
  port?: number;
  error?: string;
  timestamp: number;
};

declare type PrismCurationObj = {
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

type PrismMediaItem = {
  mediaItemId: string;
  title?: string;
  alias?: string;
  imdb?: string;
  tags: string[];
  path?: string;
  duration?: number;
  durationLimit?: number;
  overDuration?: boolean;
  firstEpisodeOverDuration?: boolean;
  collections?: PrismCurationReference[];
  blocks?: PrismCurationReference[];
  episodeCount?: number;
  episodes?: PrismEpisodeItem[];
};

type PrismCurationReference = {
  curationRefId: string;
  title: string;
  sequence: number;
};

type PrismEpisodeItem = {
  mediaItemId: string;
  title: string;
  season?: string;
  episode?: string;
  episodeNumber?: number;
  path: string;
  duration?: number;
  durationLimit?: number;
  tags: string[];
};

type PrismSegmentedTags = {
  EraTags: Tag[];
  GenreTags: Tag[];
  AestheticTags: Tag[];
  SpecialtyTags: Tag[];
  AgeGroupTags: Tag[];
  HolidayTags: Tag[];
};

type Tag = {
  tagId: string;
  name: string;
  subgenres?: Subgenre[];
  seasonStartDate?: string;
  seasonEndDate?: string;
  holidayDate?: string;
  sequence?: number;
};

type Subgenre = {
  tagId: string;
  name: string;
};

type EventPayloadMapping = {
  getServiceStatus: ServiceStatusPayload;
  serviceStatusChanged: ServiceStatusPayload;
  openFileDialog: Promise<string[]>;
  getCollections: Promise<PrismCurationObj[]>;
  createCollection: Promise<{ message: string; status: number }>;
  deleteCollection: Promise<{ message: string; status: number }>;
  updateCollection: Promise<{ message: string; status: number }>;
  getMovies: Promise<PrismMediaItem[]>;
  createMovie: Promise<{ message: string; status: number }>;
  deleteMovie: Promise<{ message: string; status: number }>;
  updateMovie: Promise<{ message: string; status: number }>;
  getShows: Promise<PrismMediaItem[]>;
  createShow: Promise<{ message: string; status: number }>;
  deleteShow: Promise<{ message: string; status: number }>;
  updateShow: Promise<{ message: string; status: number }>;
  getShorts: Promise<PrismMediaItem[]>;
  createShort: Promise<{ message: string; status: number }>;
  deleteShort: Promise<{ message: string; status: number }>;
  updateShort: Promise<{ message: string; status: number }>;
  getMusic: Promise<PrismMediaItem[]>;
  createMusic: Promise<{ message: string; status: number }>;
  deleteMusic: Promise<{ message: string; status: number }>;
  updateMusic: Promise<{ message: string; status: number }>;
  getCommercials: Promise<PrismMediaItem[]>;
  createCommercial: Promise<{ message: string; status: number }>;
  deleteCommercial: Promise<{ message: string; status: number }>;
  updateCommercial: Promise<{ message: string; status: number }>;
  getPromos: Promise<PrismMediaItem[]>;
  createPromo: Promise<{ message: string; status: number }>;
  deletePromo: Promise<{ message: string; status: number }>;
  updatePromo: Promise<{ message: string; status: number }>;
  getBumpers: Promise<PrismMediaItem[]>;
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
    getServiceStatus: () => Promise<ServiceStatusPayload>;
    onServiceStatusChanged: (
      callback: (status: ServiceStatusPayload) => void,
    ) => void;
    openFileDialogHandler: () => Promise<string[]>;
    getCollectionsHandler: () => Promise<PrismCurationObj[]>;
    createCollectionHandler: (
      collection: PrismCurationObj,
    ) => Promise<{ message: string; status: number }>;
    deleteCollectionHandler: (
      collection: PrismCurationObj,
    ) => Promise<{ message: string; status: number }>;
    updateCollectionHandler: (
      collection: PrismCurationObj,
    ) => Promise<{ message: string; status: number }>;
    getMoviesHandler: () => Promise<PrismMediaItem[]>;
    createMovieHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteMovieHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateMovieHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getShowsHandler: () => Promise<PrismMediaItem[]>;
    createShowHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteShowHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateShowHandler: (
      movie: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getShortsHandler: () => Promise<PrismMediaItem[]>;
    createShortHandler: (
      short: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteShortHandler: (
      short: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateShortHandler: (
      short: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getMusicHandler: () => Promise<PrismMediaItem[]>;
    createMusicHandler: (
      music: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteMusicHandler: (
      music: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateMusicHandler: (
      music: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getCommercialsHandler: () => Promise<PrismMediaItem[]>;
    createCommercialHandler: (
      commercial: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteCommercialHandler: (
      commercial: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateCommercialHandler: (
      commercial: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getPromosHandler: () => Promise<PrismMediaItem[]>;
    createPromoHandler: (
      promo: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deletePromoHandler: (
      promo: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updatePromoHandler: (
      promo: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    getBumpersHandler: () => Promise<PrismMediaItem[]>;
    createBumperHandler: (
      bumper: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    deleteBumperHandler: (
      bumper: PrismMediaItem,
    ) => Promise<{ message: string; status: number }>;
    updateBumperHandler: (
      bumper: PrismMediaItem,
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
  };
}
