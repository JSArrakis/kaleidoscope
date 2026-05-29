import { EventEmitter } from "events";
import { normalizationDefaults } from "./normalizationDefaults.js";
import { NormalizationJob } from "./normalizationJobFactory.js";
import { normalizeJob, NormalizationResult } from "./normalizationWorker.js";
import {
  evictNormalizationCacheWithResult,
  getNormalizationCacheStats,
  CacheEvictionResult,
} from "./cacheEvictionService.js";

interface SourceWaiter {
  resolve: (normalizedPath: string) => void;
  reject: (error: Error) => void;
}

export interface NormalizationQueueSnapshot {
  queuedCount: number;
  activeCount: number;
  normalizedCount: number;
  failedCount: number;
}

export interface NormalizationFailureSummary {
  sourcePath: string;
  message: string;
  timestamp: number;
}

export interface NormalizationStatusSnapshot {
  queue: NormalizationQueueSnapshot;
  cache: ReturnType<typeof getNormalizationCacheStats>;
  recentFailures: NormalizationFailureSummary[];
  lastEviction: CacheEvictionResult | null;
}

class NormalizationQueue extends EventEmitter {
  private readonly pendingJobs: NormalizationJob[] = [];
  private readonly queuedSources = new Set<string>();
  private readonly activeSources = new Set<string>();
  private readonly normalizedBySource = new Map<string, string>();
  private readonly failedBySource = new Map<string, Error>();
  private readonly waitersBySource = new Map<string, SourceWaiter[]>();
  private readonly recentFailures: NormalizationFailureSummary[] = [];
  private lastEviction: CacheEvictionResult | null = null;
  private completedSinceLastEvictionCheck = 0;

  enqueue(jobs: NormalizationJob[]): number {
    let addedCount = 0;

    for (const job of jobs) {
      if (this.normalizedBySource.has(job.sourcePath)) {
        continue;
      }

      if (this.queuedSources.has(job.sourcePath)) {
        continue;
      }

      if (this.activeSources.has(job.sourcePath)) {
        continue;
      }

      this.pendingJobs.push(job);
      this.queuedSources.add(job.sourcePath);
      addedCount += 1;
    }

    if (addedCount > 0) {
      this.processNext();
    }

    return addedCount;
  }

  getNormalizedPathIfReady(sourcePath: string): string | null {
    return this.normalizedBySource.get(sourcePath) || null;
  }

  async waitForNormalizedPath(sourcePath: string): Promise<string> {
    const existing = this.normalizedBySource.get(sourcePath);
    if (existing) {
      return existing;
    }

    const failed = this.failedBySource.get(sourcePath);
    if (failed) {
      throw failed;
    }

    return await new Promise<string>((resolve, reject) => {
      const waiters = this.waitersBySource.get(sourcePath) || [];
      waiters.push({ resolve, reject });
      this.waitersBySource.set(sourcePath, waiters);
    });
  }

  getSnapshot(): NormalizationQueueSnapshot {
    return {
      queuedCount: this.pendingJobs.length,
      activeCount: this.activeSources.size,
      normalizedCount: this.normalizedBySource.size,
      failedCount: this.failedBySource.size,
    };
  }

  runEvictionPass(): number {
    const eviction = evictNormalizationCacheWithResult();
    this.lastEviction = eviction;
    return eviction.deletedCount;
  }

  getCacheStats() {
    return getNormalizationCacheStats();
  }

  getStatusSnapshot(): NormalizationStatusSnapshot {
    return {
      queue: this.getSnapshot(),
      cache: this.getCacheStats(),
      recentFailures: [...this.recentFailures],
      lastEviction: this.lastEviction,
    };
  }

  private processNext(): void {
    while (
      this.activeSources.size < normalizationDefaults.NORMALIZATION_WORKERS &&
      this.pendingJobs.length > 0
    ) {
      const job = this.pendingJobs.shift();
      if (!job) {
        return;
      }

      this.queuedSources.delete(job.sourcePath);
      this.activeSources.add(job.sourcePath);

      void this.runJob(job)
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[NormalizationQueue] Failed job for ${job.sourcePath}: ${message}`,
          );
        })
        .finally(() => {
          this.activeSources.delete(job.sourcePath);
          this.processNext();
        });
    }
  }

  private async runJob(job: NormalizationJob): Promise<void> {
    try {
      const result = await normalizeJob(job);
      this.normalizedBySource.set(job.sourcePath, result.normalizedPath);
      this.failedBySource.delete(job.sourcePath);
      this.resolveWaiters(job.sourcePath, result.normalizedPath);
      this.emit("normalized", result);
      this.logNormalized(result);
      this.completedSinceLastEvictionCheck += 1;

      if (
        this.completedSinceLastEvictionCheck >=
        normalizationDefaults.NORMALIZATION_WORKERS
      ) {
        this.completedSinceLastEvictionCheck = 0;
        this.lastEviction = evictNormalizationCacheWithResult();
      }
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      this.failedBySource.set(job.sourcePath, normalizedError);
      this.recentFailures.unshift({
        sourcePath: job.sourcePath,
        message: normalizedError.message,
        timestamp: Date.now(),
      });
      this.recentFailures.splice(10);
      this.rejectWaiters(job.sourcePath, normalizedError);
      this.emit("failed", {
        sourcePath: job.sourcePath,
        error: normalizedError,
      });
      throw normalizedError;
    }
  }

  private resolveWaiters(sourcePath: string, normalizedPath: string): void {
    const waiters = this.waitersBySource.get(sourcePath);
    if (!waiters || waiters.length === 0) {
      return;
    }

    for (const waiter of waiters) {
      waiter.resolve(normalizedPath);
    }

    this.waitersBySource.delete(sourcePath);
  }

  private rejectWaiters(sourcePath: string, error: Error): void {
    const waiters = this.waitersBySource.get(sourcePath);
    if (!waiters || waiters.length === 0) {
      return;
    }

    for (const waiter of waiters) {
      waiter.reject(error);
    }

    this.waitersBySource.delete(sourcePath);
  }

  private logNormalized(result: NormalizationResult): void {
    console.log(
      `[NormalizationQueue] Normalized ${result.sourcePath} -> ${result.normalizedPath} strategy=${result.strategy} estimated=${result.estimatedSeconds.toFixed(1)}s`,
    );
  }
}

export const normalizationQueue = new NormalizationQueue();
