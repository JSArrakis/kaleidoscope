import { app, BrowserWindow } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { connectToDB } from "./db/db.js";
import { startBackgroundService } from "./services/backgroundService.js";
import { openFileDialogHandler } from "./handlers/commonHanlders.js";
import { getCollectionsHandler, createCollectionHandler, deleteCollectionHandler, updateCollectionHandler, } from "./handlers/collectionHandlers.js";
import { createMovieHandler, deleteMovieHandler, getMoviesHandler, updateMovieHandler, } from "./handlers/movieHandlers.js";
import { createShowHandler, deleteShowHandler, getShowsHandler, updateShowHandler, } from "./handlers/showHandlers.js";
import { createShortHandler, deleteShortHandler, getShortsHandler, updateShortHandler, } from "./handlers/shortHandlers.js";
import { createMusicHandler, deleteMusicHandler, getMusicHandler, updateMusicHandler, } from "./handlers/musicHandlers.js";
import { createCommercialHandler, deleteCommercialHandler, getCommercialsHandler, updateCommercialHandler, } from "./handlers/commercialHandlers.js";
import { createPromoHandler, deletePromoHandler, getPromosHandler, updatePromoHandler, } from "./handlers/promoHandlers.js";
import { createBumperHandler, deleteBumperHandler, getBumpersHandler, updateBumperHandler, } from "./handlers/bumperHandlers.js";
import { createAestheticTagHandler, deleteAestheticTagHandler, getAestheticTagsHandler, } from "./handlers/aestheticTagHandlers.js";
import { createEraTagHandler, deleteEraTagHandler, getEraTagsHandler, } from "./handlers/eraTagHandlers.js";
import { createGenreTagHandler, deleteGenreTagHandler, getGenreTagsHandler, } from "./handlers/genreTagHandlers.js";
import { createSpecialtyTagHandler, deleteSpecialtyTagHandler, getSpecialtyTagsHandler, } from "./handlers/specialtyTagHandlers.js";
import { createAgeGroupHandler, deleteAgeGroupHandler, getAgeGroupsHandler, updateAgeGroupHandler, } from "./handlers/ageGroupHandlers.js";
import { createHolidayHandler, deleteHolidayHandler, getHolidaysHandler, updateHolidayHandler, } from "./handlers/holidayHandlers.js";
import { createMusicGenreHandler, deleteMusicGenreHandler, getMusicGenresHandler, } from "./handlers/musicGenreHandlers.js";
app.on("ready", async () => {
    // Initialize database first
    try {
        console.log("Connecting to database...");
        await connectToDB();
        console.log("Database connected.");
    }
    catch (error) {
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
    }
    else {
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
    ipcMainHandle("createCollection", async (_event, collection) => {
        return await createCollectionHandler(collection);
    });
    ipcMainHandle("deleteCollection", async (_event, collection) => {
        return await deleteCollectionHandler(collection);
    });
    ipcMainHandle("updateCollection", async (_event, collection) => {
        return await updateCollectionHandler(collection);
    });
    ipcMainHandle("getMovies", async () => {
        return await getMoviesHandler();
    });
    ipcMainHandle("createMovie", async (_event, movie) => {
        return await createMovieHandler(movie);
    });
    ipcMainHandle("deleteMovie", async (_event, movie) => {
        return await deleteMovieHandler(movie);
    });
    ipcMainHandle("updateMovie", async (_event, movie) => {
        return await updateMovieHandler(movie);
    });
    ipcMainHandle("getShows", async () => {
        return await getShowsHandler();
    });
    ipcMainHandle("createShow", async (_event, show) => {
        return await createShowHandler(show);
    });
    ipcMainHandle("deleteShow", async (_event, show) => {
        return await deleteShowHandler(show);
    });
    ipcMainHandle("updateShow", async (_event, show) => {
        return await updateShowHandler(show);
    });
    ipcMainHandle("getShorts", async () => {
        return await getShortsHandler();
    });
    ipcMainHandle("createShort", async (_event, short) => {
        return await createShortHandler(short);
    });
    ipcMainHandle("deleteShort", async (_event, short) => {
        return await deleteShortHandler(short);
    });
    ipcMainHandle("updateShort", async (_event, short) => {
        return await updateShortHandler(short);
    });
    ipcMainHandle("getMusic", async () => {
        return await getMusicHandler();
    });
    ipcMainHandle("createMusic", async (_event, music) => {
        return await createMusicHandler(music);
    });
    ipcMainHandle("deleteMusic", async (_event, music) => {
        return await deleteMusicHandler(music);
    });
    ipcMainHandle("updateMusic", async (_event, music) => {
        return await updateMusicHandler(music);
    });
    ipcMainHandle("getCommercials", async () => {
        return await getCommercialsHandler();
    });
    ipcMainHandle("createCommercial", async (_event, commercial) => {
        return await createCommercialHandler(commercial);
    });
    ipcMainHandle("deleteCommercial", async (_event, commercial) => {
        return await deleteCommercialHandler(commercial);
    });
    ipcMainHandle("updateCommercial", async (_event, commercial) => {
        return await updateCommercialHandler(commercial);
    });
    ipcMainHandle("getPromos", async () => {
        return await getPromosHandler();
    });
    ipcMainHandle("createPromo", async (_event, promo) => {
        return await createPromoHandler(promo);
    });
    ipcMainHandle("deletePromo", async (_event, promo) => {
        return await deletePromoHandler(promo);
    });
    ipcMainHandle("updatePromo", async (_event, promo) => {
        return await updatePromoHandler(promo);
    });
    ipcMainHandle("getBumpers", async () => {
        return await getBumpersHandler();
    });
    ipcMainHandle("createBumper", async (_event, bumper) => {
        return await createBumperHandler(bumper);
    });
    ipcMainHandle("deleteBumper", async (_event, bumper) => {
        return await deleteBumperHandler(bumper);
    });
    ipcMainHandle("updateBumper", async (_event, bumper) => {
        return await updateBumperHandler(bumper);
    });
    ipcMainHandle("getAestheticTags", async () => {
        return await getAestheticTagsHandler();
    });
    ipcMainHandle("createAestheticTag", async (_event, tag) => {
        return await createAestheticTagHandler(tag);
    });
    ipcMainHandle("deleteAestheticTag", async (_event, tag) => {
        return await deleteAestheticTagHandler(tag);
    });
    ipcMainHandle("getEraTags", async () => {
        return await getEraTagsHandler();
    });
    ipcMainHandle("createEraTag", async (_event, tag) => {
        return await createEraTagHandler(tag);
    });
    ipcMainHandle("deleteEraTag", async (_event, tag) => {
        return await deleteEraTagHandler(tag);
    });
    ipcMainHandle("getGenreTags", async () => {
        return await getGenreTagsHandler();
    });
    ipcMainHandle("createGenreTag", async (_event, tag) => {
        return await createGenreTagHandler(tag);
    });
    ipcMainHandle("deleteGenreTag", async (_event, tag) => {
        return await deleteGenreTagHandler(tag);
    });
    ipcMainHandle("getSpecialtyTags", async () => {
        return await getSpecialtyTagsHandler();
    });
    ipcMainHandle("createSpecialtyTag", async (_event, tag) => {
        return await createSpecialtyTagHandler(tag);
    });
    ipcMainHandle("deleteSpecialtyTag", async (_event, tag) => {
        return await deleteSpecialtyTagHandler(tag);
    });
    ipcMainHandle("getAgeGroups", async () => {
        return await getAgeGroupsHandler();
    });
    ipcMainHandle("createAgeGroup", async (_event, tag) => {
        return await createAgeGroupHandler(tag);
    });
    ipcMainHandle("deleteAgeGroup", async (_event, tag) => {
        return await deleteAgeGroupHandler(tag);
    });
    ipcMainHandle("updateAgeGroup", async (_event, tag) => {
        return await updateAgeGroupHandler(tag);
    });
    ipcMainHandle("getHolidays", async () => {
        return await getHolidaysHandler();
    });
    ipcMainHandle("createHoliday", async (_event, tag) => {
        return await createHolidayHandler(tag);
    });
    ipcMainHandle("deleteHoliday", async (_event, tag) => {
        return await deleteHolidayHandler(tag);
    });
    ipcMainHandle("updateHoliday", async (_event, tag) => {
        return await updateHolidayHandler(tag);
    });
    ipcMainHandle("getMusicGenres", async () => {
        return await getMusicGenresHandler();
    });
    ipcMainHandle("createMusicGenre", async (_event, tag) => {
        return await createMusicGenreHandler(tag);
    });
    ipcMainHandle("deleteMusicGenre", async (_event, tag) => {
        return await deleteMusicGenreHandler(tag);
    });
});
