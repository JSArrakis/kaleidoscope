import { app, BrowserWindow, shell } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { closeDB, connectToDB } from "./db/db.js";
import { startBackgroundService, stopBackgroundService, } from "./services/backgroundService.js";
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
import { probeMediaMetadataHandler } from "./handlers/mediaProbeHandlers.js";
import { addFacetRelationshipHandler, createFacetHandler, deleteFacetHandler, deleteFacetRelationshipHandler, getFacetsHandler, } from "./handlers/facetHandlers.js";
import { createMosaicHandler, deleteMosaicHandler, getMosaicsHandler, updateMosaicHandler, } from "./handlers/mosaicHandlers.js";
import { getPlayerStateSnapshot, initializePlayer, playNextInPlayerQueue, playPreviousInPlayerQueue, replacePlayerQueueFromFilePaths, selectPlayerQueueItem, stopPlayer, } from "./services/playerManager.js";
import { ensureElectronPlayablePath, clearAllPreTranscodedFiles, } from "./services/ffmpegPlaybackProxy.js";
import { normalizationQueue } from "./services/normalization/normalizationQueue.js";
import { getStartupReadinessSnapshot, runStartupReadinessChecks, getAnchorContentReadinessSnapshot, getFacetWalkabilityReadinessSnapshot, getCadenceBufferReadinessSnapshot, } from "./services/startupReadinessService.js";
// Allow media autoplay in the in-app player without requiring an extra click.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
import { createStream } from "./services/streamService.js";
import { StreamType } from "./models.js";
import { stopContinuousStream } from "./services/streamManager.js";
import { rebuildBootstrapCoveragePool, isBootstrapRebuildInProgress, } from "./services/bootstrap/bootstrapCoveragePlannerService.js";
import { prewarmBootstrapVariants } from "./services/bootstrap/bootstrapVariantPrewarmService.js";
import { bootstrapPoolRepository } from "./repositories/bootstrapPoolRepository.js";
import { bootstrapLogger } from "./services/bootstrap/bootstrapLogger.js";
let isShuttingDown = false;
async function shutdownApplicationServices() {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    console.log("[Main] Shutting down application services...");
    try {
        // Stop periodic background timers first so no new work is scheduled.
        stopBackgroundService();
        stopContinuousStream();
        await stopPlayer();
    }
    catch (error) {
        console.error("[Main] Error while stopping runtime services:", error);
    }
    try {
        closeDB();
    }
    catch (error) {
        console.error("[Main] Error while closing database:", error);
    }
}
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
    await initializePlayer("electron");
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 728,
        webPreferences: {
            preload: getPreloadPath(),
            // Allow file:// URLs to load from the http://localhost dev server.
            // In production the renderer is served from file:// so this is not needed.
            webSecurity: !isDev(),
        },
    });
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    }
    else {
        mainWindow.loadFile(getUIPath());
    }
    mainWindow.on("close", () => {
        void shutdownApplicationServices();
    });
    // Start background service
    startBackgroundService();
    // Menu.setApplicationMenu(null);
    ipcMainHandle("openFileDialog", async () => {
        return await openFileDialogHandler(mainWindow);
    });
    ipcMainHandle("probeMediaMetadata", async (_event, filePath) => {
        return await probeMediaMetadataHandler(filePath);
    });
    ipcMainHandle("resolveElectronPlayablePath", async (_event, filePath) => {
        const started = Date.now();
        console.log(`[Main][IPC] resolveElectronPlayablePath request: ${filePath}`);
        const resolved = await ensureElectronPlayablePath(filePath);
        console.log(`[Main][IPC] resolveElectronPlayablePath complete (${Date.now() - started}ms): ${filePath} -> ${resolved}`);
        return resolved;
    });
    ipcMainHandle("getPlayerState", async () => {
        return getPlayerStateSnapshot();
    });
    ipcMainHandle("getNormalizationStatus", async () => {
        return normalizationQueue.getStatusSnapshot();
    });
    ipcMainHandle("runStartupReadinessChecks", async () => {
        return runStartupReadinessChecks();
    });
    ipcMainHandle("getAnchorContentReadinessStatus", async () => {
        return getAnchorContentReadinessSnapshot();
    });
    ipcMainHandle("getFacetWalkabilityReadinessStatus", async () => {
        return getFacetWalkabilityReadinessSnapshot();
    });
    ipcMainHandle("getCadenceBufferReadinessStatus", async () => {
        return getCadenceBufferReadinessSnapshot();
    });
    ipcMainHandle("getStartupReadinessStatus", async () => {
        return getStartupReadinessSnapshot();
    });
    ipcMainHandle("replacePlayerQueue", async (_event, filePaths) => {
        return replacePlayerQueueFromFilePaths(filePaths);
    });
    ipcMainHandle("playerSelectQueueItem", async (_event, index) => {
        return selectPlayerQueueItem(index);
    });
    ipcMainHandle("playerPlayPrevious", async () => {
        return playPreviousInPlayerQueue();
    });
    ipcMainHandle("playerPlayNext", async () => {
        return playNextInPlayerQueue();
    });
    ipcMainHandle("startAdhocStream", async (_event, options) => {
        const started = Date.now();
        console.log(`[Main][IPC] startAdhocStream cadence=${options.cadence} themed=${options.themed} durationMinutes=${options.durationMinutes}`);
        stopContinuousStream();
        const durationSec = (options.durationMinutes ?? 120) * 60;
        const endTimepoint = Math.floor(Date.now() / 1000) + durationSec;
        const [mediaBlocks, errorMessage] = await createStream(StreamType.Adhoc, {
            Cadence: !!options.cadence,
            Themed: !!options.themed,
            StreamType: StreamType.Adhoc,
            AdhocStartFromBeginning: true,
        }, endTimepoint);
        if (errorMessage) {
            console.error(`[Main][IPC] startAdhocStream failed (${Date.now() - started}ms): ${errorMessage}`);
            return { status: 500, blockCount: 0, message: errorMessage };
        }
        console.log(`[Main][IPC] startAdhocStream complete (${Date.now() - started}ms) blocks=${mediaBlocks.length}`);
        return {
            status: 200,
            blockCount: mediaBlocks.length,
            message: `Started ${options.cadence ? "cadenced" : "uncadenced"} ${options.themed ? "themed" : "random"} adhoc stream (${options.durationMinutes ?? 120} min)`,
        };
    });
    ipcMainHandle("runAdhocPlayerTest", async (_event, cadence) => {
        const started = Date.now();
        console.log(`[Main][IPC] runAdhocPlayerTest start cadence=${cadence}`);
        stopContinuousStream();
        const endTimepoint = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
        const [mediaBlocks, errorMessage] = await createStream(StreamType.Adhoc, {
            Cadence: !!cadence,
            Themed: false,
            StreamType: StreamType.Adhoc,
            AdhocStartFromBeginning: true,
        }, endTimepoint);
        if (errorMessage) {
            console.error(`[Main][IPC] runAdhocPlayerTest failed (${Date.now() - started}ms): ${errorMessage}`);
            return {
                status: 500,
                blockCount: 0,
                message: errorMessage,
            };
        }
        console.log(`[Main][IPC] runAdhocPlayerTest complete (${Date.now() - started}ms) blocks=${mediaBlocks.length}`);
        return {
            status: 200,
            blockCount: mediaBlocks.length,
            message: `Started ${cadence ? "cadenced" : "uncadenced"} adhoc player test`,
        };
    });
    ipcMainHandle("rebuildBootstrapCoveragePool", async () => {
        const started = Date.now();
        console.log(`[Main][IPC] rebuildBootstrapCoveragePool start`);
        const profiles = [
            "native",
            "plex",
            "jellyfin",
        ];
        const planResult = await rebuildBootstrapCoveragePool({ profiles });
        const prewarmResult = await prewarmBootstrapVariants({
            runId: planResult.runId,
            profiles,
        });
        const readyByProfile = bootstrapPoolRepository.getReadyVariantCountByProfile();
        const snapshot = bootstrapPoolRepository.getLatestCoverageSnapshot();
        console.log(`[Main][IPC] rebuildBootstrapCoveragePool complete (${Date.now() - started}ms) poolItems=${planResult.selectedPoolItems} prewarmQueued=${prewarmResult.queued}`);
        return {
            runId: planResult.runId,
            status: snapshot?.status ?? "completed",
            representedTags: planResult.representedTags,
            coveredTags: planResult.coveredTags,
            missingTags: planResult.missingTags.length,
            selectedPoolItems: planResult.selectedPoolItems,
            readyByProfile,
            lastStartedAt: snapshot?.startedAt ?? null,
            lastCompletedAt: snapshot?.completedAt ?? null,
            lastError: null,
        };
    });
    ipcMainHandle("getBootstrapCoverageStatus", async () => {
        const snapshot = bootstrapPoolRepository.getLatestCoverageSnapshot();
        const readyByProfile = bootstrapPoolRepository.getReadyVariantCountByProfile();
        if (!snapshot) {
            return {
                runId: null,
                status: "idle",
                representedTags: 0,
                coveredTags: 0,
                missingTags: 0,
                selectedPoolItems: 0,
                readyByProfile,
                lastStartedAt: null,
                lastCompletedAt: null,
                lastError: null,
            };
        }
        const status = isBootstrapRebuildInProgress() ? "running" : snapshot.status;
        return {
            runId: snapshot.runId,
            status,
            representedTags: snapshot.representedTagCount,
            coveredTags: snapshot.coveredTagCount,
            missingTags: snapshot.missingTagCount,
            selectedPoolItems: snapshot.selectedItemCount,
            readyByProfile,
            lastStartedAt: snapshot.startedAt,
            lastCompletedAt: snapshot.completedAt,
            lastError: null,
        };
    });
    ipcMainHandle("getBootstrapMissingTags", async () => {
        const snapshot = bootstrapPoolRepository.getLatestCoverageSnapshot();
        if (!snapshot)
            return [];
        // Missing tags are stored in bootstrap_missing_tags; query via repo
        // For now return empty array — detailed missing tag list is a diagnostics
        // feature. The count is already available in getBootstrapCoverageStatus.
        return [];
    });
    ipcMainHandle("getBootstrapProfileReadiness", async () => {
        return bootstrapPoolRepository.getReadyVariantCountByProfile();
    });
    ipcMainHandle("checkStreamStartEligibility", async () => {
        const ENABLE_BOOTSTRAP_SELECTOR = process.env.ENABLE_BOOTSTRAP_SELECTOR === "1";
        // If feature flag is off, always allow stream start
        if (!ENABLE_BOOTSTRAP_SELECTOR) {
            return {
                canStart: true,
                statusMessage: "Ready to start stream",
                readyCount: 0,
                poolSize: 0,
            };
        }
        const readyCounts = bootstrapPoolRepository.getReadyVariantCountByProfile();
        const totalReady = readyCounts.native + readyCounts.plex + readyCounts.jellyfin;
        const poolSize = bootstrapPoolRepository.getPoolSize();
        if (totalReady === 0 && poolSize === 0) {
            return {
                canStart: false,
                statusMessage: "No media available. Please add movies or TV shows to begin.",
                readyCount: 0,
                poolSize: 0,
            };
        }
        if (totalReady === 0 && poolSize > 0) {
            return {
                canStart: false,
                statusMessage: `Transcoding ${poolSize} item${poolSize > 1 ? "s" : ""}. Please wait for at least one to complete.`,
                readyCount: 0,
                poolSize,
            };
        }
        return {
            canStart: true,
            statusMessage: `Ready to start stream (${totalReady} pre-transcoded item${totalReady > 1 ? "s" : ""} available)`,
            readyCount: totalReady,
            poolSize,
        };
    });
    ipcMainHandle("getBootstrapLogPath", async () => {
        return bootstrapLogger.getLogFilePath();
    });
    ipcMainHandle("openBootstrapLog", async () => {
        const logPath = bootstrapLogger.getLogFilePath();
        bootstrapLogger.forceFlush(); // Ensure all logs are written before opening
        await shell.openPath(logPath);
        return { success: true, path: logPath };
    });
    ipcMainHandle("clearAllPreTranscodedCache", async () => {
        // Clear filesystem cache and in-memory cache
        const filesDeleted = clearAllPreTranscodedFiles();
        // Clear database records
        bootstrapPoolRepository.clearAllVariants();
        bootstrapLogger.logSeparator("CACHE CLEARED");
        return {
            success: true,
            filesDeleted,
            message: `Cleared ${filesDeleted} pre-transcoded file(s) and all database variant records`,
        };
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
    ipcMainHandle("getFacets", async () => {
        return getFacetsHandler();
    });
    ipcMainHandle("createFacet", async (_event, genre, aesthetic) => {
        return createFacetHandler(genre, aesthetic);
    });
    ipcMainHandle("deleteFacet", async (_event, facetId) => {
        return deleteFacetHandler(facetId);
    });
    ipcMainHandle("addFacetRelationship", async (_event, request) => {
        return addFacetRelationshipHandler(request);
    });
    ipcMainHandle("deleteFacetRelationship", async (_event, request) => {
        return deleteFacetRelationshipHandler(request);
    });
    ipcMainHandle("getMosaics", async () => {
        return getMosaicsHandler();
    });
    ipcMainHandle("createMosaic", async (_event, mosaic) => {
        return createMosaicHandler(mosaic);
    });
    ipcMainHandle("updateMosaic", async (_event, mosaic) => {
        return updateMosaicHandler(mosaic);
    });
    ipcMainHandle("deleteMosaic", async (_event, mosaicId) => {
        return deleteMosaicHandler(mosaicId);
    });
});
app.on("before-quit", () => {
    void shutdownApplicationServices();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
    else {
        // On macOS, app stays active after windows close by default.
        void shutdownApplicationServices();
    }
});
