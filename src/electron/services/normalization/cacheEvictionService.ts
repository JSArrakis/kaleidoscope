import fs from "fs";
import path from "path";
import { app } from "electron";
import { normalizationDefaults } from "./normalizationDefaults.js";

const BYTES_PER_GB = 1024 * 1024 * 1024;

interface CacheFileInfo {
  filePath: string;
  sizeBytes: number;
  mtimeMs: number;
}

export interface NormalizationCacheStats {
  cacheRoot: string;
  totalBytes: number;
  maxBytes: number;
  usageRatio: number;
  freeDiskBytes: number | null;
}

export interface CacheEvictionResult {
  deletedCount: number;
  deletedBytes: number;
  usageRatioBefore: number;
  usageRatioAfter: number;
  aggressive: boolean;
  timestamp: number;
}

function getCacheRoot(): string {
  const cacheRoot = path.join(app.getPath("userData"), "ffmpeg-playback-cache");
  if (!fs.existsSync(cacheRoot)) {
    fs.mkdirSync(cacheRoot, { recursive: true });
  }
  return cacheRoot;
}

function listCacheFiles(cacheRoot: string): CacheFileInfo[] {
  const entries = fs.readdirSync(cacheRoot, { withFileTypes: true });
  const files: CacheFileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const filePath = path.join(cacheRoot, entry.name);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      continue;
    }

    files.push({
      filePath,
      sizeBytes: stats.size,
      mtimeMs: stats.mtimeMs,
    });
  }

  return files;
}

function getFreeDiskBytes(cacheRoot: string): number | null {
  if (typeof fs.statfsSync !== "function") {
    return null;
  }

  try {
    const stats = fs.statfsSync(cacheRoot);
    const bavail =
      typeof stats.bavail === "bigint" ? stats.bavail : BigInt(stats.bavail);
    const bsize =
      typeof stats.bsize === "bigint" ? stats.bsize : BigInt(stats.bsize);
    return Number(bavail * bsize);
  } catch {
    return null;
  }
}

export function getNormalizationCacheStats(): NormalizationCacheStats {
  const cacheRoot = getCacheRoot();
  const files = listCacheFiles(cacheRoot);
  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
  const maxBytes = normalizationDefaults.CACHE_MAX_SIZE_GB * BYTES_PER_GB;

  return {
    cacheRoot,
    totalBytes,
    maxBytes,
    usageRatio: maxBytes > 0 ? totalBytes / maxBytes : 0,
    freeDiskBytes: getFreeDiskBytes(cacheRoot),
  };
}

function shouldEvict(stats: NormalizationCacheStats): boolean {
  const underDiskFloor =
    typeof stats.freeDiskBytes === "number" &&
    stats.freeDiskBytes < normalizationDefaults.MIN_FREE_DISK_GB * BYTES_PER_GB;

  if (underDiskFloor) {
    return true;
  }

  return stats.usageRatio >= normalizationDefaults.CACHE_SOFT_WATERMARK;
}

export function evictNormalizationCacheIfNeeded(): number {
  const result = evictNormalizationCacheWithResult();
  return result.deletedCount;
}

export function evictNormalizationCacheWithResult(): CacheEvictionResult {
  const stats = getNormalizationCacheStats();

  const createResult = (
    deletedCount: number,
    deletedBytes: number,
    aggressive: boolean,
    usageRatioAfter: number,
  ): CacheEvictionResult => ({
    deletedCount,
    deletedBytes,
    usageRatioBefore: stats.usageRatio,
    usageRatioAfter,
    aggressive,
    timestamp: Date.now(),
  });

  if (!shouldEvict(stats)) {
    return createResult(0, 0, false, stats.usageRatio);
  }

  const cacheRoot = stats.cacheRoot;
  const files = listCacheFiles(cacheRoot).sort((a, b) => a.mtimeMs - b.mtimeMs);

  const targetBytes =
    normalizationDefaults.CACHE_TARGET_AFTER_EVICT * stats.maxBytes;
  const aggressive =
    stats.usageRatio >= normalizationDefaults.CACHE_HARD_WATERMARK ||
    (typeof stats.freeDiskBytes === "number" &&
      stats.freeDiskBytes <
        normalizationDefaults.MIN_FREE_DISK_GB * BYTES_PER_GB);

  const batchLimitBytes = aggressive
    ? Number.POSITIVE_INFINITY
    : normalizationDefaults.EVICTION_BATCH_GB * BYTES_PER_GB;

  let deletedCount = 0;
  let deletedBytes = 0;
  let currentBytes = stats.totalBytes;

  for (const file of files) {
    const reachedTarget = currentBytes <= targetBytes;
    const reachedBatchLimit = deletedBytes >= batchLimitBytes;

    if (reachedTarget || reachedBatchLimit) {
      break;
    }

    try {
      fs.unlinkSync(file.filePath);
      deletedCount += 1;
      deletedBytes += file.sizeBytes;
      currentBytes -= file.sizeBytes;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[CacheEviction] Failed to delete ${file.filePath}: ${message}`,
      );
    }
  }

  if (deletedCount > 0) {
    console.log(
      `[CacheEviction] Deleted ${deletedCount} file(s), reclaimed ${(deletedBytes / BYTES_PER_GB).toFixed(2)} GB`,
    );
  }

  const usageRatioAfter =
    stats.maxBytes > 0 ? Math.max(0, currentBytes / stats.maxBytes) : 0;

  return createResult(deletedCount, deletedBytes, aggressive, usageRatioAfter);
}
