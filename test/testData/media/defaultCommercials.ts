import { createCommercial } from "../../../factories/commercial.factory";
import { ageGroupTags, eraTags, genreTags } from "../tags";

function formatDurationSlug(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m${String(seconds).padStart(2, "0")}s`;
}

/**
 * Default gap-fill commercials.
 *
 * Design goals:
 * - Cover a very wide range of durations (15s-120s) for exact/near-exact fills.
 * - Keep durations heavily skewed toward longer spots.
 * - Include many irregular runtimes, not only standard :15/:30/:60 cuts.
 */
export const extendedDefaultCommercials: Commercial[] = Array.from(
  { length: 120 - 15 + 1 },
  (_, i) => 120 - i,
).map((durationSeconds) => {
  const durationSlug = formatDurationSlug(durationSeconds);

  return createCommercial(
    `Default Gap Fill Spot ${durationSlug}`,
    `default-gap-fill-${durationSlug}`,
    durationSeconds,
    `/path/commercials/default/default-gap-fill-${durationSlug}.mp4`,
    MediaType.Commercial,
    [
      genreTags.comedy,
      genreTags.drama,
      ageGroupTags.family,
      eraTags.twothousands,
    ],
  );
});
