import { app, BrowserWindow } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { connectToDB } from "./db/db.js";
import { startBackgroundService } from "./services/backgroundService.js";
import { openFileDialogHandler } from "./handlers/commonHanlders.js";
import {
  getCollectionsHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  updateCollectionHandler,
} from "./handlers/collectionHandlers.js";
import {
  createMovieHandler,
  deleteMovieHandler,
  getMoviesHandler,
  updateMovieHandler,
} from "./handlers/movieHandlers.js";
import {
  createShowHandler,
  deleteShowHandler,
  getShowsHandler,
  updateShowHandler,
} from "./handlers/showHandlers.js";
import {
  createShortHandler,
  deleteShortHandler,
  getShortsHandler,
  updateShortHandler,
} from "./handlers/shortHandlers.js";
import {
  createMusicHandler,
  deleteMusicHandler,
  getMusicHandler,
  updateMusicHandler,
} from "./handlers/musicHandlers.js";
import {
  createCommercialHandler,
  deleteCommercialHandler,
  getCommercialsHandler,
  updateCommercialHandler,
} from "./handlers/commercialHandlers.js";
import {
  createPromoHandler,
  deletePromoHandler,
  getPromosHandler,
  updatePromoHandler,
} from "./handlers/promoHandlers.js";
import {
  createBumperHandler,
  deleteBumperHandler,
  getBumpersHandler,
  updateBumperHandler,
} from "./handlers/bumperHandlers.js";
import {
  createAestheticTagHandler,
  deleteAestheticTagHandler,
  getAestheticTagsHandler,
} from "./handlers/aestheticTagHandlers.js";
import {
  createEraTagHandler,
  deleteEraTagHandler,
  getEraTagsHandler,
} from "./handlers/eraTagHandlers.js";
import {
  createGenreTagHandler,
  deleteGenreTagHandler,
  getGenreTagsHandler,
} from "./handlers/genreTagHandlers.js";
import {
  createSpecialtyTagHandler,
  deleteSpecialtyTagHandler,
  getSpecialtyTagsHandler,
} from "./handlers/specialtyTagHandlers.js";
import {
  createAgeGroupHandler,
  deleteAgeGroupHandler,
  getAgeGroupsHandler,
  updateAgeGroupHandler,
} from "./handlers/ageGroupHandlers.js";
import {
  createHolidayHandler,
  deleteHolidayHandler,
  getHolidaysHandler,
  updateHolidayHandler,
} from "./handlers/holidayHandlers.js";
import {
  createMusicGenreHandler,
  deleteMusicGenreHandler,
  getMusicGenresHandler,
} from "./handlers/musicGenreHandlers.js";

app.on("ready", async () => {
  // Initialize database first
  try {
    await connectToDB();
  } catch (error) {
    console.error("Failed to connect to database:", error);
    // Continue anyway to allow app to start
  }

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  // Start background service
  startBackgroundService();

  // Menu.setApplicationMenu(null);
  ipcMainHandle("openFileDialog", async () => {
    return await openFileDialogHandler(mainWindow);
  });
  ipcMainHandle("getCollections", async () => {
    return await getCollectionsHandler();
  });
  ipcMainHandle(
    "createCollection",
    async (_event: any, collection: PrismCurationObj) => {
      return await createCollectionHandler(collection);
    }
  );
  ipcMainHandle(
    "deleteCollection",
    async (_event: any, collection: PrismCurationObj) => {
      return await deleteCollectionHandler(collection);
    }
  );
  ipcMainHandle(
    "updateCollection",
    async (_event: any, collection: PrismCurationObj) => {
      return await updateCollectionHandler(collection);
    }
  );
  ipcMainHandle("getMovies", async () => {
    return await getMoviesHandler();
  });
  ipcMainHandle("createMovie", async (_event: any, movie: Movie) => {
    return await createMovieHandler(movie);
  });
  ipcMainHandle("deleteMovie", async (_event: any, movie: Movie) => {
    return await deleteMovieHandler(movie);
  });
  ipcMainHandle("updateMovie", async (_event: any, movie: Movie) => {
    return await updateMovieHandler(movie);
  });
  ipcMainHandle("getShows", async () => {
    return await getShowsHandler();
  });
  ipcMainHandle("createShow", async (_event: any, show: Show) => {
    return await createShowHandler(show);
  });
  ipcMainHandle("deleteShow", async (_event: any, show: Show) => {
    return await deleteShowHandler(show);
  });
  ipcMainHandle("updateShow", async (_event: any, show: Show) => {
    return await updateShowHandler(show);
  });
  ipcMainHandle("getShorts", async () => {
    return await getShortsHandler();
  });
  ipcMainHandle("createShort", async (_event: any, short: Short) => {
    return await createShortHandler(short);
  });
  ipcMainHandle("deleteShort", async (_event: any, short: Short) => {
    return await deleteShortHandler(short);
  });
  ipcMainHandle("updateShort", async (_event: any, short: Short) => {
    return await updateShortHandler(short);
  });
  ipcMainHandle("getMusic", async () => {
    return await getMusicHandler();
  });
  ipcMainHandle("createMusic", async (_event: any, music: Music) => {
    return await createMusicHandler(music);
  });
  ipcMainHandle("deleteMusic", async (_event: any, music: Music) => {
    return await deleteMusicHandler(music);
  });
  ipcMainHandle("updateMusic", async (_event: any, music: Music) => {
    return await updateMusicHandler(music);
  });
  ipcMainHandle("getCommercials", async () => {
    return await getCommercialsHandler();
  });
  ipcMainHandle(
    "createCommercial",
    async (_event: any, commercial: Commercial) => {
      return await createCommercialHandler(commercial);
    }
  );
  ipcMainHandle(
    "deleteCommercial",
    async (_event: any, commercial: Commercial) => {
      return await deleteCommercialHandler(commercial);
    }
  );
  ipcMainHandle(
    "updateCommercial",
    async (_event: any, commercial: Commercial) => {
      return await updateCommercialHandler(commercial);
    }
  );
  ipcMainHandle("getPromos", async () => {
    return await getPromosHandler();
  });
  ipcMainHandle("createPromo", async (_event: any, promo: Promo) => {
    return await createPromoHandler(promo);
  });
  ipcMainHandle("deletePromo", async (_event: any, promo: Promo) => {
    return await deletePromoHandler(promo);
  });
  ipcMainHandle("updatePromo", async (_event: any, promo: Promo) => {
    return await updatePromoHandler(promo);
  });
  ipcMainHandle("getBumpers", async () => {
    return await getBumpersHandler();
  });
  ipcMainHandle("createBumper", async (_event: any, bumper: Bumper) => {
    return await createBumperHandler(bumper);
  });
  ipcMainHandle("deleteBumper", async (_event: any, bumper: Bumper) => {
    return await deleteBumperHandler(bumper);
  });
  ipcMainHandle("updateBumper", async (_event: any, bumper: Bumper) => {
    return await updateBumperHandler(bumper);
  });
  ipcMainHandle("getAestheticTags", async () => {
    return await getAestheticTagsHandler();
  });
  ipcMainHandle("createAestheticTag", async (_event: any, tag: Tag) => {
    return await createAestheticTagHandler(tag);
  });
  ipcMainHandle("deleteAestheticTag", async (_event: any, tag: Tag) => {
    return await deleteAestheticTagHandler(tag);
  });
  ipcMainHandle("getEraTags", async () => {
    return await getEraTagsHandler();
  });
  ipcMainHandle("createEraTag", async (_event: any, tag: Tag) => {
    return await createEraTagHandler(tag);
  });
  ipcMainHandle("deleteEraTag", async (_event: any, tag: Tag) => {
    return await deleteEraTagHandler(tag);
  });
  ipcMainHandle("getGenreTags", async () => {
    return await getGenreTagsHandler();
  });
  ipcMainHandle("createGenreTag", async (_event: any, tag: Tag) => {
    return await createGenreTagHandler(tag);
  });
  ipcMainHandle("deleteGenreTag", async (_event: any, tag: Tag) => {
    return await deleteGenreTagHandler(tag);
  });
  ipcMainHandle("getSpecialtyTags", async () => {
    return await getSpecialtyTagsHandler();
  });
  ipcMainHandle("createSpecialtyTag", async (_event: any, tag: Tag) => {
    return await createSpecialtyTagHandler(tag);
  });
  ipcMainHandle("deleteSpecialtyTag", async (_event: any, tag: Tag) => {
    return await deleteSpecialtyTagHandler(tag);
  });
  ipcMainHandle("getAgeGroups", async () => {
    return await getAgeGroupsHandler();
  });
  ipcMainHandle("createAgeGroup", async (_event: any, tag: Tag) => {
    return await createAgeGroupHandler(tag);
  });
  ipcMainHandle("deleteAgeGroup", async (_event: any, tag: Tag) => {
    return await deleteAgeGroupHandler(tag);
  });
  ipcMainHandle("updateAgeGroup", async (_event: any, tag: Tag) => {
    return await updateAgeGroupHandler(tag);
  });
  ipcMainHandle("getHolidays", async () => {
    return await getHolidaysHandler();
  });
  ipcMainHandle("createHoliday", async (_event: any, tag: Tag) => {
    return await createHolidayHandler(tag);
  });
  ipcMainHandle("deleteHoliday", async (_event: any, tag: Tag) => {
    return await deleteHolidayHandler(tag);
  });
  ipcMainHandle("updateHoliday", async (_event: any, tag: Tag) => {
    return await updateHolidayHandler(tag);
  });
  ipcMainHandle("getMusicGenres", async () => {
    return await getMusicGenresHandler();
  });
  ipcMainHandle("createMusicGenre", async (_event: any, tag: Tag) => {
    return await createMusicGenreHandler(tag);
  });
  ipcMainHandle("deleteMusicGenre", async (_event: any, tag: Tag) => {
    return await deleteMusicGenreHandler(tag);
  });
});
