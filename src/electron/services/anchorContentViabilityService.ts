import { playoutRepository } from "../repositories/playoutRepository.js";

const ONE_DAY_SECONDS = 86_400;

export type AnchorContentViabilityResult = {
  hasFullDay: boolean;
  totalContentSeconds: number;
  totalContentCount: number;
  diagnostics: string[];
};

/**
 * Checks whether the library contains at least one full day's worth of unique
 * anchor content (movies + episodes combined).
 *
 * Each movie and each episode is counted once. If the sum of their durations
 * reaches 86 400 seconds (24 hours), hasFullDay is true. If not, the caller
 * should warn the user that their stream will repeat content within the day.
 */
export function checkAnchorContentViability(): AnchorContentViabilityResult {
  const diagnostics: string[] = [];

  const { totalSeconds, totalCount } =
    playoutRepository.findAnchorContentInventory();

  diagnostics.push(
    `Anchor inventory: ${totalCount} items, ${totalSeconds}s (${(totalSeconds / 3600).toFixed(1)} hrs)`,
  );

  const hasFullDay = totalSeconds >= ONE_DAY_SECONDS;

  if (!hasFullDay) {
    const shortfallSeconds = ONE_DAY_SECONDS - totalSeconds;
    diagnostics.push(
      `Shortfall: ${shortfallSeconds}s (${(shortfallSeconds / 3600).toFixed(1)} hrs) below 24-hour threshold — stream will repeat content.`,
    );
  } else {
    diagnostics.push(
      "Library has sufficient content for a full day without repetition.",
    );
  }

  return {
    hasFullDay,
    totalContentSeconds: totalSeconds,
    totalContentCount: totalCount,
    diagnostics,
  };
}
