/// <reference types="node" />
import { app, BrowserWindow } from 'electron';
import { ipcMainHandle, isDev, ipcWebContentsSend } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
// @ts-ignore - import.meta is valid for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service status enum (duplicated from shared for now)
enum ServiceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  ERROR = 'error',
  STOPPED = 'stopped',
}

import { openFileDialogHandler } from './handlers/commonHanlders.js';
import {
  getCollectionsHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  updateCollectionHandler,
} from './handlers/collectionHandlers.js';
import {
  createMovieHandler,
  deleteMovieHandler,
  getMoviesHandler,
  updateMovieHandler,
} from './handlers/movieHandlers.js';
import {
  createShowHandler,
  deleteShowHandler,
  getShowsHandler,
  updateShowHandler,
} from './handlers/showHandlers.js';
import {
  createShortHandler,
  deleteShortHandler,
  getShortsHandler,
  updateShortHandler,
} from './handlers/shortHandlers.js';
import {
  createMusicHandler,
  deleteMusicHandler,
  getMusicHandler,
  updateMusicHandler,
} from './handlers/musicHandlers.js';
import {
  createCommercialHandler,
  deleteCommercialHandler,
  getCommercialsHandler,
  updateCommercialHandler,
} from './handlers/commercialHandlers.js';
import {
  createPromoHandler,
  deletePromoHandler,
  getPromosHandler,
  updatePromoHandler,
} from './handlers/promoHandlers.js';
import {
  createBumperHandler,
  deleteBumperHandler,
  getBumpersHandler,
  updateBumperHandler,
} from './handlers/bumperHandlers.js';
import {
  createAestheticTagHandler,
  deleteAestheticTagHandler,
  getAestheticTagsHandler,
} from './handlers/aestheticTagHandlers.js';
import {
  createEraTagHandler,
  deleteEraTagHandler,
  getEraTagsHandler,
} from './handlers/eraTagHandlers.js';
import {
  createGenreTagHandler,
  deleteGenreTagHandler,
  getGenreTagsHandler,
} from './handlers/genreTagHandlers.js';
import {
  createSpecialtyTagHandler,
  deleteSpecialtyTagHandler,
  getSpecialtyTagsHandler,
} from './handlers/specialtyTagHandlers.js';
import {
  createAgeGroupHandler,
  deleteAgeGroupHandler,
  getAgeGroupsHandler,
  updateAgeGroupHandler,
} from './handlers/ageGroupHandlers.js';
import {
  createHolidayHandler,
  deleteHolidayHandler,
  getHolidaysHandler,
  updateHolidayHandler,
} from './handlers/holidayHandlers.js';
import {
  createMusicGenreHandler,
  deleteMusicGenreHandler,
  getMusicGenresHandler,
} from './handlers/musicGenreHandlers.js';

let mainWindow: BrowserWindow | null = null;
let backendService: ChildProcess | null = null;
let serviceStatus: ServiceStatusPayload = {
  status: ServiceStatus.STOPPED,
  timestamp: Date.now(),
};
const BACKEND_PORT = 3001;
const SERVICE_CHECK_INTERVAL = 2000; // Check every 2 seconds
let serviceCheckInterval: NodeJS.Timeout | null = null;

function updateServiceStatus(
  status: ServiceStatus,
  port?: number,
  error?: string,
): void {
  serviceStatus = {
    status,
    port,
    error,
    timestamp: Date.now(),
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    ipcWebContentsSend(
      'serviceStatusChanged',
      mainWindow.webContents,
      serviceStatus,
    );
  }

  console.log(`[Service] Status: ${status}`, error ? `(${error})` : '');
}

function getBackendPath(): string {
  if (isDev()) {
    // In development, backend dist is in app/dist-backend
    // __dirname points to dist-electron folder
    const backendPath = path.resolve(__dirname, '../dist-backend/app.js');
    console.log('Backend path resolved to:', backendPath);
    return path.dirname(backendPath); // Return directory, not the file
  } else {
    // In production, backend is bundled in resources
    return path.join(app.getAppPath(), 'backend');
  }
}

async function checkServiceHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(
      `http://localhost:${BACKEND_PORT}/api/v1/health`,
      {
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

function startBackendService(): void {
  try {
    const backendPath = getBackendPath();
    // getBackendPath returns the directory containing app.js
    const backendAppPath = path.join(backendPath, 'app.cjs');

    console.log(`Starting backend service from: ${backendAppPath}`);
    updateServiceStatus(ServiceStatus.STARTING);

    backendService = spawn('node', [backendAppPath], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '--experimental-modules' },
    });

    backendService.stdout?.on('data', data => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendService.stderr?.on('data', data => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    backendService.on('close', code => {
      console.log(`Backend service exited with code ${code}`);
      updateServiceStatus(ServiceStatus.STOPPED);
      if (serviceCheckInterval) {
        clearInterval(serviceCheckInterval);
        serviceCheckInterval = null;
      }
    });

    backendService.on('error', err => {
      console.error('Backend service error:', err);
      updateServiceStatus(ServiceStatus.ERROR, undefined, err.message);
    });

    console.log(
      'Backend service spawned successfully, waiting for health check...',
    );

    // Start health checks
    startHealthChecks();
  } catch (error) {
    console.error('Error starting backend service:', error);
    updateServiceStatus(
      ServiceStatus.ERROR,
      undefined,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

function startHealthChecks(): void {
  if (serviceCheckInterval) {
    clearInterval(serviceCheckInterval);
  }

  serviceCheckInterval = setInterval(async () => {
    try {
      const isHealthy = await checkServiceHealth();
      if (isHealthy && serviceStatus.status !== ServiceStatus.RUNNING) {
        updateServiceStatus(ServiceStatus.RUNNING, BACKEND_PORT);
      } else if (!isHealthy && serviceStatus.status === ServiceStatus.RUNNING) {
        updateServiceStatus(
          ServiceStatus.ERROR,
          undefined,
          'Service became unresponsive',
        );
      }
    } catch (error) {
      if (serviceStatus.status === ServiceStatus.RUNNING) {
        updateServiceStatus(
          ServiceStatus.ERROR,
          undefined,
          'Health check failed',
        );
      }
    }
  }, SERVICE_CHECK_INTERVAL);
}

app.on('ready', () => {
  startBackendService();

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(getUIPath());
  }

  // Menu.setApplicationMenu(null);
  ipcMainHandle('getServiceStatus', () => {
    return serviceStatus;
  });
  ipcMainHandle('openFileDialog', async () => {
    return await openFileDialogHandler(mainWindow!);
  });
  ipcMainHandle('getCollections', async () => {
    return await getCollectionsHandler();
  });
  ipcMainHandle(
    'createCollection',
    async (_event: any, collection: PrismCurationObj) => {
      return await createCollectionHandler(collection);
    },
  );
  ipcMainHandle(
    'deleteCollection',
    async (_event: any, collection: PrismCurationObj) => {
      return await deleteCollectionHandler(collection);
    },
  );
  ipcMainHandle(
    'updateCollection',
    async (_event: any, collection: PrismCurationObj) => {
      return await updateCollectionHandler(collection);
    },
  );
  ipcMainHandle('getMovies', async () => {
    return await getMoviesHandler();
  });
  ipcMainHandle('createMovie', async (_event: any, movie: PrismMediaItem) => {
    return await createMovieHandler(movie);
  });
  ipcMainHandle('deleteMovie', async (_event: any, movie: PrismMediaItem) => {
    return await deleteMovieHandler(movie);
  });
  ipcMainHandle('updateMovie', async (_event: any, movie: PrismMediaItem) => {
    return await updateMovieHandler(movie);
  });
  ipcMainHandle('getShows', async () => {
    return await getShowsHandler();
  });
  ipcMainHandle('createShow', async (_event: any, show: PrismMediaItem) => {
    return await createShowHandler(show);
  });
  ipcMainHandle('deleteShow', async (_event: any, show: PrismMediaItem) => {
    return await deleteShowHandler(show);
  });
  ipcMainHandle('updateShow', async (_event: any, show: PrismMediaItem) => {
    return await updateShowHandler(show);
  });
  ipcMainHandle('getShorts', async () => {
    return await getShortsHandler();
  });
  ipcMainHandle('createShort', async (_event: any, short: PrismMediaItem) => {
    return await createShortHandler(short);
  });
  ipcMainHandle('deleteShort', async (_event: any, short: PrismMediaItem) => {
    return await deleteShortHandler(short);
  });
  ipcMainHandle('updateShort', async (_event: any, short: PrismMediaItem) => {
    return await updateShortHandler(short);
  });
  ipcMainHandle('getMusic', async () => {
    return await getMusicHandler();
  });
  ipcMainHandle('createMusic', async (_event: any, music: PrismMediaItem) => {
    return await createMusicHandler(music);
  });
  ipcMainHandle('deleteMusic', async (_event: any, music: PrismMediaItem) => {
    return await deleteMusicHandler(music);
  });
  ipcMainHandle('updateMusic', async (_event: any, music: PrismMediaItem) => {
    return await updateMusicHandler(music);
  });
  ipcMainHandle('getCommercials', async () => {
    return await getCommercialsHandler();
  });
  ipcMainHandle(
    'createCommercial',
    async (_event: any, commercial: PrismMediaItem) => {
      return await createCommercialHandler(commercial);
    },
  );
  ipcMainHandle(
    'deleteCommercial',
    async (_event: any, commercial: PrismMediaItem) => {
      return await deleteCommercialHandler(commercial);
    },
  );
  ipcMainHandle(
    'updateCommercial',
    async (_event: any, commercial: PrismMediaItem) => {
      return await updateCommercialHandler(commercial);
    },
  );
  ipcMainHandle('getPromos', async () => {
    return await getPromosHandler();
  });
  ipcMainHandle('createPromo', async (_event: any, promo: PrismMediaItem) => {
    return await createPromoHandler(promo);
  });
  ipcMainHandle('deletePromo', async (_event: any, promo: PrismMediaItem) => {
    return await deletePromoHandler(promo);
  });
  ipcMainHandle('updatePromo', async (_event: any, promo: PrismMediaItem) => {
    return await updatePromoHandler(promo);
  });
  ipcMainHandle('getBumpers', async () => {
    return await getBumpersHandler();
  });
  ipcMainHandle('createBumper', async (_event: any, bumper: PrismMediaItem) => {
    return await createBumperHandler(bumper);
  });
  ipcMainHandle('deleteBumper', async (_event: any, bumper: PrismMediaItem) => {
    return await deleteBumperHandler(bumper);
  });
  ipcMainHandle('updateBumper', async (_event: any, bumper: PrismMediaItem) => {
    return await updateBumperHandler(bumper);
  });
  ipcMainHandle('getAestheticTags', async () => {
    return await getAestheticTagsHandler();
  });
  ipcMainHandle('createAestheticTag', async (_event: any, tag: Tag) => {
    return await createAestheticTagHandler(tag);
  });
  ipcMainHandle('deleteAestheticTag', async (_event: any, tag: Tag) => {
    return await deleteAestheticTagHandler(tag);
  });
  ipcMainHandle('getEraTags', async () => {
    return await getEraTagsHandler();
  });
  ipcMainHandle('createEraTag', async (_event: any, tag: Tag) => {
    return await createEraTagHandler(tag);
  });
  ipcMainHandle('deleteEraTag', async (_event: any, tag: Tag) => {
    return await deleteEraTagHandler(tag);
  });
  ipcMainHandle('getGenreTags', async () => {
    return await getGenreTagsHandler();
  });
  ipcMainHandle('createGenreTag', async (_event: any, tag: Tag) => {
    return await createGenreTagHandler(tag);
  });
  ipcMainHandle('deleteGenreTag', async (_event: any, tag: Tag) => {
    return await deleteGenreTagHandler(tag);
  });
  ipcMainHandle('getSpecialtyTags', async () => {
    return await getSpecialtyTagsHandler();
  });
  ipcMainHandle('createSpecialtyTag', async (_event: any, tag: Tag) => {
    return await createSpecialtyTagHandler(tag);
  });
  ipcMainHandle('deleteSpecialtyTag', async (_event: any, tag: Tag) => {
    return await deleteSpecialtyTagHandler(tag);
  });
  ipcMainHandle('getAgeGroups', async () => {
    return await getAgeGroupsHandler();
  });
  ipcMainHandle('createAgeGroup', async (_event: any, tag: Tag) => {
    return await createAgeGroupHandler(tag);
  });
  ipcMainHandle('deleteAgeGroup', async (_event: any, tag: Tag) => {
    return await deleteAgeGroupHandler(tag);
  });
  ipcMainHandle('updateAgeGroup', async (_event: any, tag: Tag) => {
    return await updateAgeGroupHandler(tag);
  });
  ipcMainHandle('getHolidays', async () => {
    return await getHolidaysHandler();
  });
  ipcMainHandle('createHoliday', async (_event: any, tag: Tag) => {
    return await createHolidayHandler(tag);
  });
  ipcMainHandle('deleteHoliday', async (_event: any, tag: Tag) => {
    return await deleteHolidayHandler(tag);
  });
  ipcMainHandle('updateHoliday', async (_event: any, tag: Tag) => {
    return await updateHolidayHandler(tag);
  });
  ipcMainHandle('getMusicGenres', async () => {
    return await getMusicGenresHandler();
  });
  ipcMainHandle('createMusicGenre', async (_event: any, tag: Tag) => {
    return await createMusicGenreHandler(tag);
  });
  ipcMainHandle('deleteMusicGenre', async (_event: any, tag: Tag) => {
    return await deleteMusicGenreHandler(tag);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (serviceCheckInterval) {
    clearInterval(serviceCheckInterval);
    serviceCheckInterval = null;
  }
  if (backendService && !backendService.killed) {
    backendService.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    const window = new BrowserWindow({
      width: 1024,
      height: 728,
      webPreferences: {
        preload: getPreloadPath(),
      },
    });
    if (isDev()) {
      window.loadURL('http://localhost:5123');
    } else {
      window.loadFile(getUIPath());
    }
    mainWindow = window;
  }
});
