/**
 * Shared type definitions and IPC contracts
 */

export enum ServiceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  ERROR = 'error',
  STOPPED = 'stopped',
}

export interface ServiceStatusPayload {
  status: ServiceStatus;
  port?: number;
  error?: string;
  timestamp: number;
}

/**
 * IPC Event type definitions
 * Extend this interface with new IPC events
 */
export interface EventPayloadMapping {
  // Existing handlers (from preload)
  openFileDialog: string[];
  getCollections: any[];
  createCollection: string;
  deleteCollection: string;
  updateCollection: string;
  getMovies: any[];
  createMovie: string;
  deleteMovie: string;
  updateMovie: string;
  getShows: any[];
  createShow: string;
  deleteShow: string;
  updateShow: string;
  getShorts: any[];
  createShort: string;
  deleteShort: string;
  updateShort: string;
  getMusic: any[];
  createMusic: string;
  deleteMusic: string;
  updateMusic: string;
  getCommercials: any[];
  createCommercial: string;
  deleteCommercial: string;
  updateCommercial: string;
  getPromos: any[];
  createPromo: string;
  deletePromo: string;
  updatePromo: string;
  getBumpers: any[];
  createBumper: string;
  deleteBumper: string;
  updateBumper: string;
  getAestheticTags: any[];
  createAestheticTag: string;
  deleteAestheticTag: string;
  getEraTags: any[];
  createEraTag: string;
  deleteEraTag: string;
  getGenreTags: any[];
  createGenreTag: string;
  deleteGenreTag: string;
  getSpecialtyTags: any[];
  createSpecialtyTag: string;
  deleteSpecialtyTag: string;
  getAgeGroups: any[];
  createAgeGroup: string;
  deleteAgeGroup: string;
  updateAgeGroup: string;
  getHolidays: any[];
  createHoliday: string;
  deleteHoliday: string;
  updateHoliday: string;
  getMusicGenres: any[];
  createMusicGenre: string;
  deleteMusicGenre: string;

  // Service status events
  serviceStatusChanged: ServiceStatusPayload;
  getServiceStatus: ServiceStatusPayload;
}
