"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemStatusHandler = systemStatusHandler;
exports.quickHealthHandler = quickHealthHandler;
exports.testCreateTagHandler = testCreateTagHandler;
exports.resetDatabaseHandler = resetDatabaseHandler;
exports.streamingStatusHandler = streamingStatusHandler;
exports.currentMediaHandler = currentMediaHandler;
exports.streamQueueHandler = streamQueueHandler;
exports.vlcStatusHandler = vlcStatusHandler;
exports.timingStatusHandler = timingStatusHandler;
const sqlite_1 = require("../db/sqlite");
const movieRepository_1 = require("../repositories/movieRepository");
const showRepository_1 = require("../repositories/showRepository");
const commercialRepository_1 = require("../repositories/commercialRepository");
const promoRepository_1 = require("../repositories/promoRepository");
const musicRepository_1 = require("../repositories/musicRepository");
const shortRepository_1 = require("../repositories/shortRepository");
const collectionRepository_1 = require("../repositories/collectionRepository");
const tagsRepository_1 = require("../repositories/tagsRepository");
// Note: mosaicRepository is empty, skip for now
// import { mosaicRepository } from '../repositories/mosaicRepository';
const bumperRepository_1 = require("../repositories/bumperRepository");
const tagTypes_1 = require("../models/const/tagTypes");
const medServ = __importStar(require("../services/mediaService"));
const holidayService_1 = require("../services/holidayService");
const conf = __importStar(require("../config/configService"));
const streamMan = __importStar(require("../services/streamManager"));
const vlcService = __importStar(require("../services/vlcService"));
const moment_1 = __importDefault(require("moment"));
async function systemStatusHandler(req, res) {
    const status = {
        timestamp: new Date().toISOString(),
        database: await testDatabaseConnection(),
        repositories: await testRepositories(),
        services: await testServices(),
        config: testConfiguration(),
        tables: await testTables(),
    };
    res.status(200).json(status);
}
async function testDatabaseConnection() {
    try {
        const db = (0, sqlite_1.getDB)();
        // Simple test query
        const result = db.prepare('SELECT 1 as test').get();
        return {
            connected: true,
            test_query: result ? 'SUCCESS' : 'FAILED',
            error: null,
        };
    }
    catch (error) {
        return {
            connected: false,
            test_query: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function testRepositories() {
    const repos = {
        movies: await testRepository('movies', () => movieRepository_1.movieRepository.findAll()),
        shows: await testRepository('shows', () => showRepository_1.showRepository.findAll()),
        commercials: await testRepository('commercials', () => commercialRepository_1.commercialRepository.findAll()),
        promos: await testRepository('promos', () => promoRepository_1.promoRepository.findAll()),
        music: await testRepository('music', () => musicRepository_1.musicRepository.findAll()),
        shorts: await testRepository('shorts', () => shortRepository_1.shortRepository.findAll()),
        collections: await testRepository('collections', () => collectionRepository_1.collectionRepository.findAll()),
        tags: await testRepository('tags', () => tagsRepository_1.tagRepository.findAll()),
        // mosaics: await testRepository('mosaics', () => mosaicRepository.findAll()),
        bumpers: await testRepository('bumpers', () => bumperRepository_1.bumperRepository.findAll()),
    };
    return repos;
}
async function testRepository(name, findAllFn) {
    try {
        const items = findAllFn();
        return {
            status: 'SUCCESS',
            count: Array.isArray(items) ? items.length : 0,
            error: null,
        };
    }
    catch (error) {
        return {
            status: 'FAILED',
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function testServices() {
    try {
        const streamType = medServ.getStreamType();
        const args = medServ.getArgs();
        return {
            media_service: {
                status: 'SUCCESS',
                stream_type: streamType || 'not_set',
                has_args: !!args,
            },
        };
    }
    catch (error) {
        return {
            media_service: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
function testConfiguration() {
    try {
        const config = conf.getConfig();
        return {
            status: 'SUCCESS',
            has_config: !!config,
            data_folder: config?.dataFolder || 'not_set',
            interval: config?.interval || 'not_set',
        };
    }
    catch (error) {
        return {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function testTables() {
    try {
        const db = (0, sqlite_1.getDB)();
        // Get list of all tables
        const tables = db
            .prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
            .all();
        const tableInfo = {};
        for (const table of tables) {
            try {
                // Get row count for each table
                const countResult = db
                    .prepare(`SELECT COUNT(*) as count FROM ${table.name}`)
                    .get();
                // Get table schema
                const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
                tableInfo[table.name] = {
                    exists: true,
                    row_count: countResult.count,
                    columns: schema.length,
                    schema: schema.map((col) => ({
                        name: col.name,
                        type: col.type,
                        nullable: !col.notnull,
                        pk: !!col.pk,
                    })),
                };
            }
            catch (error) {
                tableInfo[table.name] = {
                    exists: true,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        }
        return {
            status: 'SUCCESS',
            table_count: tables.length,
            tables: tableInfo,
        };
    }
    catch (error) {
        return {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function quickHealthHandler(req, res) {
    try {
        const db = (0, sqlite_1.getDB)();
        const testResult = db.prepare('SELECT 1 as test').get();
        res.status(200).json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
async function testCreateTagHandler(req, res) {
    try {
        const { Tag } = await Promise.resolve().then(() => __importStar(require('../models/tag')));
        // Create a simple test tag
        const testTag = new Tag('test-action', 'Test Action', tagTypes_1.TagType.Genre);
        const result = tagsRepository_1.tagRepository.create(testTag);
        res.status(200).json({
            status: 'SUCCESS',
            message: 'Test tag created successfully',
            tag: result,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            timestamp: new Date().toISOString(),
        });
    }
}
async function resetDatabaseHandler(req, res) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        // Get the database path (same logic as in sqlite.ts)
        const appDataPath = process.env.APPDATA || process.env.HOME || './';
        const appDir = path.join(appDataPath, 'Kaleidoscope');
        const dbPath = path.join(appDir, 'kaleidoscope.db');
        // Close existing database connection first
        const { closeSQLite } = await Promise.resolve().then(() => __importStar(require('../db/sqlite')));
        closeSQLite();
        // Delete the database file if it exists
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log(`Database deleted: ${dbPath}`);
        }
        // Reconnect to create fresh database with current schema
        const { connectToSQLite } = await Promise.resolve().then(() => __importStar(require('../db/sqlite')));
        await connectToSQLite();
        res.status(200).json({
            status: 'SUCCESS',
            message: 'Database reset successfully',
            database_path: dbPath,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            timestamp: new Date().toISOString(),
        });
    }
}
// =============================================================================
// STREAMING SERVICE STATUS ENDPOINTS
// =============================================================================
/**
 * Get comprehensive streaming service status including buffers, timing, and VLC state
 */
async function streamingStatusHandler(req, res) {
    try {
        const currentTime = (0, moment_1.default)().unix();
        const onDeckStream = streamMan.getOnDeckStream();
        const upcomingStream = streamMan.getUpcomingStream();
        const status = {
            timestamp: new Date().toISOString(),
            currentUnixTime: currentTime,
            streamType: medServ.getStreamType(),
            isContinuous: streamMan.isContinuousStream(),
            buffers: {
                onDeck: {
                    count: onDeckStream.length,
                    items: onDeckStream.map(item => ({
                        title: item.featureMedia?.title || 'Unknown',
                        startTime: item.startTime,
                        startsIn: item.startTime ? item.startTime - currentTime : null,
                        duration: item.featureMedia?.duration || 0,
                        bufferCount: item.buffer.length,
                        initialBufferCount: 0, // MediaBlock doesn't have initialBuffer property
                    })),
                },
                upcoming: {
                    count: upcomingStream.length,
                    nextFew: upcomingStream.slice(0, 5).map(item => ({
                        title: item.featureMedia?.title || 'Unknown',
                        startTime: item.startTime,
                        startsIn: item.startTime ? item.startTime - currentTime : null,
                        duration: item.featureMedia?.duration || 0,
                    })),
                },
            },
            streamArgs: streamMan.getContinuousStreamArgs() || null,
            media: {
                loaded: !!medServ.getMedia(),
                holidays: {
                    total: (0, holidayService_1.getAllHolidays)().length,
                    current: (0, holidayService_1.getCurrentHolidays)().length,
                    currentList: (0, holidayService_1.getCurrentHolidays)().map(h => ({
                        name: h.name,
                        holidayDates: h.holidayDates,
                        seasonStart: h.seasonStartDate,
                        seasonEnd: h.seasonEndDate,
                    })),
                },
            },
            vlc: vlcService.getVLCStatus(),
        };
        res.status(200).json(status);
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Get current playing media and next items
 */
async function currentMediaHandler(req, res) {
    try {
        const currentTime = (0, moment_1.default)().unix();
        const onDeckStream = streamMan.getOnDeckStream();
        let currentItem = null;
        let nextItem = null;
        if (onDeckStream.length > 0) {
            const firstItem = onDeckStream[0];
            if (firstItem.startTime && currentTime >= firstItem.startTime) {
                currentItem = {
                    title: firstItem.featureMedia?.title || 'Unknown',
                    path: firstItem.featureMedia?.path || 'Unknown',
                    startTime: firstItem.startTime,
                    duration: firstItem.featureMedia?.duration || 0,
                    elapsedTime: currentTime - firstItem.startTime,
                    remainingTime: (firstItem.featureMedia?.duration || 0) -
                        (currentTime - firstItem.startTime),
                };
            }
        }
        if (onDeckStream.length > 1) {
            const secondItem = onDeckStream[1];
            nextItem = {
                title: secondItem.featureMedia?.title || 'Unknown',
                path: secondItem.featureMedia?.path || 'Unknown',
                startTime: secondItem.startTime,
                duration: secondItem.featureMedia?.duration || 0,
                startsIn: secondItem.startTime
                    ? secondItem.startTime - currentTime
                    : null,
            };
        }
        res.status(200).json({
            timestamp: new Date().toISOString(),
            currentUnixTime: currentTime,
            currentItem,
            nextItem,
            onDeckCount: onDeckStream.length,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Get stream queue and buffer details
 */
async function streamQueueHandler(req, res) {
    try {
        const currentTime = (0, moment_1.default)().unix();
        const onDeckStream = streamMan.getOnDeckStream();
        const upcomingStream = streamMan.getUpcomingStream();
        res.status(200).json({
            timestamp: new Date().toISOString(),
            currentUnixTime: currentTime,
            onDeck: onDeckStream.map((item, index) => ({
                position: index,
                title: item.featureMedia?.title || 'Unknown',
                mediaType: item.featureMedia?.constructor.name || 'Unknown',
                startTime: item.startTime,
                startsIn: item.startTime ? item.startTime - currentTime : null,
                duration: item.featureMedia?.duration || 0,
                path: item.featureMedia?.path || 'Unknown',
                buffer: {
                    pre: 0, // MediaBlock doesn't have initialBuffer property
                    post: item.buffer.length,
                },
            })),
            upcoming: upcomingStream.slice(0, 10).map((item, index) => ({
                position: index,
                title: item.featureMedia?.title || 'Unknown',
                mediaType: item.featureMedia?.constructor.name || 'Unknown',
                startTime: item.startTime,
                startsIn: item.startTime ? item.startTime - currentTime : null,
                duration: item.featureMedia?.duration || 0,
            })),
            totals: {
                onDeckCount: onDeckStream.length,
                upcomingCount: upcomingStream.length,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Get VLC player status and connection information
 */
async function vlcStatusHandler(req, res) {
    try {
        const vlcStatus = vlcService.getVLCStatus();
        res.status(200).json({
            timestamp: new Date().toISOString(),
            vlc: vlcStatus,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Get timing and schedule information
 */
async function timingStatusHandler(req, res) {
    try {
        const currentTime = (0, moment_1.default)().unix();
        const currentMoment = (0, moment_1.default)();
        // Calculate next 5-minute interval (same logic as cycleCheck)
        const intervalInSeconds = 300;
        const secondsToNextInterval = intervalInSeconds - (currentTime % intervalInSeconds);
        const nextIntervalTime = currentTime + secondsToNextInterval;
        // Calculate end of day and tomorrow markers
        const endOfDay = (0, moment_1.default)().set({ hour: 23, minute: 30, second: 0 }).unix();
        const tomorrow = (0, moment_1.default)()
            .add(1, 'days')
            .set({ hour: 0, minute: 0, second: 0 })
            .unix();
        res.status(200).json({
            timestamp: new Date().toISOString(),
            timing: {
                currentUnixTime: currentTime,
                currentDateTime: currentMoment.format(),
                nextCycleCheck: {
                    unixTime: nextIntervalTime,
                    dateTime: moment_1.default.unix(nextIntervalTime).format(),
                    secondsUntil: secondsToNextInterval,
                },
                endOfDay: {
                    unixTime: endOfDay,
                    dateTime: moment_1.default.unix(endOfDay).format(),
                    secondsUntil: endOfDay - currentTime,
                },
                tomorrow: {
                    unixTime: tomorrow,
                    dateTime: moment_1.default.unix(tomorrow).format(),
                    secondsUntil: tomorrow - currentTime,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
}
