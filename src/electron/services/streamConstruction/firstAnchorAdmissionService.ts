import { selectRandomShowOrMovie } from "./mediaSelector.js";
import { normalizationDefaults } from "../normalization/normalizationDefaults.js";
import { estimateNormalizationSecondsForMediaPath } from "../normalization/normalizationWorker.js";
import { getCachedElectronPlayablePathIfReady } from "../ffmpegPlaybackProxy.js";
import {
  selectBootstrapFirstAnchor,
  recordBootstrapFirstAnchorUsed,
} from "../bootstrap/bootstrapFirstAnchorSelector.js";

// Feature flag: enable bootstrap-first selection.
// Default off during rollout; set ENABLE_BOOTSTRAP_SELECTOR=1 to enable.
const ENABLE_BOOTSTRAP_SELECTOR = process.env.ENABLE_BOOTSTRAP_SELECTOR === "1";

export interface FirstAnchorAdmissionResult {
  selectedFirstMedia: Movie | Episode | null;
  requiresPreparation: boolean;
  admissionReason: string;
  estimatedNormalizeSeconds: number | null;
  evaluatedCandidates: number;
  warmupWindowSeconds: number;
}

interface FirstAnchorCandidate {
  media: Movie | Episode;
  estimatedNormalizeSeconds: number;
}

interface CachedPlayableCandidate {
  media: Movie | Episode;
  playablePath: string;
}

interface SelectFirstAnchorArgs {
  timepoint: number;
  iterationDuration: number;
  ageGroupTags: Tag[];
  warmupWindowSeconds: number;
  preferredCandidate?: Movie | Episode | null;
}

function getCandidateId(media: Movie | Episode): string {
  return media.mediaItemId || media.path;
}

function getDurationFallback(media: Movie | Episode): number {
  return media.duration || media.durationLimit || 0;
}

function withResolvedPath(
  media: Movie | Episode,
  playablePath: string,
): Movie | Episode {
  return {
    ...media,
    path: playablePath,
  };
}

async function estimateCandidate(
  media: Movie | Episode,
): Promise<FirstAnchorCandidate | null> {
  if (!media.path) {
    return null;
  }

  const estimatedNormalizeSeconds =
    await estimateNormalizationSecondsForMediaPath(
      media.path,
      getDurationFallback(media),
    );

  return {
    media,
    estimatedNormalizeSeconds,
  };
}

async function buildCandidatePool(
  args: SelectFirstAnchorArgs,
): Promise<FirstAnchorCandidate[]> {
  const candidates: FirstAnchorCandidate[] = [];
  const seen = new Set<string>();

  if (args.preferredCandidate) {
    const preferredEstimate = await estimateCandidate(args.preferredCandidate);
    if (preferredEstimate) {
      candidates.push(preferredEstimate);
      seen.add(getCandidateId(preferredEstimate.media));
    }
  }

  const maxCandidates = normalizationDefaults.ANCHOR_SELECTION_LOOKAHEAD_COUNT;
  const maxAttempts = Math.max(maxCandidates * 4, maxCandidates + 4);

  let attempts = 0;
  while (candidates.length < maxCandidates && attempts < maxAttempts) {
    attempts += 1;

    const candidate = selectRandomShowOrMovie(
      args.timepoint,
      args.iterationDuration,
      args.ageGroupTags,
    );

    if (!candidate) {
      continue;
    }

    const id = getCandidateId(candidate);
    if (seen.has(id)) {
      continue;
    }

    const estimated = await estimateCandidate(candidate);
    if (!estimated) {
      continue;
    }

    seen.add(id);
    candidates.push(estimated);
  }

  return candidates;
}

export async function selectFirstAnchorForCadencedStartup(
  args: SelectFirstAnchorArgs,
): Promise<FirstAnchorAdmissionResult> {
  // Bootstrap-first: try the pre-warmed pool before falling back to on-demand
  // admission. Guarded by feature flag so it's off by default during rollout.
  if (ENABLE_BOOTSTRAP_SELECTOR) {
    const now = Math.floor(Date.now() / 1000);
    const bootstrapCandidate = selectBootstrapFirstAnchor({
      profile: "native",
      now,
    });

    if (bootstrapCandidate) {
      recordBootstrapFirstAnchorUsed(bootstrapCandidate.poolItemId, now);
      const media = {
        mediaItemId: bootstrapCandidate.mediaItemId,
        path: bootstrapCandidate.playablePath,
      } as Movie | Episode;
      console.log(
        `[FirstAnchorAdmission] Bootstrap candidate selected poolItemId=${bootstrapCandidate.poolItemId} mediaItemId=${bootstrapCandidate.mediaItemId}`,
      );
      return {
        selectedFirstMedia: media,
        requiresPreparation: false,
        admissionReason: "Bootstrap pool: pre-warmed candidate selected",
        estimatedNormalizeSeconds: 0,
        evaluatedCandidates: 1,
        warmupWindowSeconds: args.warmupWindowSeconds,
      };
    }
  }

  const candidatePool = await buildCandidatePool(args);

  if (candidatePool.length === 0) {
    return {
      selectedFirstMedia: args.preferredCandidate || null,
      requiresPreparation: true,
      admissionReason: "No candidate pool available for first-anchor admission",
      estimatedNormalizeSeconds: null,
      evaluatedCandidates: 0,
      warmupWindowSeconds: args.warmupWindowSeconds,
    };
  }

  const effectiveWarmup = Math.max(0, args.warmupWindowSeconds);
  const admissionBudgetSeconds =
    effectiveWarmup - normalizationDefaults.FIRST_ANCHOR_SAFETY_MARGIN_SEC;

  const passingCandidate = candidatePool.find(
    (candidate) =>
      candidate.estimatedNormalizeSeconds <= admissionBudgetSeconds,
  );

  if (passingCandidate) {
    return {
      selectedFirstMedia: passingCandidate.media,
      requiresPreparation: false,
      admissionReason: "Selected first anchor within normalization budget",
      estimatedNormalizeSeconds: passingCandidate.estimatedNormalizeSeconds,
      evaluatedCandidates: candidatePool.length,
      warmupWindowSeconds: args.warmupWindowSeconds,
    };
  }

  const fallbackCandidate = [...candidatePool].sort(
    (left, right) =>
      left.estimatedNormalizeSeconds - right.estimatedNormalizeSeconds,
  )[0];

  return {
    selectedFirstMedia: fallbackCandidate.media,
    requiresPreparation: true,
    admissionReason:
      "No candidate met warmup budget; selected fastest candidate and marked preparation required",
    estimatedNormalizeSeconds: fallbackCandidate.estimatedNormalizeSeconds,
    evaluatedCandidates: candidatePool.length,
    warmupWindowSeconds: args.warmupWindowSeconds,
  };
}

export async function selectFirstAnchorForCachedUncadencedStartup(
  args: SelectFirstAnchorArgs,
): Promise<FirstAnchorAdmissionResult> {
  // Bootstrap-first: same bootstrap path as cadenced startup
  if (ENABLE_BOOTSTRAP_SELECTOR) {
    const now = Math.floor(Date.now() / 1000);
    const bootstrapCandidate = selectBootstrapFirstAnchor({
      profile: "native",
      now,
    });

    if (bootstrapCandidate) {
      recordBootstrapFirstAnchorUsed(bootstrapCandidate.poolItemId, now);
      const media = {
        mediaItemId: bootstrapCandidate.mediaItemId,
        path: bootstrapCandidate.playablePath,
      } as Movie | Episode;
      console.log(
        `[FirstAnchorAdmission] Bootstrap candidate selected (uncadenced) poolItemId=${bootstrapCandidate.poolItemId}`,
      );
      return {
        selectedFirstMedia: media,
        requiresPreparation: false,
        admissionReason:
          "Bootstrap pool: pre-warmed candidate selected (uncadenced)",
        estimatedNormalizeSeconds: 0,
        evaluatedCandidates: 1,
        warmupWindowSeconds: args.warmupWindowSeconds,
      };
    }
  }

  const candidatePool = await buildCandidatePool(args);

  if (candidatePool.length === 0) {
    return {
      selectedFirstMedia: args.preferredCandidate || null,
      requiresPreparation: true,
      admissionReason: "No candidate pool available for cached-start admission",
      estimatedNormalizeSeconds: null,
      evaluatedCandidates: 0,
      warmupWindowSeconds: args.warmupWindowSeconds,
    };
  }

  let bestCachedCandidate: CachedPlayableCandidate | null = null;

  for (const candidate of candidatePool) {
    const playablePath = await getCachedElectronPlayablePathIfReady(
      candidate.media.path,
    );

    if (!playablePath) {
      continue;
    }

    bestCachedCandidate = {
      media: candidate.media,
      playablePath,
    };
    break;
  }

  if (bestCachedCandidate) {
    return {
      selectedFirstMedia: withResolvedPath(
        bestCachedCandidate.media,
        bestCachedCandidate.playablePath,
      ),
      requiresPreparation: false,
      admissionReason:
        "Selected first anchor with cached/playable path for fast uncadenced startup",
      estimatedNormalizeSeconds: 0,
      evaluatedCandidates: candidatePool.length,
      warmupWindowSeconds: args.warmupWindowSeconds,
    };
  }

  const fallbackCandidate = [...candidatePool].sort(
    (left, right) =>
      left.estimatedNormalizeSeconds - right.estimatedNormalizeSeconds,
  )[0];

  return {
    selectedFirstMedia: fallbackCandidate.media,
    requiresPreparation: true,
    admissionReason:
      "No cached/playable candidate found; selected fastest candidate and marked preparation required",
    estimatedNormalizeSeconds: fallbackCandidate.estimatedNormalizeSeconds,
    evaluatedCandidates: candidatePool.length,
    warmupWindowSeconds: args.warmupWindowSeconds,
  };
}
