import { Request, Response } from 'express';
import { getDB } from '../db/sqlite';
import { movieRepository } from '../repositories/movieRepository';
import { showRepository } from '../repositories/showRepository';
import { commercialRepository } from '../repositories/commercialRepository';
import { promoRepository } from '../repositories/promoRepository';
import { musicRepository } from '../repositories/musicRepository';
import { shortRepository } from '../repositories/shortRepository';
import { collectionRepository } from '../repositories/collectionRepository';
import { tagRepository } from '../repositories/tagsRepository';
// Note: mosaicRepository is empty, skip for now
// import { mosaicRepository } from '../repositories/mosaicRepository';
import { bumperRepository } from '../repositories/bumperRepository';
import * as medServ from '../services/mediaService';
import * as conf from '../config/configService';
import * as streamMan from '../services/streamManager';
import * as backgroundSrv from '../services/backgroundService';
import moment from 'moment';

export async function systemStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
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
    const db = getDB();
    // Simple test query
    const result = db.prepare('SELECT 1 as test').get();
    return {
      connected: true,
      test_query: result ? 'SUCCESS' : 'FAILED',
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      test_query: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testRepositories() {
  const repos = {
    movies: await testRepository('movies', () => movieRepository.findAll()),
    shows: await testRepository('shows', () => showRepository.findAll()),
    commercials: await testRepository('commercials', () =>
      commercialRepository.findAll(),
    ),
    promos: await testRepository('promos', () => promoRepository.findAll()),
    music: await testRepository('music', () => musicRepository.findAll()),
    shorts: await testRepository('shorts', () => shortRepository.findAll()),
    collections: await testRepository('collections', () =>
      collectionRepository.findAll(),
    ),
    tags: await testRepository('tags', () => tagRepository.findAll()),
    // mosaics: await testRepository('mosaics', () => mosaicRepository.findAll()),
    bumpers: await testRepository('bumpers', () => bumperRepository.findAll()),
  };

  return repos;
}

async function testRepository(name: string, findAllFn: () => any[]) {
  try {
    const items = findAllFn();
    return {
      status: 'SUCCESS',
      count: Array.isArray(items) ? items.length : 0,
      error: null,
    };
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    return {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testTables() {
  try {
    const db = getDB();

    // Get list of all tables
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `,
      )
      .all() as { name: string }[];

    const tableInfo: Record<string, any> = {};

    for (const table of tables) {
      try {
        // Get row count for each table
        const countResult = db
          .prepare(`SELECT COUNT(*) as count FROM ${table.name}`)
          .get() as { count: number };

        // Get table schema
        const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();

        tableInfo[table.name] = {
          exists: true,
          row_count: countResult.count,
          columns: schema.length,
          schema: schema.map((col: any) => ({
            name: col.name,
            type: col.type,
            nullable: !col.notnull,
            pk: !!col.pk,
          })),
        };
      } catch (error) {
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
  } catch (error) {
    return {
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function quickHealthHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const db = getDB();
    const testResult = db.prepare('SELECT 1 as test').get();

    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function testCreateTagHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { Tag } = await import('../models/tag');

    // Create a simple test tag
    const testTag = new Tag('test-action', 'Test Action', 'Genre');

    const result = tagRepository.create(testTag);

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Test tag created successfully',
      tag: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function resetDatabaseHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Get the database path (same logic as in sqlite.ts)
    const appDataPath = process.env.APPDATA || process.env.HOME || './';
    const appDir = path.join(appDataPath, 'Kaleidoscope');
    const dbPath = path.join(appDir, 'kaleidoscope.db');

    // Close existing database connection first
    const { closeSQLite } = await import('../db/sqlite');
    closeSQLite();

    // Delete the database file if it exists
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log(`Database deleted: ${dbPath}`);
    }

    // Reconnect to create fresh database with current schema
    const { connectToSQLite } = await import('../db/sqlite');
    await connectToSQLite();

    res.status(200).json({
      status: 'SUCCESS',
      message: 'Database reset successfully',
      database_path: dbPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
export async function streamingStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const currentTime = moment().unix();
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
            title: item.mainBlock?.title || 'Unknown',
            startTime: item.startTime,
            startsIn: item.startTime ? item.startTime - currentTime : null,
            duration: item.mainBlock?.duration || 0,
            bufferCount: item.buffer.length,
            initialBufferCount: item.initialBuffer.length,
          })),
        },
        upcoming: {
          count: upcomingStream.length,
          nextFew: upcomingStream.slice(0, 5).map(item => ({
            title: item.mainBlock?.title || 'Unknown',
            startTime: item.startTime,
            startsIn: item.startTime ? item.startTime - currentTime : null,
            duration: item.mainBlock?.duration || 0,
          })),
        },
      },
      streamArgs: streamMan.getContinuousStreamArgs() || null,
      media: {
        loaded: !!medServ.getMedia(),
        holidays: {
          total: medServ.getHolidays().length,
          current: medServ.getCurrentHolidays().length,
          currentList: medServ.getCurrentHolidays().map(h => ({
            name: h.name,
            holidayDates: h.holidayDates,
            seasonStart: h.seasonStartDate,
            seasonEnd: h.seasonEndDate,
          })),
        },
      },
      vlc: backgroundSrv.getVLCStatus(),
    };

    res.status(200).json(status);
  } catch (error) {
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
export async function currentMediaHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const currentTime = moment().unix();
    const onDeckStream = streamMan.getOnDeckStream();

    let currentItem = null;
    let nextItem = null;

    if (onDeckStream.length > 0) {
      const firstItem = onDeckStream[0];
      if (firstItem.startTime && currentTime >= firstItem.startTime) {
        currentItem = {
          title: firstItem.mainBlock?.title || 'Unknown',
          path: firstItem.mainBlock?.path || 'Unknown',
          startTime: firstItem.startTime,
          duration: firstItem.mainBlock?.duration || 0,
          elapsedTime: currentTime - firstItem.startTime,
          remainingTime:
            (firstItem.mainBlock?.duration || 0) -
            (currentTime - firstItem.startTime),
        };
      }
    }

    if (onDeckStream.length > 1) {
      const secondItem = onDeckStream[1];
      nextItem = {
        title: secondItem.mainBlock?.title || 'Unknown',
        path: secondItem.mainBlock?.path || 'Unknown',
        startTime: secondItem.startTime,
        duration: secondItem.mainBlock?.duration || 0,
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
  } catch (error) {
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
export async function streamQueueHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const currentTime = moment().unix();
    const onDeckStream = streamMan.getOnDeckStream();
    const upcomingStream = streamMan.getUpcomingStream();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      currentUnixTime: currentTime,
      onDeck: onDeckStream.map((item, index) => ({
        position: index,
        title: item.mainBlock?.title || 'Unknown',
        mediaType: item.mainBlock?.constructor.name || 'Unknown',
        startTime: item.startTime,
        startsIn: item.startTime ? item.startTime - currentTime : null,
        duration: item.mainBlock?.duration || 0,
        path: item.mainBlock?.path || 'Unknown',
        buffer: {
          pre: item.initialBuffer.length,
          post: item.buffer.length,
        },
      })),
      upcoming: upcomingStream.slice(0, 10).map((item, index) => ({
        position: index,
        title: item.mainBlock?.title || 'Unknown',
        mediaType: item.mainBlock?.constructor.name || 'Unknown',
        startTime: item.startTime,
        startsIn: item.startTime ? item.startTime - currentTime : null,
        duration: item.mainBlock?.duration || 0,
      })),
      totals: {
        onDeckCount: onDeckStream.length,
        upcomingCount: upcomingStream.length,
      },
    });
  } catch (error) {
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
export async function vlcStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vlcStatus = backgroundSrv.getVLCStatus();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      vlc: vlcStatus,
    });
  } catch (error) {
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
export async function timingStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const currentTime = moment().unix();
    const currentMoment = moment();

    // Calculate next 5-minute interval (same logic as cycleCheck)
    const intervalInSeconds = 300;
    const secondsToNextInterval =
      intervalInSeconds - (currentTime % intervalInSeconds);
    const nextIntervalTime = currentTime + secondsToNextInterval;

    // Calculate end of day and tomorrow markers
    const endOfDay = moment().set({ hour: 23, minute: 30, second: 0 }).unix();
    const tomorrow = moment()
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
          dateTime: moment.unix(nextIntervalTime).format(),
          secondsUntil: secondsToNextInterval,
        },
        endOfDay: {
          unixTime: endOfDay,
          dateTime: moment.unix(endOfDay).format(),
          secondsUntil: endOfDay - currentTime,
        },
        tomorrow: {
          unixTime: tomorrow,
          dateTime: moment.unix(tomorrow).format(),
          secondsUntil: tomorrow - currentTime,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
