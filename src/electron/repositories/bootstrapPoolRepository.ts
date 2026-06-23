import { randomUUID } from "crypto";
import { getDB } from "../db/sqlite.js";

export type BootstrapProfile = "native" | "plex" | "jellyfin";
export type BootstrapTagType = "Genre" | "Aesthetic";
export type BootstrapMissingReason =
  | "no_anchor_association"
  | "no_ready_variant"
  | "excluded";
export type BootstrapRunStatus = "running" | "completed" | "failed";

// ── Row shapes ────────────────────────────────────────────────────────────────

interface PoolItemRow {
  poolItemId: string;
  mediaItemId: string;
  mediaType: string;
  lastUsedAt: number | null;
}

interface VariantRow {
  poolItemId: string;
  profile: string;
  playablePath: string;
  isReady: number;
  isStale: number;
  lastUsedAt: number | null;
}

interface CoverageRunRow {
  runId: string;
  representedTagCount: number;
  coveredTagCount: number;
  missingTagCount: number;
  selectedItemCount: number;
  queuedVariantJobs: number;
  status: string;
  startedAt: number;
  completedAt: number | null;
}

interface RepresentedTagRow {
  tagId: string;
  type: string;
}

interface EligibleAnchorRow {
  mediaItemId: string;
  mediaType: string;
  path: string;
  duration: number | null;
  durationLimit: number | null;
  tagId: string | null;
  tagType: string | null;
}

// ── Repository ────────────────────────────────────────────────────────────────

export class BootstrapPoolRepository {
  private get db() {
    return getDB();
  }

  // ── Coverage run lifecycle ─────────────────────────────────────────────────

  beginCoverageRun(): { runId: string; startedAt: number } {
    const runId = randomUUID();
    const startedAt = Math.floor(Date.now() / 1000);
    this.db
      .prepare(
        `INSERT INTO bootstrap_coverage_runs
         (runId, startedAt, status)
         VALUES (?, ?, 'running')`,
      )
      .run(runId, startedAt);
    return { runId, startedAt };
  }

  completeCoverageRun(input: {
    runId: string;
    completedAt: number;
    durationMs: number;
    representedTagCount: number;
    coveredTagCount: number;
    missingTagCount: number;
    selectedItemCount: number;
    queuedVariantJobs: number;
  }): void {
    this.db
      .prepare(
        `UPDATE bootstrap_coverage_runs
         SET completedAt = ?, durationMs = ?,
             representedTagCount = ?, coveredTagCount = ?,
             missingTagCount = ?, selectedItemCount = ?,
             queuedVariantJobs = ?, status = 'completed'
         WHERE runId = ?`,
      )
      .run(
        input.completedAt,
        input.durationMs,
        input.representedTagCount,
        input.coveredTagCount,
        input.missingTagCount,
        input.selectedItemCount,
        input.queuedVariantJobs,
        input.runId,
      );
  }

  failCoverageRun(runId: string, errorMessage: string): void {
    this.db
      .prepare(
        `UPDATE bootstrap_coverage_runs
         SET status = 'failed', errorMessage = ?, completedAt = ?
         WHERE runId = ?`,
      )
      .run(errorMessage, Math.floor(Date.now() / 1000), runId);
  }

  // ── Pool management ────────────────────────────────────────────────────────

  clearPool(): void {
    this.db.prepare(`DELETE FROM bootstrap_pool_items`).run();
  }

  upsertPoolItem(input: {
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
  }): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO bootstrap_pool_items (poolItemId, mediaItemId, mediaType, updatedAt)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(mediaItemId, mediaType) DO UPDATE SET
           updatedAt = excluded.updatedAt`,
      )
      .run(input.poolItemId, input.mediaItemId, input.mediaType, now);
  }

  replacePoolItemTags(
    poolItemId: string,
    tags: Array<{ tagId: string; tagType: BootstrapTagType }>,
  ): void {
    this.db
      .prepare(`DELETE FROM bootstrap_pool_item_tags WHERE poolItemId = ?`)
      .run(poolItemId);

    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO bootstrap_pool_item_tags (poolItemId, tagId, tagType)
       VALUES (?, ?, ?)`,
    );
    const insertMany = this.db.transaction(
      (items: Array<{ tagId: string; tagType: string }>) => {
        for (const item of items) {
          insert.run(poolItemId, item.tagId, item.tagType);
        }
      },
    );
    insertMany(tags);
  }

  upsertProfileVariant(input: {
    poolItemId: string;
    profile: BootstrapProfile;
    playablePath: string;
    cacheKey?: string | null;
    isReady: boolean;
    isStale: boolean;
    lastPreparedAt?: number | null;
    lastValidationAt?: number | null;
    lastError?: string | null;
  }): void {
    const variantId = randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO bootstrap_profile_variants
           (variantId, poolItemId, profile, playablePath, cacheKey,
            isReady, isStale, lastPreparedAt, lastValidationAt, lastError, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(poolItemId, profile) DO UPDATE SET
           playablePath     = excluded.playablePath,
           cacheKey         = excluded.cacheKey,
           isReady          = excluded.isReady,
           isStale          = excluded.isStale,
           lastPreparedAt   = excluded.lastPreparedAt,
           lastValidationAt = excluded.lastValidationAt,
           lastError        = excluded.lastError,
           updatedAt        = excluded.updatedAt`,
      )
      .run(
        variantId,
        input.poolItemId,
        input.profile,
        input.playablePath,
        input.cacheKey ?? null,
        input.isReady ? 1 : 0,
        input.isStale ? 1 : 0,
        input.lastPreparedAt ?? null,
        input.lastValidationAt ?? null,
        input.lastError ?? null,
        now,
      );
  }

  setLastUsedAt(poolItemId: string, unixSeconds: number): void {
    this.db
      .prepare(
        `UPDATE bootstrap_pool_items SET lastUsedAt = ?, updatedAt = ? WHERE poolItemId = ?`,
      )
      .run(unixSeconds, new Date().toISOString(), poolItemId);
  }

  replaceMissingTags(
    runId: string,
    missing: Array<{
      tagId: string;
      tagType: BootstrapTagType;
      reason: BootstrapMissingReason;
    }>,
  ): void {
    this.db
      .prepare(`DELETE FROM bootstrap_missing_tags WHERE runId = ?`)
      .run(runId);

    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO bootstrap_missing_tags (runId, tagId, tagType, reason)
       VALUES (?, ?, ?, ?)`,
    );
    const insertMany = this.db.transaction(
      (
        items: Array<{
          tagId: string;
          tagType: string;
          reason: string;
        }>,
      ) => {
        for (const item of items) {
          insert.run(runId, item.tagId, item.tagType, item.reason);
        }
      },
    );
    insertMany(missing);
  }

  // ── Query: represented tags ────────────────────────────────────────────────

  findRepresentedTags(): Array<{
    tagId: string;
    tagType: BootstrapTagType;
  }> {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT t.tagId, t.type
         FROM tags t
         WHERE t.type IN ('Genre', 'Aesthetic')
           AND (
             EXISTS (
               SELECT 1 FROM movie_tags mt
               JOIN movies m ON m.mediaItemId = mt.mediaItemId
               WHERE mt.tagId = t.tagId
             )
             OR EXISTS (
               SELECT 1 FROM episode_tags et
               JOIN episodes e ON e.mediaItemId = et.mediaItemId
               WHERE et.tagId = t.tagId
             )
           )
         ORDER BY t.type, t.tagId`,
      )
      .all() as RepresentedTagRow[];

    return rows.map((r) => ({
      tagId: r.tagId,
      tagType: r.type as BootstrapTagType,
    }));
  }

  // ── Query: eligible anchors ────────────────────────────────────────────────

  findRandomEligibleAnchorByTag(input: {
    tagId: string;
    excludedMediaItemIds: string[];
  }): {
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    tags: Array<{ tagId: string; type: string }>;
    path: string;
    duration: number;
    durationLimit: number;
  } | null {
    const placeholders =
      input.excludedMediaItemIds.length > 0
        ? `AND candidates.mediaItemId NOT IN (${input.excludedMediaItemIds.map(() => "?").join(",")})`
        : "";

    const row = this.db
      .prepare(
        `SELECT candidates.mediaItemId, candidates.mediaType,
                candidates.path, candidates.duration, candidates.durationLimit
         FROM (
           SELECT m.mediaItemId, 'Movie' AS mediaType,
                  m.path, m.duration, m.duration AS durationLimit
           FROM movies m
           JOIN movie_tags mt ON mt.mediaItemId = m.mediaItemId
           WHERE mt.tagId = ?
             ${placeholders}
           UNION ALL
           SELECT e.mediaItemId, 'Episode' AS mediaType,
                  e.path, e.duration, e.durationLimit
           FROM episodes e
           JOIN episode_tags et ON et.mediaItemId = e.mediaItemId
           WHERE et.tagId = ?
             ${placeholders}
         ) AS candidates
         ORDER BY RANDOM()
         LIMIT 1`,
      )
      .get(
        input.tagId,
        ...input.excludedMediaItemIds,
        input.tagId,
        ...input.excludedMediaItemIds,
      ) as EligibleAnchorRow | undefined;

    if (!row) {
      return null;
    }

    // Load all genre/aesthetic tags for this media item so we can mark
    // multiple covered tags from a single selection
    const tagRows = this.db
      .prepare(
        row.mediaType === "Movie"
          ? `SELECT tagId, tagType AS type FROM movie_tags WHERE mediaItemId = ?`
          : `SELECT tagId, 'Genre' AS type FROM episode_tags WHERE mediaItemId = ?`,
      )
      .all(row.mediaItemId) as Array<{ tagId: string; type: string }>;

    return {
      mediaItemId: row.mediaItemId,
      mediaType: row.mediaType as "Movie" | "Episode",
      tags: tagRows,
      path: row.path,
      duration: row.duration ?? 0,
      durationLimit: row.durationLimit ?? row.duration ?? 0,
    };
  }

  // ── Query: startup candidates ──────────────────────────────────────────────

  findStartupCandidates(input: {
    profile: BootstrapProfile;
    cooldownSeconds: number;
    now: number;
  }): Array<{
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    playablePath: string;
    lastUsedAt: number | null;
  }> {
    const cooldownCutoff = input.now - input.cooldownSeconds;

    const rows = this.db
      .prepare(
        `SELECT bpi.poolItemId, bpi.mediaItemId, bpi.mediaType,
                bpv.playablePath, bpi.lastUsedAt
         FROM bootstrap_pool_items bpi
         JOIN bootstrap_profile_variants bpv
           ON bpv.poolItemId = bpi.poolItemId
          AND bpv.profile = ?
          AND bpv.isReady = 1
          AND bpv.isStale = 0
         WHERE (bpi.lastUsedAt IS NULL OR bpi.lastUsedAt < ?)
         ORDER BY RANDOM()`,
      )
      .all(input.profile, cooldownCutoff) as Array<{
      poolItemId: string;
      mediaItemId: string;
      mediaType: string;
      playablePath: string;
      lastUsedAt: number | null;
    }>;

    return rows.map((r) => ({
      poolItemId: r.poolItemId,
      mediaItemId: r.mediaItemId,
      mediaType: r.mediaType as "Movie" | "Episode",
      playablePath: r.playablePath,
      lastUsedAt: r.lastUsedAt,
    }));
  }

  // ── Query: least recently used fallback ───────────────────────────────────

  findLeastRecentlyUsedCandidate(profile: BootstrapProfile): {
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    playablePath: string;
    lastUsedAt: number | null;
  } | null {
    const row = this.db
      .prepare(
        `SELECT bpi.poolItemId, bpi.mediaItemId, bpi.mediaType,
                bpv.playablePath, bpi.lastUsedAt
         FROM bootstrap_pool_items bpi
         JOIN bootstrap_profile_variants bpv
           ON bpv.poolItemId = bpi.poolItemId
          AND bpv.profile = ?
          AND bpv.isReady = 1
          AND bpv.isStale = 0
         ORDER BY bpi.lastUsedAt ASC NULLS FIRST
         LIMIT 1`,
      )
      .get(profile) as VariantRow | undefined;

    if (!row) {
      return null;
    }

    return {
      poolItemId: row.poolItemId,
      mediaItemId: row.poolItemId,
      mediaType: "Movie",
      playablePath: row.playablePath,
      lastUsedAt: row.lastUsedAt,
    };
  }

  // ── Query: diagnostics snapshot ────────────────────────────────────────────

  getLatestCoverageSnapshot(): {
    runId: string;
    representedTagCount: number;
    coveredTagCount: number;
    missingTagCount: number;
    selectedItemCount: number;
    queuedVariantJobs: number;
    status: BootstrapRunStatus;
    startedAt: number;
    completedAt: number | null;
  } | null {
    const row = this.db
      .prepare(
        `SELECT runId, representedTagCount, coveredTagCount, missingTagCount,
                selectedItemCount, queuedVariantJobs, status, startedAt, completedAt
         FROM bootstrap_coverage_runs
         ORDER BY startedAt DESC
         LIMIT 1`,
      )
      .get() as CoverageRunRow | undefined;

    if (!row) {
      return null;
    }

    return {
      runId: row.runId,
      representedTagCount: row.representedTagCount,
      coveredTagCount: row.coveredTagCount,
      missingTagCount: row.missingTagCount,
      selectedItemCount: row.selectedItemCount,
      queuedVariantJobs: row.queuedVariantJobs,
      status: row.status as BootstrapRunStatus,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    };
  }

  getReadyVariantCountByProfile(): Record<BootstrapProfile, number> {
    const rows = this.db
      .prepare(
        `SELECT profile, COUNT(*) AS cnt
         FROM bootstrap_profile_variants
         WHERE isReady = 1 AND isStale = 0
         GROUP BY profile`,
      )
      .all() as Array<{ profile: string; cnt: number }>;

    const result: Record<BootstrapProfile, number> = {
      native: 0,
      plex: 0,
      jellyfin: 0,
    };

    for (const row of rows) {
      if (
        row.profile === "native" ||
        row.profile === "plex" ||
        row.profile === "jellyfin"
      ) {
        result[row.profile] = row.cnt;
      }
    }

    return result;
  }

  /**
   * Returns all pool items with their resolved file paths.
   * Used by the prewarm service to process newly added items.
   */
  findAllPoolItemsWithPaths(): Array<{
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    path: string;
  }> {
    const rows = this.db
      .prepare(
        `SELECT bpi.poolItemId, bpi.mediaItemId, bpi.mediaType,
                COALESCE(m.path, e.path) AS path
         FROM bootstrap_pool_items bpi
         LEFT JOIN movies m
           ON bpi.mediaType = 'Movie' AND m.mediaItemId = bpi.mediaItemId
         LEFT JOIN episodes e
           ON bpi.mediaType = 'Episode' AND e.mediaItemId = bpi.mediaItemId
         WHERE COALESCE(m.path, e.path) IS NOT NULL`,
      )
      .all() as Array<{
      poolItemId: string;
      mediaItemId: string;
      mediaType: string;
      path: string;
    }>;

    return rows.map((r) => ({
      poolItemId: r.poolItemId,
      mediaItemId: r.mediaItemId,
      mediaType: r.mediaType as "Movie" | "Episode",
      path: r.path,
    }));
  }

  // ── Query: incremental coverage triggers ──────────────────────────────────

  /**
   * Find the poolItemId for a media item that is already in the pool.
   * Used by incremental triggers to reuse existing pool items instead of creating duplicates.
   */
  findPoolItemIdByMediaItemId(
    mediaItemId: string,
    mediaType: "Movie" | "Episode",
  ): string | null {
    const row = this.db
      .prepare(
        `SELECT poolItemId
         FROM bootstrap_pool_items
         WHERE mediaItemId = ? AND mediaType = ?
         LIMIT 1`,
      )
      .get(mediaItemId, mediaType) as { poolItemId: string } | undefined;

    return row?.poolItemId ?? null;
  }

  /**
   * Check if a tag already has a pool item covering it.
   * Used by incremental auto-triggers to avoid duplicate work.
   */
  findPoolItemByTag(tagId: string): { poolItemId: string } | null {
    const row = this.db
      .prepare(
        `SELECT poolItemId
         FROM bootstrap_pool_item_tags
         WHERE tagId = ?
         LIMIT 1`,
      )
      .get(tagId) as { poolItemId: string } | undefined;

    return row ?? null;
  }

  /**
   * Returns the total count of pool items.
   * Used to check if pool is empty (for first-item fallback).
   */
  getPoolSize(): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) AS cnt FROM bootstrap_pool_items`)
      .get() as { cnt: number } | undefined;

    return row?.cnt ?? 0;
  }

  /**
   * Clears all pre-transcoded variant records from the database.
   * Note: This does NOT delete the actual files on disk.
   */
  clearAllVariants(): void {
    this.db.prepare(`DELETE FROM bootstrap_profile_variants`).run();
  }
}

export const bootstrapPoolRepository = new BootstrapPoolRepository();
