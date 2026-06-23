import fs from "fs";
import path from "path";
import { app } from "electron";

/**
 * Bootstrap Activity Logger
 * Persists detailed logs of all bootstrap pipeline events to a file.
 * Used for testing and validating bootstrap coverage behavior.
 */

const LOG_FILE_NAME = "bootstrap-activity.log";

class BootstrapLogger {
  private logFilePath: string;
  private logBuffer: string[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.logFilePath = path.join(userDataPath, LOG_FILE_NAME);
    this.initializeLogFile();
  }

  private initializeLogFile(): void {
    try {
      // Write header on first run or append separator if file exists
      if (!fs.existsSync(this.logFilePath)) {
        const header = [
          "=".repeat(80),
          `Bootstrap Activity Log - Started ${new Date().toISOString()}`,
          "=".repeat(80),
          "",
        ].join("\n");
        fs.writeFileSync(this.logFilePath, header, "utf-8");
      } else {
        const separator = [
          "",
          "",
          "=".repeat(80),
          `Log Session Started - ${new Date().toISOString()}`,
          "=".repeat(80),
          "",
        ].join("\n");
        fs.appendFileSync(this.logFilePath, separator, "utf-8");
      }
      console.log(`[BootstrapLogger] Logging to: ${this.logFilePath}`);
    } catch (error) {
      console.error("[BootstrapLogger] Failed to initialize log file:", error);
    }
  }

  private formatTimestamp(): string {
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  private write(level: string, category: string, message: string): void {
    const timestamp = this.formatTimestamp();
    const logLine = `${timestamp} [${level}] [${category}] ${message}`;

    // Console output with color coding
    console.log(logLine);

    // Buffer for file writing
    this.logBuffer.push(logLine);

    // Debounced flush to file
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => this.flush(), 100);
  }

  private flush(): void {
    if (this.logBuffer.length === 0) return;

    try {
      const content = this.logBuffer.join("\n") + "\n";
      fs.appendFileSync(this.logFilePath, content, "utf-8");
      this.logBuffer = [];
    } catch (error) {
      console.error("[BootstrapLogger] Failed to flush logs:", error);
    }
  }

  // ── Media Ingest Events ────────────────────────────────────────────────────

  logMediaIngested(input: {
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    title: string;
    tags: string[];
  }): void {
    this.write(
      "INFO",
      "MEDIA_INGEST",
      `${input.mediaType} ingested: "${input.title}" (${input.mediaItemId}) | Tags: [${input.tags.join(", ")}]`,
    );
  }

  // ── Bootstrap Coverage Trigger Events ──────────────────────────────────────

  logCoverageTriggerCheck(input: {
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    genreAestheticTagCount: number;
    poolSize: number;
  }): void {
    this.write(
      "DEBUG",
      "TRIGGER_CHECK",
      `Checking coverage trigger for ${input.mediaType} ${input.mediaItemId} | Genre/Aesthetic tags: ${input.genreAestheticTagCount} | Current pool size: ${input.poolSize}`,
    );
  }

  logUncoveredTagDetected(input: { tagId: string; tagType: string }): void {
    this.write(
      "INFO",
      "TRIGGER_UNCOVERED",
      `Uncovered tag detected: ${input.tagType} ${input.tagId} - adding media to pool`,
    );
  }

  logFirstUntaggedFallback(input: {
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
  }): void {
    this.write(
      "INFO",
      "TRIGGER_FALLBACK",
      `✅ First untagged ${input.mediaType} (${input.mediaItemId}) - adding to pool as bootstrap fallback`,
    );
  }

  logCoverageTriggerSkipped(reason: string): void {
    this.write("DEBUG", "TRIGGER_SKIP", `Coverage trigger skipped: ${reason}`);
  }

  // ── Pool Management Events ─────────────────────────────────────────────────

  logPoolItemAdded(input: {
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    tagCount: number;
  }): void {
    this.write(
      "INFO",
      "POOL_ADD",
      `Added to pool: ${input.mediaType} ${input.mediaItemId} → poolItemId=${input.poolItemId} | Tags: ${input.tagCount}`,
    );
  }

  logPoolItemTagsAssociated(input: {
    poolItemId: string;
    tags: Array<{ tagId: string; tagType: string }>;
  }): void {
    const tagSummary = input.tags
      .map((t) => `${t.tagType}:${t.tagId}`)
      .join(", ");
    this.write(
      "DEBUG",
      "POOL_TAGS",
      `Associated tags for poolItemId=${input.poolItemId} | Tags: [${tagSummary}]`,
    );
  }

  // ── Prewarm/Normalization Events ───────────────────────────────────────────

  logPrewarmQueued(input: {
    runId: string;
    poolItemId: string;
    profiles: string[];
  }): void {
    this.write(
      "INFO",
      "PREWARM_QUEUE",
      `Queued prewarm for poolItemId=${input.poolItemId} | Profiles: [${input.profiles.join(", ")}] | RunId: ${input.runId}`,
    );
  }

  logNormalizationStarted(input: {
    mediaItemId: string;
    sourcePath: string;
    profile: string;
  }): void {
    this.write(
      "INFO",
      "NORM_START",
      `Normalization started: ${input.mediaItemId} | Profile: ${input.profile} | Source: ${input.sourcePath}`,
    );
  }

  logNormalizationCompleted(input: {
    mediaItemId: string;
    profile: string;
    outputPath: string;
    durationMs: number;
  }): void {
    this.write(
      "SUCCESS",
      "NORM_COMPLETE",
      `✅ Normalization completed: ${input.mediaItemId} | Profile: ${input.profile} | Output: ${input.outputPath} | Duration: ${input.durationMs}ms`,
    );
  }

  logNormalizationFailed(input: {
    mediaItemId: string;
    profile: string;
    error: string;
  }): void {
    this.write(
      "ERROR",
      "NORM_FAILED",
      `❌ Normalization failed: ${input.mediaItemId} | Profile: ${input.profile} | Error: ${input.error}`,
    );
  }

  logVariantUpdated(input: {
    poolItemId: string;
    profile: string;
    isReady: boolean;
    playablePath: string;
  }): void {
    const status = input.isReady ? "READY ✅" : "NOT READY";
    this.write(
      "INFO",
      "VARIANT_UPDATE",
      `Variant updated: poolItemId=${input.poolItemId} | Profile: ${input.profile} | Status: ${status} | Path: ${input.playablePath}`,
    );
  }

  // ── Bootstrap Selector Events ──────────────────────────────────────────────

  logBootstrapSelectionAttempt(input: {
    profile: string;
    cooldownSeconds: number;
  }): void {
    this.write(
      "INFO",
      "SELECT_ATTEMPT",
      `Bootstrap selector invoked | Profile: ${input.profile} | Cooldown: ${input.cooldownSeconds}s`,
    );
  }

  logBootstrapSelectionSuccess(input: {
    poolItemId: string;
    mediaItemId: string;
    mediaType: "Movie" | "Episode";
    playablePath: string;
    requiresPreparation: boolean;
  }): void {
    const prepStatus = input.requiresPreparation
      ? "⚠️  REQUIRES PREPARATION"
      : "✅ READY IMMEDIATELY";
    this.write(
      "SUCCESS",
      "SELECT_SUCCESS",
      `Bootstrap anchor selected: ${input.mediaType} ${input.mediaItemId} (poolItemId=${input.poolItemId}) | ${prepStatus} | Path: ${input.playablePath}`,
    );
  }

  logBootstrapSelectionFallback(reason: string): void {
    this.write(
      "WARN",
      "SELECT_FALLBACK",
      `Bootstrap selection failed - falling back to on-demand: ${reason}`,
    );
  }

  logBootstrapAnchorUsageRecorded(input: {
    poolItemId: string;
    timestamp: number;
  }): void {
    this.write(
      "DEBUG",
      "SELECT_USAGE",
      `Recorded anchor usage: poolItemId=${input.poolItemId} | lastUsedAt=${input.timestamp}`,
    );
  }

  // ── Stream Validation Events ───────────────────────────────────────────────

  logStreamStartValidation(input: {
    hasBootstrapEnabled: boolean;
    readyCounts: { native: number; plex: number; jellyfin: number };
    totalReady: number;
    canStart: boolean;
  }): void {
    const status = input.canStart ? "✅ ALLOWED" : "❌ BLOCKED";
    this.write(
      "INFO",
      "STREAM_VALIDATION",
      `Stream start validation: ${status} | Bootstrap enabled: ${input.hasBootstrapEnabled} | Ready anchors: ${input.totalReady} (native=${input.readyCounts.native}, plex=${input.readyCounts.plex}, jellyfin=${input.readyCounts.jellyfin})`,
    );
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  logSeparator(title?: string): void {
    const separator = title
      ? `\n${"─".repeat(40)} ${title} ${"─".repeat(40)}\n`
      : `\n${"─".repeat(80)}\n`;
    this.logBuffer.push(separator);
    console.log(separator);
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }

  forceFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.flush();
  }
}

export const bootstrapLogger = new BootstrapLogger();
