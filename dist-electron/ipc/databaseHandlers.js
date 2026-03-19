import { ipcMain } from "electron";
import * as movieController from "../controllers/movieController.js";
import * as showController from "../controllers/showController.js";
import * as shortController from "../controllers/shortController.js";
import * as musicController from "../controllers/musicController.js";
import * as commercialController from "../controllers/commercialController.js";
import * as promoController from "../controllers/promoController.js";
import * as bumperController from "../controllers/bumperController.js";
import * as tagController from "../controllers/tagController.js";
/**
 * Register all IPC handlers for database operations
 */
export function registerIPCHandlers() {
    // Movie handlers
    ipcMain.handle("createMovie", async (_event, movie) => {
        return await movieController.createMovie(movie);
    });
    ipcMain.handle("getAllMovies", () => {
        return movieController.getAllMovies();
    });
    ipcMain.handle("getMovie", (_event, mediaItemId) => {
        try {
            return movieController.getMovie(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateMovie", async (_event, mediaItemId, updates) => {
        return await movieController.updateMovie(mediaItemId, updates);
    });
    ipcMain.handle("deleteMovie", async (_event, mediaItemId) => {
        return movieController.deleteMovie(mediaItemId);
    });
    // Show handlers
    ipcMain.handle("createShow", async (_event, show) => {
        return await showController.createShow(show);
    });
    ipcMain.handle("getAllShows", () => {
        return showController.getAllShows();
    });
    ipcMain.handle("getShow", (_event, mediaItemId) => {
        try {
            return showController.getShow(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateShow", async (_event, mediaItemId, updates) => {
        return await showController.updateShow(mediaItemId, updates);
    });
    ipcMain.handle("deleteShow", async (_event, mediaItemId) => {
        return showController.deleteShow(mediaItemId);
    });
    // Short handlers
    ipcMain.handle("createShort", async (_event, short) => {
        return await shortController.createShort(short);
    });
    ipcMain.handle("getAllShorts", () => {
        return shortController.getAllShorts();
    });
    ipcMain.handle("getShort", (_event, mediaItemId) => {
        try {
            return shortController.getShort(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateShort", async (_event, mediaItemId, updates) => {
        return await shortController.updateShort(mediaItemId, updates);
    });
    ipcMain.handle("deleteShort", async (_event, mediaItemId) => {
        return shortController.deleteShort(mediaItemId);
    });
    // Music handlers
    ipcMain.handle("createMusic", async (_event, music) => {
        return await musicController.createMusic(music);
    });
    ipcMain.handle("getAllMusic", () => {
        return musicController.getAllMusic();
    });
    ipcMain.handle("getMusic", (_event, mediaItemId) => {
        try {
            return musicController.getMusic(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateMusic", async (_event, mediaItemId, updates) => {
        return await musicController.updateMusic(mediaItemId, updates);
    });
    ipcMain.handle("deleteMusic", async (_event, mediaItemId) => {
        return musicController.deleteMusic(mediaItemId);
    });
    // Commercial handlers
    ipcMain.handle("createCommercial", async (_event, commercial) => {
        return await commercialController.createCommercial(commercial);
    });
    ipcMain.handle("getAllCommercials", () => {
        return commercialController.getAllCommercials();
    });
    ipcMain.handle("getCommercial", (_event, mediaItemId) => {
        try {
            return commercialController.getCommercial(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateCommercial", async (_event, mediaItemId, updates) => {
        return await commercialController.updateCommercial(mediaItemId, updates);
    });
    ipcMain.handle("deleteCommercial", async (_event, mediaItemId) => {
        return commercialController.deleteCommercial(mediaItemId);
    });
    // Promo handlers
    ipcMain.handle("createPromo", async (_event, promo) => {
        return await promoController.createPromo(promo);
    });
    ipcMain.handle("getAllPromos", () => {
        return promoController.getAllPromos();
    });
    ipcMain.handle("getPromo", (_event, mediaItemId) => {
        try {
            return promoController.getPromo(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updatePromo", async (_event, mediaItemId, updates) => {
        return await promoController.updatePromo(mediaItemId, updates);
    });
    ipcMain.handle("deletePromo", async (_event, mediaItemId) => {
        return promoController.deletePromo(mediaItemId);
    });
    // Bumper handlers
    ipcMain.handle("createBumper", async (_event, bumper) => {
        return await bumperController.createBumper(bumper);
    });
    ipcMain.handle("getAllBumpers", () => {
        return bumperController.getAllBumpers();
    });
    ipcMain.handle("getBumper", (_event, mediaItemId) => {
        try {
            return bumperController.getBumper(mediaItemId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateBumper", async (_event, mediaItemId, updates) => {
        return await bumperController.updateBumper(mediaItemId, updates);
    });
    ipcMain.handle("deleteBumper", async (_event, mediaItemId) => {
        return bumperController.deleteBumper(mediaItemId);
    });
    // Tag handlers
    ipcMain.handle("createTag", async (_event, tag) => {
        return await tagController.createTag(tag);
    });
    ipcMain.handle("getAllTags", () => {
        return tagController.getAllTags();
    });
    ipcMain.handle("getTagsByType", (_event, type) => {
        try {
            return tagController.getTagsByType(type);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("getTag", (_event, tagId) => {
        try {
            return tagController.getTag(tagId);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        }
    });
    ipcMain.handle("updateTag", async (_event, tagId, updates) => {
        return await tagController.updateTag(tagId, updates);
    });
    ipcMain.handle("deleteTag", async (_event, tagId) => {
        return tagController.deleteTag(tagId);
    });
    console.log("[IPC] All database handlers registered successfully");
}
