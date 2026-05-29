import { commercialRepository } from "../repositories/commercialRepository.js";
import { playoutRepository } from "../repositories/playoutRepository.js";

const SAMPLE_GAP_COUNT = 6;
const MIN_COMMERCIAL_DURATION = 5; // seconds

export type CadenceCommercialViabilityResult = {
  canRun: boolean;
  totalGapSeconds: number;
  totalUniqueCommercialSeconds: number;
  uniqueCommercialCount: number;
  diagnostics: string[];
};

/**
 * Determines whether the current commercial inventory can viably fill
 * cadenced buffer gaps over a simulated 3-hour window.
 *
 * Strategy:
 *  1. Sample SAMPLE_GAP_COUNT random buffer gaps from real episode/movie data
 *     (gap = durationLimit - duration, i.e. the structural gap left for commercials).
 *  2. Sum those gaps to get the total commercial fill demand.
 *  3. Sum all unique commercial durations in the DB to get total supply.
 *  4. canRun = supply >= demand AND we have at least enough individual
 *     commercials to fill the largest single gap without repetition.
 */
export function checkCadenceCommercialViability(): CadenceCommercialViabilityResult {
  const diagnostics: string[] = [];

  // --- Step 1: sample realistic buffer gaps ---
  const gaps = playoutRepository.findRandomAnchorGaps(SAMPLE_GAP_COUNT);

  if (gaps.length === 0) {
    diagnostics.push("No anchor content (shows/movies) with buffer gaps found in DB.");
    return {
      canRun: false,
      totalGapSeconds: 0,
      totalUniqueCommercialSeconds: 0,
      uniqueCommercialCount: 0,
      diagnostics,
    };
  }

  const totalGapSeconds = gaps.reduce((sum, g) => sum + g, 0);
  diagnostics.push(
    `Sampled ${gaps.length} anchor gaps: [${gaps.map((g) => `${g}s`).join(", ")}] → total ${totalGapSeconds}s`,
  );

  // --- Step 2: total unique commercial supply ---
  const allCommercials = commercialRepository.findAll();
  const validCommercials = allCommercials.filter(
    (c) => c.duration != null && c.duration >= MIN_COMMERCIAL_DURATION,
  );

  const uniqueCommercialCount = validCommercials.length;
  const totalUniqueCommercialSeconds = validCommercials.reduce(
    (sum, c) => sum + (c.duration ?? 0),
    0,
  );

  diagnostics.push(
    `Commercial inventory: ${uniqueCommercialCount} unique commercials, ${totalUniqueCommercialSeconds}s total`,
  );

  if (uniqueCommercialCount === 0) {
    diagnostics.push("No valid commercials found in DB.");
    return {
      canRun: false,
      totalGapSeconds,
      totalUniqueCommercialSeconds: 0,
      uniqueCommercialCount: 0,
      diagnostics,
    };
  }

  // --- Step 3: can supply cover demand? ---
  const supplyCoversTotal = totalUniqueCommercialSeconds >= totalGapSeconds;

  // Also verify the largest single gap is coverable without repeating commercials.
  // Sort commercials descending by duration for a greedy check.
  const largestGap = Math.max(...gaps);
  const sortedDurations = validCommercials
    .map((c) => c.duration ?? 0)
    .sort((a, b) => b - a);

  let remaining = largestGap;
  for (const dur of sortedDurations) {
    if (remaining <= 0) break;
    remaining -= dur;
  }
  const largestGapCoverable = remaining <= 0;

  if (!supplyCoversTotal) {
    diagnostics.push(
      `Supply shortfall: need ${totalGapSeconds}s but only have ${totalUniqueCommercialSeconds}s of unique commercials.`,
    );
  }
  if (!largestGapCoverable) {
    diagnostics.push(
      `Largest single gap (${largestGap}s) cannot be filled by unique commercials alone.`,
    );
  }

  const canRun = supplyCoversTotal && largestGapCoverable;

  if (canRun) {
    diagnostics.push("Commercial inventory is sufficient for cadenced playback.");
  }

  return {
    canRun,
    totalGapSeconds,
    totalUniqueCommercialSeconds,
    uniqueCommercialCount,
    diagnostics,
  };
}
