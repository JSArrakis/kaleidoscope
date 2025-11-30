import { getDB } from '../db/sqlite';
import {
  RecentlyUsedMedia,
  IRecentlyUsedMedia,
} from '../models/recentlyUsedMedia';

export class RecentlyUsedMediaRepository {
  private get db() {
    return getDB();
  }

  // Get table name for media type
  private getTableName(
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
  ): string {
    switch (mediaType) {
      case 'commercial':
        return 'recently_used_commercials';
      case 'short':
        return 'recently_used_shorts';
      case 'music':
        return 'recently_used_music';
      case 'movie':
        return 'recently_used_movies';
      case 'show':
        return 'recently_used_shows';
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  // Record that a media item was used
  recordUsage(
    mediaItemId: string,
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
    streamSessionId?: string,
    customExpirationDate?: Date,
  ): RecentlyUsedMedia {
    const usedAt = new Date();
    const expiresAt =
      customExpirationDate ||
      RecentlyUsedMedia.getDefaultExpirationDate(usageContext);
    const tableName = this.getTableName(mediaType);

    const stmt = this.db.prepare(`
      INSERT INTO ${tableName} (mediaItemId, usageContext, streamSessionId, usedAt, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      mediaItemId,
      usageContext,
      streamSessionId || null,
      usedAt.toISOString(),
      expiresAt.toISOString(),
    );

    return new RecentlyUsedMedia(
      mediaItemId,
      mediaType,
      usageContext,
      streamSessionId,
      usedAt,
      expiresAt,
      Number(result.lastInsertRowid),
    );
  }

  // Get recently used media IDs for a specific media type and context
  getRecentlyUsedMediaIds(
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
    hoursBack?: number,
  ): string[] {
    const tableName = this.getTableName(mediaType);

    let query = `
      SELECT DISTINCT mediaItemId 
      FROM ${tableName} 
      WHERE (expiresAt IS NULL OR expiresAt > datetime('now'))
    `;

    const params: any[] = [];

    if (usageContext) {
      query += ` AND usageContext = ?`;
      params.push(usageContext);
    }

    if (hoursBack) {
      query += ` AND usedAt > datetime('now', '-${hoursBack} hours')`;
    }

    query += ` ORDER BY usedAt DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as { mediaItemId: string }[];
    return rows.map(row => row.mediaItemId);
  }

  // Get recently used media IDs for buffer context (most common use case)
  getRecentlyUsedBufferMediaIds(
    mediaType: 'commercial' | 'short',
    hoursBack: number = 2,
  ): string[] {
    return this.getRecentlyUsedMediaIds(mediaType, 'buffer', hoursBack);
  }

  // Get media IDs that were used recently but can be reused if needed (fallback option)
  // Excludes only the most recently used item to avoid back-to-back repetition
  getReusableMediaIds(
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
    excludeMostRecent: boolean = true,
  ): string[] {
    const tableName = this.getTableName(mediaType);

    let query = `
      SELECT DISTINCT mediaItemId 
      FROM ${tableName} 
      WHERE (expiresAt IS NULL OR expiresAt > datetime('now'))
    `;

    const params: any[] = [];

    if (usageContext) {
      query += ` AND usageContext = ?`;
      params.push(usageContext);
    }

    query += ` ORDER BY usedAt ASC`; // Oldest first for better variety

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as { mediaItemId: string }[];
    const mediaIds = rows.map(row => row.mediaItemId);

    // Remove the most recently used item to avoid back-to-back repetition
    if (excludeMostRecent && mediaIds.length > 1) {
      // Get the most recently used item
      const recentQuery = `
        SELECT mediaItemId 
        FROM ${tableName} 
        WHERE (expiresAt IS NULL OR expiresAt > datetime('now'))
        ${usageContext ? 'AND usageContext = ?' : ''}
        ORDER BY usedAt DESC 
        LIMIT 1
      `;

      const recentStmt = this.db.prepare(recentQuery);
      const recentResult = recentStmt.get(
        ...(usageContext ? [usageContext] : []),
      ) as { mediaItemId: string } | undefined;

      if (recentResult) {
        const mostRecentId = recentResult.mediaItemId;
        return mediaIds.filter(id => id !== mostRecentId);
      }
    }

    return mediaIds;
  }

  // Get the most recently used media ID (to avoid back-to-back usage)
  getMostRecentlyUsedMediaId(
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
  ): string | null {
    const tableName = this.getTableName(mediaType);

    let query = `
      SELECT mediaItemId 
      FROM ${tableName} 
      WHERE 1=1
    `;

    const params: any[] = [];

    if (usageContext) {
      query += ` AND usageContext = ?`;
      params.push(usageContext);
    }

    query += ` ORDER BY usedAt DESC LIMIT 1`;

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { mediaItemId: string } | undefined;

    return result ? result.mediaItemId : null;
  }

  // Get available media strategy based on variety situation
  // Returns an object indicating what media can be used and the fallback level needed
  getAvailableMediaStrategy(
    availableMediaIds: string[],
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
  ): {
    strategy:
      | 'fresh'
      | 'reusable'
      | 'any_including_recent'
      | 'emergency_repeat';
    availableIds: string[];
    excludedIds: string[];
    mostRecentId: string | null;
  } {
    const recentlyUsedIds = this.getRecentlyUsedMediaIds(
      mediaType,
      usageContext,
    );
    const mostRecentId = this.getMostRecentlyUsedMediaId(
      mediaType,
      usageContext,
    );

    // Strategy 1: Fresh media (not recently used)
    const freshMediaIds = availableMediaIds.filter(
      id => !recentlyUsedIds.includes(id),
    );
    if (freshMediaIds.length > 0) {
      return {
        strategy: 'fresh',
        availableIds: freshMediaIds,
        excludedIds: recentlyUsedIds,
        mostRecentId,
      };
    }

    // Strategy 2: Reusable media (recently used but not the most recent)
    const reusableIds = this.getReusableMediaIds(mediaType, usageContext, true);
    const availableReusableIds = availableMediaIds.filter(id =>
      reusableIds.includes(id),
    );
    if (availableReusableIds.length > 0) {
      return {
        strategy: 'reusable',
        availableIds: availableReusableIds,
        excludedIds: mostRecentId ? [mostRecentId] : [],
        mostRecentId,
      };
    }

    // Strategy 3: Any media including recent (but still avoid most recent if possible)
    const nonMostRecentIds = availableMediaIds.filter(
      id => id !== mostRecentId,
    );
    if (nonMostRecentIds.length > 0) {
      return {
        strategy: 'any_including_recent',
        availableIds: nonMostRecentIds,
        excludedIds: mostRecentId ? [mostRecentId] : [],
        mostRecentId,
      };
    }

    // Strategy 4: Emergency - even allow the most recent (true last resort)
    return {
      strategy: 'emergency_repeat',
      availableIds: availableMediaIds,
      excludedIds: [],
      mostRecentId,
    };
  }

  // Filter available media using the best strategy for variety
  // This is the main method you should use when selecting media
  filterAvailableMedia(
    availableMediaIds: string[],
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext?: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
    allowReuse: boolean = true,
  ): {
    filteredIds: string[];
    strategy: string;
    reason: string;
  } {
    if (availableMediaIds.length === 0) {
      return {
        filteredIds: [],
        strategy: 'none',
        reason: 'No media available',
      };
    }

    const strategy = this.getAvailableMediaStrategy(
      availableMediaIds,
      mediaType,
      usageContext,
    );

    switch (strategy.strategy) {
      case 'fresh':
        return {
          filteredIds: strategy.availableIds,
          strategy: 'fresh',
          reason: `Using ${strategy.availableIds.length} fresh media items (not recently used)`,
        };

      case 'reusable':
        if (allowReuse) {
          return {
            filteredIds: strategy.availableIds,
            strategy: 'reusable',
            reason: `Using ${strategy.availableIds.length} reusable media items (avoiding most recent)`,
          };
        }
      // Fall through to next strategy if reuse not allowed

      case 'any_including_recent':
        if (allowReuse) {
          return {
            filteredIds: strategy.availableIds,
            strategy: 'any_including_recent',
            reason: `Using ${strategy.availableIds.length} media items (avoiding back-to-back only)`,
          };
        }
      // Fall through to emergency if reuse not allowed

      case 'emergency_repeat':
        return {
          filteredIds: strategy.availableIds,
          strategy: 'emergency_repeat',
          reason: `Emergency: Using all ${strategy.availableIds.length} media items (including most recent)`,
        };

      default:
        return {
          filteredIds: [],
          strategy: 'unknown',
          reason: 'Unknown strategy',
        };
    }
  }

  // Record multiple media items as used (batch operation)
  recordBatchUsage(
    mediaItems: Array<{
      mediaItemId: string;
      mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show';
      usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer';
    }>,
    streamSessionId?: string,
  ): void {
    const transaction = this.db.transaction(() => {
      // Group items by media type for efficient batch inserts
      const itemsByType = new Map<string, typeof mediaItems>();

      for (const item of mediaItems) {
        const tableName = this.getTableName(item.mediaType);
        if (!itemsByType.has(tableName)) {
          itemsByType.set(tableName, []);
        }
        itemsByType.get(tableName)!.push(item);
      }

      // Insert items for each media type
      for (const [tableName, items] of Array.from(itemsByType.entries())) {
        const stmt = this.db.prepare(`
          INSERT INTO ${tableName} (mediaItemId, usageContext, streamSessionId, usedAt, expiresAt)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          const usedAt = new Date();
          const expiresAt = RecentlyUsedMedia.getDefaultExpirationDate(
            item.usageContext,
          );

          stmt.run(
            item.mediaItemId,
            item.usageContext,
            streamSessionId || null,
            usedAt.toISOString(),
            expiresAt.toISOString(),
          );
        }
      }
    });

    transaction();
  }

  // Clean up expired usage records across all tables
  cleanupExpiredRecords(): number {
    const tables = [
      'recently_used_commercials',
      'recently_used_shorts',
      'recently_used_music',
      'recently_used_movies',
      'recently_used_shows',
    ];
    let totalChanges = 0;

    const transaction = this.db.transaction(() => {
      for (const tableName of tables) {
        const stmt = this.db.prepare(`
          DELETE FROM ${tableName} 
          WHERE expiresAt IS NOT NULL 
          AND expiresAt <= datetime('now')
        `);

        const result = stmt.run();
        totalChanges += result.changes;
      }
    });

    transaction();
    return totalChanges;
  }

  // Get all recently used media for a stream session across all tables
  getUsageByStreamSession(streamSessionId: string): RecentlyUsedMedia[] {
    const tables = [
      { name: 'recently_used_commercials', type: 'commercial' },
      { name: 'recently_used_shorts', type: 'short' },
      { name: 'recently_used_music', type: 'music' },
      { name: 'recently_used_movies', type: 'movie' },
      { name: 'recently_used_shows', type: 'show' },
    ];

    const allResults: RecentlyUsedMedia[] = [];

    for (const table of tables) {
      const stmt = this.db.prepare(`
        SELECT *, '${table.type}' as mediaType FROM ${table.name} 
        WHERE streamSessionId = ? 
        ORDER BY usedAt DESC
      `);

      const rows = stmt.all(streamSessionId) as any[];
      allResults.push(...rows.map(row => this.mapRowToRecentlyUsedMedia(row)));
    }

    // Sort all results by usedAt desc
    return allResults.sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime());
  }

  // Clear all usage records (for testing/debugging)
  clearAllUsage(): number {
    const tables = [
      'recently_used_commercials',
      'recently_used_shorts',
      'recently_used_music',
      'recently_used_movies',
      'recently_used_shows',
    ];
    let totalChanges = 0;

    const transaction = this.db.transaction(() => {
      for (const tableName of tables) {
        const stmt = this.db.prepare(`DELETE FROM ${tableName}`);
        const result = stmt.run();
        totalChanges += result.changes;
      }
    });

    transaction();
    return totalChanges;
  }

  // Clear usage records for a specific media type and context
  clearUsageByTypeAndContext(
    mediaType: 'commercial' | 'short' | 'music' | 'movie' | 'show',
    usageContext: 'buffer' | 'main_content' | 'promo' | 'initial_buffer',
  ): number {
    const tableName = this.getTableName(mediaType);

    const stmt = this.db.prepare(`
      DELETE FROM ${tableName} 
      WHERE usageContext = ?
    `);

    const result = stmt.run(usageContext);
    return result.changes;
  }

  // Get usage statistics across all tables
  getUsageStats(): {
    totalRecords: number;
    expiredRecords: number;
    recordsByType: Record<string, number>;
    recordsByContext: Record<string, number>;
  } {
    const tables = [
      { name: 'recently_used_commercials', type: 'commercial' },
      { name: 'recently_used_shorts', type: 'short' },
      { name: 'recently_used_music', type: 'music' },
      { name: 'recently_used_movies', type: 'movie' },
      { name: 'recently_used_shows', type: 'show' },
    ];

    let totalRecords = 0;
    let expiredRecords = 0;
    const recordsByType: Record<string, number> = {};
    const recordsByContext: Record<string, number> = {};

    for (const table of tables) {
      // Count total records
      const totalStmt = this.db.prepare(
        `SELECT COUNT(*) as count FROM ${table.name}`,
      );
      const totalResult = totalStmt.get() as { count: number };
      const tableCount = totalResult.count;

      totalRecords += tableCount;
      recordsByType[table.type] = tableCount;

      // Count expired records
      const expiredStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM ${table.name} 
        WHERE expiresAt IS NOT NULL AND expiresAt <= datetime('now')
      `);
      const expiredResult = expiredStmt.get() as { count: number };
      expiredRecords += expiredResult.count;

      // Count by context
      const contextStmt = this.db.prepare(`
        SELECT usageContext, COUNT(*) as count 
        FROM ${table.name} 
        GROUP BY usageContext
      `);
      const contextResults = contextStmt.all() as Array<{
        usageContext: string;
        count: number;
      }>;

      for (const result of contextResults) {
        recordsByContext[result.usageContext] =
          (recordsByContext[result.usageContext] || 0) + result.count;
      }
    }

    return {
      totalRecords,
      expiredRecords,
      recordsByType,
      recordsByContext,
    };
  }

  private mapRowToRecentlyUsedMedia(row: any): RecentlyUsedMedia {
    return new RecentlyUsedMedia(
      row.mediaItemId,
      row.mediaType,
      row.usageContext,
      row.streamSessionId,
      new Date(row.usedAt),
      row.expiresAt ? new Date(row.expiresAt) : undefined,
      row.id,
    );
  }
}

export const recentlyUsedMediaRepository = new RecentlyUsedMediaRepository();
